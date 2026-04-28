import { Chess, type Move as ChessMove } from "chess.js";
import type { SupabaseClient } from "@supabase/supabase-js";
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

type RoomRow = {
  id: string;
  status: MultiplayerRoomState["status"];
  fen: string | null;
  pgn: string | null;
  current_turn: "w" | "b" | null;
  move_count: number | null;
  version: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type RoomPlayerRow = {
  id: string;
  room_id: string;
  player_id: string;
  role: RoomRole;
  online: boolean | null;
  joined_at: string | null;
  players?: {
    id: string;
    display_name: string;
    city: RoomProfile["city"];
    rating: number | null;
    updated_at: string | null;
  } | Array<{
    id: string;
    display_name: string;
    city: RoomProfile["city"];
    rating: number | null;
    updated_at: string | null;
  }> | null;
};

type MoveRow = {
  id: string;
  room_id: string;
  player_id: string | null;
  move_number: number;
  san: string | null;
  from_square: string | null;
  to_square: string | null;
  fen_before: string | null;
  fen_after: string | null;
  created_at: string | null;
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
const startingFen = new Chess().fen();

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
    const role = currentPlayer?.role ?? assignRole(existing.players, effectivePlayerId);
    const nextPlayer: RoomPlayer = {
      id: effectivePlayerId,
      tabToken,
      name: profile.name.trim() || "Guest Gambiteer",
      city: profile.city,
      rating: role === "white" ? 1420 : role === "black" ? 1390 : 1200,
      role,
      connected: true,
      joinedAt: currentPlayer?.joinedAt ?? now,
      lastSeen: now,
    };

    const players = [
      ...existing.players.filter((player) => player.id !== playerId),
      ...existing.players.filter((player) => player.id === playerId && playerId !== effectivePlayerId),
      nextPlayer,
    ].sort(sortPlayers);

    const next = normalizeRoom({
      ...existing,
      players,
      status: players.some((player) => player.role === "white") && players.some((player) => player.role === "black") ? "active" : "waiting",
      version: existing.version + 1,
      updatedAt: now,
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

    const validation = validateMoveAttempt(state, playerId, from, to);
    if (!validation.ok) return validation;

    const next = normalizeRoom({
      ...state,
      fen: validation.chess.fen(),
      pgn: validation.chess.pgn(),
      moves: [...state.moves, toArenaMove(validation.move, validation.chess)],
      turn: validation.chess.turn(),
      status: validation.chess.isCheckmate() ? "checkmate" : validation.chess.isDraw() ? "draw" : "active",
      result: validation.chess.isCheckmate() ? (validation.move.color === "w" ? "1-0" : "0-1") : validation.chess.isDraw() ? "1/2-1/2" : "*",
      version: state.version + 1,
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
    });
    this.writeRoom(next);
    return { ok: true, state: next };
  }

  protected readRoom(roomId: string) {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(getRoomKey(roomId));
    return raw ? parseRoom(raw) : null;
  }

  protected writeRoom(state: MultiplayerRoomState) {
    window.localStorage.setItem(getRoomKey(state.roomId), JSON.stringify(state));
    createRoomChannel(state.roomId)?.postMessage(state);
  }
}

class SupabaseRealtimeAdapter implements MultiplayerAdapter {
  mode: "local" | "supabase" = "supabase";
  private readonly fallback = new LocalBroadcastAdapter();
  private fallbackActive = false;

  async joinRoom(roomId: string, profile: RoomProfile, playerId: string, tabToken: string) {
    return this.withFallback<JoinRoomResult>(
      async (client) => {
        await this.ensureRoom(client, roomId);
        const player = await this.upsertPlayer(client, profile, playerId);
        const state = await this.fetchRoomState(client, roomId);
        const existing = state.players.find((item) => item.id === player.id);
        const role = existing?.role ?? assignRole(state.players, player.id);
        const joinedAt = existing?.joinedAt ?? new Date().toISOString();

        const { error } = await client.from("room_players").upsert({
          room_id: roomId,
          player_id: player.id,
          role,
          online: true,
          joined_at: joinedAt,
        }, { onConflict: "room_id,player_id" });

        if (error) throw error;

        await this.rebalanceJoinedPlayerRole(client, roomId, player.id);
        const nextState = await this.refreshRoomStatus(client, roomId);
        const nextRole = nextState.players.find((item) => item.id === player.id)?.role ?? role;
        return { state: nextState, role: nextRole, mode: this.mode, playerId: player.id };
      },
      () => this.fallback.joinRoom(roomId, profile, playerId, tabToken),
    );
  }

  subscribe(roomId: string, onState: (state: MultiplayerRoomState) => void) {
    if (this.fallbackActive) return this.fallback.subscribe(roomId, onState);

    const client = getSupabaseClient();
    if (!client) return this.fallback.subscribe(roomId, onState);

    let closed = false;
    const refresh = () => {
      void this.fetchRoomState(client, roomId)
        .then((state) => {
          if (!closed) onState(state);
        })
        .catch((error) => {
          console.warn("Supabase realtime refresh failed; room will keep local state.", error instanceof Error ? error.message : "Unknown error");
        });
    };

    const channel = client
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "moves", filter: `room_id=eq.${roomId}` }, refresh)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Supabase realtime subscription degraded; polling current room state.");
          refresh();
        }
      });

    refresh();

    return () => {
      closed = true;
      void client.removeChannel(channel);
    };
  }

  async submitMove(roomId: string, playerId: string, from: string, to: string) {
    if (this.fallbackActive) return this.fallback.submitMove(roomId, playerId, from, to);

    return this.withFallback<MoveResult>(
      async (client) => {
        const state = await this.fetchRoomState(client, roomId);
        const validation = validateMoveAttempt(state, playerId, from, to);
        if (!validation.ok) return validation;

        const moveNumber = state.moves.length + 1;
        const arenaMove = toArenaMove(validation.move, validation.chess);
        const nextStatus = validation.chess.isCheckmate() ? "checkmate" : validation.chess.isDraw() ? "draw" : "active";
        const result = validation.chess.isCheckmate()
          ? validation.move.color === "w" ? "1-0" : "0-1"
          : validation.chess.isDraw() ? "1/2-1/2" : "*";

        const { data: updatedRooms, error: updateError } = await client
          .from("rooms")
          .update({
            fen: validation.chess.fen(),
            pgn: validation.chess.pgn(),
            current_turn: validation.chess.turn(),
            move_count: moveNumber,
            status: nextStatus,
            version: state.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId)
          .eq("version", state.version)
          .select("id");

        if (updateError) throw updateError;
        if (!updatedRooms?.length) {
          return {
            ok: false,
            state: await this.fetchRoomState(client, roomId),
            reason: "The room updated in another tab. Syncing the latest board now.",
          };
        }

        const { error: moveError } = await client.from("moves").insert({
          room_id: roomId,
          player_id: playerId,
          move_number: moveNumber,
          san: validation.move.san,
          from_square: validation.move.from,
          to_square: validation.move.to,
          fen_before: state.fen,
          fen_after: validation.chess.fen(),
        });

        if (moveError) throw moveError;

        if (nextStatus !== "active") {
          await this.persistGame(client, roomId, result, validation.chess, moveNumber);
        }

        const next = normalizeRoom({
          ...state,
          fen: validation.chess.fen(),
          pgn: validation.chess.pgn(),
          moves: [...state.moves, arenaMove],
          turn: validation.chess.turn(),
          status: nextStatus,
          result,
          version: state.version + 1,
          updatedAt: new Date().toISOString(),
        });

        return { ok: true, state: next };
      },
      () => this.fallback.submitMove(roomId, playerId, from, to),
    );
  }

  async endRoom(roomId: string, playerId: string, status: "ended" | "draw") {
    if (this.fallbackActive) return this.fallback.endRoom(roomId, playerId, status);

    return this.withFallback<MoveResult>(
      async (client) => {
        const state = await this.fetchRoomState(client, roomId);
        const player = state.players.find((item) => item.id === playerId);
        if (!player || player.role === "spectator") return { ok: false, reason: "Only players can end this room." };

        const result = status === "draw" ? "1/2-1/2" : player.role === "white" ? "0-1" : "1-0";
        const { data, error } = await client
          .from("rooms")
          .update({
            status,
            version: state.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId)
          .eq("version", state.version)
          .select("id");

        if (error) throw error;
        if (!data?.length) return { ok: false, state: await this.fetchRoomState(client, roomId), reason: "The room changed. Syncing the latest state." };

        await this.persistGame(client, roomId, result, new Chess(state.fen), state.moves.length);

        const next = normalizeRoom({
          ...state,
          status,
          result,
          version: state.version + 1,
          updatedAt: new Date().toISOString(),
        });
        return { ok: true, state: next };
      },
      () => this.fallback.endRoom(roomId, playerId, status),
    );
  }

  private async ensureRoom(client: SupabaseClient, roomId: string) {
    const { error } = await client.from("rooms").upsert({
      id: roomId,
      status: "waiting",
      fen: startingFen,
      pgn: "",
      current_turn: "w",
      move_count: 0,
      version: 0,
    }, { onConflict: "id", ignoreDuplicates: true });

    if (error) throw error;
  }

  private async rebalanceJoinedPlayerRole(client: SupabaseClient, roomId: string, playerId: string) {
    const state = await this.fetchRoomState(client, roomId);
    if (state.players.some((player) => player.role === "black")) return;

    const whitePlayers = state.players.filter((player) => player.role === "white").sort(sortPlayers);
    if (whitePlayers.length < 2) return;

    const firstWhite = whitePlayers[0];
    const currentPlayer = whitePlayers.find((player) => player.id === playerId);
    if (!currentPlayer || currentPlayer.id === firstWhite.id) return;

    const { error } = await client
      .from("room_players")
      .update({ role: "black", online: true })
      .eq("room_id", roomId)
      .eq("player_id", playerId);

    if (error) throw error;
  }

  private async upsertPlayer(client: SupabaseClient, profile: RoomProfile, playerId: string) {
    const displayName = profile.name.trim() || "Guest Gambiteer";

    if (isUuid(playerId)) {
      const { data: existing, error: fetchError } = await client.from("players").select("id").eq("id", playerId).maybeSingle();
      if (fetchError) throw fetchError;
      if (existing) {
        const { error } = await client.from("players").update({ display_name: displayName, city: profile.city }).eq("id", playerId);
        if (error) throw error;
        return { id: playerId };
      }
    }

    const { data, error } = await client
      .from("players")
      .upsert({
        guest_id: playerId,
        display_name: displayName,
        city: profile.city,
      }, { onConflict: "guest_id" })
      .select("id")
      .single();

    if (error) throw error;
    return data as { id: string };
  }

  private async refreshRoomStatus(client: SupabaseClient, roomId: string) {
    const state = await this.fetchRoomState(client, roomId);
    const hasBoth = hasBothPlayers(state);
    const nextStatus = state.status === "waiting" && hasBoth ? "active" : state.status;
    if (nextStatus === state.status) return state;

    const { error } = await client
      .from("rooms")
      .update({ status: nextStatus, version: state.version + 1, updated_at: new Date().toISOString() })
      .eq("id", roomId);

    if (error) throw error;
    return { ...state, status: nextStatus, version: state.version + 1, updatedAt: new Date().toISOString() };
  }

  private async fetchRoomState(client: SupabaseClient, roomId: string) {
    const [roomResult, playersResult, movesResult] = await Promise.all([
      client.from("rooms").select("id,status,fen,pgn,current_turn,move_count,version,created_at,updated_at").eq("id", roomId).maybeSingle(),
      client
        .from("room_players")
        .select("id,room_id,player_id,role,online,joined_at,players(id,display_name,city,rating,updated_at)")
        .eq("room_id", roomId),
      client
        .from("moves")
        .select("id,room_id,player_id,move_number,san,from_square,to_square,fen_before,fen_after,created_at")
        .eq("room_id", roomId)
        .order("move_number", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (roomResult.error) throw roomResult.error;
    if (playersResult.error) throw playersResult.error;
    if (movesResult.error) throw movesResult.error;

    const room = roomResult.data as RoomRow | null;
    if (!room) throw new Error("Room was not found.");

    const players = ((playersResult.data ?? []) as unknown as RoomPlayerRow[]).map((row) => {
      const playerProfile = Array.isArray(row.players) ? row.players[0] : row.players;
      return {
      id: row.player_id,
      name: playerProfile?.display_name ?? "Guest Gambiteer",
      city: playerProfile?.city ?? "Almaty",
      rating: playerProfile?.rating ?? 1200,
      role: row.role,
      connected: row.online ?? true,
      joinedAt: row.joined_at ?? new Date().toISOString(),
      lastSeen: playerProfile?.updated_at ?? row.joined_at ?? new Date().toISOString(),
    } satisfies RoomPlayer;
    });

    const moves = ((movesResult.data ?? []) as MoveRow[]).map((row) => ({
      san: row.san ?? "",
      from: row.from_square ?? "",
      to: row.to_square ?? "",
      color: row.move_number % 2 === 1 ? "w" : "b",
      fenAfter: row.fen_after ?? room.fen ?? startingFen,
      moveNumber: Math.ceil(row.move_number / 2),
    } satisfies Move));

    return normalizeRoom({
      roomId: room.id,
      players,
      fen: room.fen ?? startingFen,
      pgn: room.pgn ?? "",
      moves,
      turn: room.current_turn ?? "w",
      status: room.status ?? "waiting",
      result: room.status === "draw" ? "1/2-1/2" : "*",
      version: room.version ?? 0,
      createdAt: room.created_at ?? new Date().toISOString(),
      updatedAt: room.updated_at ?? new Date().toISOString(),
    });
  }

  private async persistGame(client: SupabaseClient, roomId: string, result: MultiplayerRoomState["result"], chess: Chess, moveCount: number) {
    const state = await this.fetchRoomState(client, roomId);
    const white = state.players.find((player) => player.role === "white");
    const black = state.players.find((player) => player.role === "black");
    const { error } = await client.from("games").upsert({
      id: roomId,
      room_id: roomId,
      white_player_id: white?.id ?? null,
      black_player_id: black?.id ?? null,
      result,
      pgn: chess.pgn() || state.pgn,
      final_fen: chess.fen() || state.fen,
      move_count: moveCount,
      completed_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  private async withFallback<T>(action: (client: SupabaseClient) => Promise<T>, fallback: () => Promise<T>) {
    const client = getSupabaseClient();
    if (!client || this.fallbackActive) {
      this.mode = "local";
      this.fallbackActive = true;
      return fallback();
    }

    try {
      this.mode = "supabase";
      return await action(client);
    } catch (error) {
      console.warn("Supabase realtime unavailable; using local room fallback.", error instanceof Error ? error.message : "Unknown error");
      this.mode = "local";
      this.fallbackActive = true;
      return fallback();
    }
  }
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
    updatedAt: now,
  };
}

function normalizeRoom(state: MultiplayerRoomState): MultiplayerRoomState {
  return {
    ...state,
    players: state.players.sort(sortPlayers),
    moves: dedupeMoves(state.moves),
  };
}

function assignRole(players: RoomPlayer[], playerId?: string): RoomRole {
  const existing = players.find((player) => player.id === playerId);
  if (existing) return existing.role;
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

function validateMoveAttempt(state: MultiplayerRoomState, playerId: string, from: string, to: string) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return { ok: false as const, reason: "You are not joined to this room yet." };
  if (player.role === "spectator") return { ok: false as const, reason: "Spectators can watch, but cannot move pieces." };
  if (state.status === "waiting" || !hasBothPlayers(state)) return { ok: false as const, reason: "Waiting for opponent before the first move." };
  if (state.status !== "active") return { ok: false as const, reason: "This game is already finished." };
  if (!isPlayersTurn(player.role, state.turn)) return { ok: false as const, reason: `It is ${state.turn === "w" ? "White" : "Black"} to move.` };

  const chess = new Chess(state.fen);
  let move: ChessMove | null = null;
  try {
    move = chess.move({ from, to, promotion: "q" });
  } catch {
    return { ok: false as const, reason: "That move is not legal in this position." };
  }

  if (!move) return { ok: false as const, reason: "That move is not legal in this position." };
  if (!isPlayersTurn(player.role, move.color)) return { ok: false as const, reason: "You can only move your assigned color." };

  return { ok: true as const, chess, move };
}

function sortPlayers(a: RoomPlayer, b: RoomPlayer) {
  const order: Record<RoomRole, number> = { white: 0, black: 1, spectator: 2 };
  return order[a.role] - order[b.role] || a.joinedAt.localeCompare(b.joinedAt);
}

function dedupeMoves(moves: Move[]) {
  const seen = new Set<string>();
  return moves.filter((move, index) => {
    const key = `${index}-${move.san}-${move.from}-${move.to}-${move.fenAfter}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
    captured: move.captured,
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
