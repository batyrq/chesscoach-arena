import { Chess, type Move as ChessMove } from "chess.js";
import { getSupabaseClient } from "@/lib/supabase";
import type { ArenaProfile } from "@/lib/storage";
import type { Move, MultiplayerRoomState, RoomPlayer, RoomRole } from "@/lib/types";

type Unsubscribe = () => void;
type RoomProfile = Pick<ArenaProfile, "name" | "city">;

export type JoinRoomResult = {
  state: MultiplayerRoomState;
  role: RoomRole;
  mode: "local" | "supabase";
  playerId: string;
};

export type MoveResult = {
  ok: boolean;
  state?: MultiplayerRoomState;
  reason?: string;
};

export interface MultiplayerAdapter {
  mode: "local" | "supabase";
  joinRoom(roomId: string, profile: RoomProfile, playerId: string, tabToken: string): Promise<JoinRoomResult>;
  subscribe(roomId: string, onState: (state: MultiplayerRoomState) => void): Unsubscribe;
  submitMove(roomId: string, playerId: string, from: string, to: string): Promise<MoveResult>;
  endRoom(roomId: string, playerId: string, status: "ended" | "draw"): Promise<MoveResult>;
}

const roomKeyPrefix = "chesscoach.room.";
const channelPrefix = "chesscoach.room.";

export function createMultiplayerAdapter(): MultiplayerAdapter {
  if (getSupabaseClient()) {
    return new SupabaseRealtimeAdapter();
  }

  return new LocalBroadcastAdapter();
}

class LocalBroadcastAdapter implements MultiplayerAdapter {
  mode: "local" | "supabase" = "local";

  async joinRoom(roomId: string, profile: RoomProfile, playerId: string, tabToken: string) {
    const now = new Date().toISOString();
    const existing = this.readRoom(roomId) ?? createEmptyRoom(roomId, now);
    const effectivePlayerId = getEffectivePlayerId(existing, playerId, now, tabToken);
    const currentPlayer = existing.players.find((player) => player.id === effectivePlayerId);
    const role = currentPlayer?.role ?? assignRole(existing.players);
    const nextPlayer: RoomPlayer = {
      id: effectivePlayerId,
      tabToken,
      name: profile.name.trim() || "Guest Gambiteer",
      city: profile.city,
      rating: role === "white" ? 1420 : role === "black" ? 1390 : 1200,
      role,
      connected: true,
      joinedAt: currentPlayer?.joinedAt ?? now,
      lastSeen: now
    };

    const players = [
      ...existing.players.filter((player) => player.id !== playerId),
      ...existing.players.filter((player) => player.id === playerId && playerId !== effectivePlayerId),
      nextPlayer
    ].sort(sortPlayers);

    const next = normalizeRoom({
      ...existing,
      players,
      status: players.some((player) => player.role === "white") && players.some((player) => player.role === "black") ? "active" : "waiting",
      version: existing.version + 1,
      updatedAt: now
    });

    this.writeRoom(next);
    return { state: next, role, mode: this.mode, playerId: effectivePlayerId };
  }

  subscribe(roomId: string, onState: (state: MultiplayerRoomState) => void) {
    const channel = createRoomChannel(roomId);
    const onMessage = (event: MessageEvent<MultiplayerRoomState>) => onState(event.data);
    channel?.addEventListener("message", onMessage);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== getRoomKey(roomId) || !event.newValue) return;
      const state = parseRoom(event.newValue);
      if (state) onState(state);
    };
    window.addEventListener("storage", onStorage);

    const current = this.readRoom(roomId);
    if (current) onState(current);

    return () => {
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }

  async submitMove(roomId: string, playerId: string, from: string, to: string) {
    const state = this.readRoom(roomId);
    if (!state) return { ok: false, reason: "Room was not found. Refresh the invite link." };

    const player = state.players.find((item) => item.id === playerId);
    if (!player) return { ok: false, reason: "You are not joined to this room yet." };
    if (player.role === "spectator") return { ok: false, reason: "Spectators can watch, but cannot move pieces." };
    if (state.status === "waiting") return { ok: false, reason: "Waiting for opponent before the first move." };
    if (state.status !== "active") return { ok: false, reason: "This game is already finished." };
    if (!hasBothPlayers(state)) return { ok: false, reason: "Waiting for opponent before the first move." };
    if (!isPlayersTurn(player.role, state.turn)) return { ok: false, reason: `It is ${state.turn === "w" ? "White" : "Black"} to move.` };

    const chess = new Chess(state.fen);
    let move: ChessMove | null = null;
    try {
      move = chess.move({ from, to, promotion: "q" });
    } catch {
      return { ok: false, reason: "That move is not legal in this position." };
    }

    if (!move || !isPlayersTurn(player.role, move.color)) {
      return { ok: false, reason: "You can only move your own pieces." };
    }

    const next = normalizeRoom({
      ...state,
      fen: chess.fen(),
      pgn: chess.pgn(),
      moves: [...state.moves, toArenaMove(move, chess)],
      turn: chess.turn(),
      status: chess.isCheckmate() ? "checkmate" : chess.isDraw() ? "draw" : "active",
      result: chess.isCheckmate() ? (move.color === "w" ? "1-0" : "0-1") : chess.isDraw() ? "1/2-1/2" : "*",
      version: state.version + 1,
      updatedAt: new Date().toISOString()
    });

    this.writeRoom(next);
    return { ok: true, state: next };
  }

  async endRoom(roomId: string, playerId: string, status: "ended" | "draw") {
    const state = this.readRoom(roomId);
    if (!state) return { ok: false, reason: "Room was not found." };

    const player = state.players.find((item) => item.id === playerId);
    if (!player || player.role === "spectator") return { ok: false, reason: "Only players can end this room." };

    const next = normalizeRoom({
      ...state,
      status,
      result: status === "draw" ? "1/2-1/2" : player.role === "white" ? "0-1" : "1-0",
      version: state.version + 1,
      updatedAt: new Date().toISOString()
    });
    this.writeRoom(next);
    return { ok: true, state: next };
  }

  private readRoom(roomId: string) {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(getRoomKey(roomId));
    return raw ? parseRoom(raw) : null;
  }

  private writeRoom(state: MultiplayerRoomState) {
    window.localStorage.setItem(getRoomKey(state.roomId), JSON.stringify(state));
    createRoomChannel(state.roomId)?.postMessage(state);
  }
}

class SupabaseRealtimeAdapter extends LocalBroadcastAdapter {
  mode: "local" | "supabase" = "supabase";
}

function createEmptyRoom(roomId: string, now: string): MultiplayerRoomState {
  const chess = new Chess();
  return {
    roomId,
    players: [],
    fen: chess.fen(),
    pgn: "",
    moves: [],
    turn: "w",
    status: "waiting",
    result: "*",
    version: 0,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeRoom(state: MultiplayerRoomState): MultiplayerRoomState {
  return {
    ...state,
    players: state.players.sort(sortPlayers)
  };
}

function assignRole(players: RoomPlayer[]): RoomRole {
  if (!players.some((player) => player.role === "white")) return "white";
  if (!players.some((player) => player.role === "black")) return "black";
  return "spectator";
}

function getEffectivePlayerId(state: MultiplayerRoomState, playerId: string, now: string, tabToken: string) {
  const existing = state.players.find((player) => player.id === playerId);
  const missingBlack = !state.players.some((player) => player.role === "black");
  const recentlySeen = existing ? Date.parse(now) - Date.parse(existing.lastSeen) < 5000 : false;
  const sameTab = existing?.tabToken === tabToken;

  if (existing?.role === "white" && missingBlack && recentlySeen && !sameTab) {
    return `player-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }

  return playerId;
}

function hasBothPlayers(state: MultiplayerRoomState) {
  return state.players.some((player) => player.role === "white") && state.players.some((player) => player.role === "black");
}

function isPlayersTurn(role: RoomRole, turn: "w" | "b") {
  return (role === "white" && turn === "w") || (role === "black" && turn === "b");
}

function sortPlayers(a: RoomPlayer, b: RoomPlayer) {
  const order: Record<RoomRole, number> = { white: 0, black: 1, spectator: 2 };
  return order[a.role] - order[b.role] || a.joinedAt.localeCompare(b.joinedAt);
}

function toArenaMove(move: ChessMove, chess: Chess): Move {
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    color: move.color,
    fenAfter: chess.fen(),
    moveNumber: Math.ceil(chess.history().length / 2),
    flags: move.flags,
    captured: move.captured
  };
}

function parseRoom(raw: string) {
  try {
    return JSON.parse(raw) as MultiplayerRoomState;
  } catch {
    return null;
  }
}

function getRoomKey(roomId: string) {
  return `${roomKeyPrefix}${roomId}`;
}

function createRoomChannel(roomId: string) {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(`${channelPrefix}${roomId}`);
}
