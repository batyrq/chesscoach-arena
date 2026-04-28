"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Chess, type Move as ChessMove } from "chess.js";
import { Activity, Flag, Handshake, RotateCcw, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { GameStatusBanner } from "@/components/GameStatusBanner";
import { MoveHistory } from "@/components/MoveHistory";
import { PlayerCard } from "@/components/PlayerCard";
import { ShareRoomButton } from "@/components/ShareRoomButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBrowserTabToken, getOrCreateRoomPlayerId, loadProfile, saveGameReview, saveProfile, saveRoomPlayerId } from "@/lib/storage";
import { createMultiplayerAdapter } from "@/lib/multiplayer";
import type { City, Move, MultiplayerRoomState, Player, RoomRole } from "@/lib/types";

export function GameClient({ roomId }: { roomId: string }) {
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<Move[]>([]);
  const [whiteClock, setWhiteClock] = useState(300);
  const [blackClock, setBlackClock] = useState(300);
  const [ended, setEnded] = useState(false);
  const [profile, setProfile] = useState<{ name: string; city: City }>({ name: "Guest Gambiteer", city: "Almaty" });
  const [profileReady, setProfileReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [roomRole, setRoomRole] = useState<RoomRole>("spectator");
  const [realtimeMode, setRealtimeMode] = useState<"local" | "supabase">("local");
  const [moveError, setMoveError] = useState("");
  const isLocalGame = isLocalRoom(roomId);
  const adapter = useMemo(() => createMultiplayerAdapter(), []);

  useEffect(() => {
    const storedProfile = loadProfile();
    const nextPlayerId = getOrCreateRoomPlayerId(roomId);
    if (!storedProfile) {
      saveProfile({ name: "Guest Gambiteer", city: "Almaty" });
      startTransition(() => {
        setPlayerId(nextPlayerId);
        setProfileReady(true);
      });
      return;
    }

    startTransition(() => {
      setPlayerId(nextPlayerId);
      setProfile(storedProfile);
      setProfileReady(true);
    });
  }, [roomId]);

  useEffect(() => {
    if (isLocalGame || !profileReady || !playerId) return;

    let cancelled = false;
    adapter.joinRoom(roomId, profile, playerId, getBrowserTabToken()).then((result) => {
      if (cancelled) return;
      saveRoomPlayerId(roomId, result.playerId);
      startTransition(() => {
        setPlayerId(result.playerId);
        setRoomState(result.state);
        setRoomRole(result.role);
        setRealtimeMode(result.mode);
      });
    });

    const unsubscribe = adapter.subscribe(roomId, (state) => {
      startTransition(() => setRoomState((current) => current && current.version > state.version ? current : state));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adapter, isLocalGame, playerId, profile, profileReady, roomId]);

  useEffect(() => {
    if (!roomState || isLocalGame) return;

    startTransition(() => {
      setGame(new Chess(roomState.fen));
      setMoves(roomState.moves);
      setEnded(roomState.status === "ended" || roomState.status === "draw" || roomState.status === "checkmate");
    });
  }, [isLocalGame, roomState]);

  useEffect(() => {
    if (ended || game.isGameOver() || (!isLocalGame && roomRole === "spectator")) return;
    const timer = window.setInterval(() => {
      if (game.turn() === "w") setWhiteClock((value) => Math.max(0, value - 1));
      else setBlackClock((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ended, game, isLocalGame, roomRole]);

  const players: [Player, Player] = useMemo(() => [
    toDisplayPlayer(roomState, "white", profile),
    toDisplayPlayer(roomState, "black", profile, isLocalGame)
  ], [isLocalGame, profile, roomState]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (ended) return false;
    setMoveError("");

    if (!isLocalGame) {
      void submitMultiplayerMove(sourceSquare, targetSquare);
      return false;
    }

    const next = new Chess();
    const pgn = game.pgn();
    if (pgn) next.loadPgn(pgn);

    let move: ChessMove | null = null;
    try {
      move = next.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false;
    }

    if (!move) return false;

    setGame(next);
    setMoves((current) => [
      ...current,
      {
        san: move.san,
        from: move.from,
        to: move.to,
        color: move.color,
        fenAfter: next.fen(),
        moveNumber: Math.ceil(next.history().length / 2),
        flags: move.flags,
        captured: move.captured
      }
    ]);
    return true;
  }

  async function submitMultiplayerMove(sourceSquare: string, targetSquare: string) {
    if (!playerId) return;
    const result = await adapter.submitMove(roomId, playerId, sourceSquare, targetSquare);
    if (!result.ok) {
      setMoveError(result.reason ?? "Move was rejected.");
      return;
    }

    if (result.state) setRoomState(result.state);
  }

  function resetGame() {
    if (!isLocalGame) return;
    setGame(new Chess());
    setMoves([]);
    setWhiteClock(300);
    setBlackClock(300);
    setEnded(false);
  }

  function saveAndReview() {
    const gameId = `${roomId}-${Date.now()}`;
    saveGameReview(gameId, {
      pgn: roomState?.pgn ?? game.pgn(),
      fen: roomState?.fen ?? game.fen(),
      moves: roomState?.moves ?? moves,
      result: roomState?.result ?? getReviewResult(game),
      roomId
    });
    window.location.href = `/analysis/${gameId}`;
  }

  function playCoachStarter() {
    const starters = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["f8", "c5"]
    ] as const;
    const starter = starters[moves.length % starters.length];
    onDrop(starter[0], starter[1]);
  }

  async function endCurrentRoom(status: "ended" | "draw") {
    if (isLocalGame) {
      setEnded(true);
      return;
    }

    if (!playerId) return;
    const result = await adapter.endRoom(roomId, playerId, status);
    if (!result.ok) setMoveError(result.reason ?? "Could not update room.");
  }

  const status = getStatus(game, ended, whiteClock, blackClock, roomId, isLocalGame, roomState, roomRole);
  const intense = game.inCheck() || game.isCheckmate() || whiteClock === 0 || blackClock === 0;
  const turnPlayer = game.turn() === "w" ? players[0] : players[1];
  const canMove = isLocalGame || canCurrentTabMove(roomState, roomRole, game.turn());
  const roleLabel = isLocalGame ? "Practice game" : roomRole === "spectator" ? "Spectator mode" : `You are ${roomRole === "white" ? "White" : "Black"}`;

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-16 md:px-8 xl:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Room {roomId}</p>
              <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black tracking-[-0.04em]">Training match</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">{roleLabel}</span>
                {!isLocalGame ? <span className="rounded-full border border-[var(--mint)]/20 bg-[rgba(118,247,203,0.08)] px-3 py-1">{realtimeMode === "supabase" ? "Synced game" : "Guest room"}</span> : null}
                {!isLocalGame ? <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">v{roomState?.version ?? 0}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ShareRoomButton roomId={roomId} />
              <Button onClick={saveAndReview}>
                <Search className="h-4 w-4" /> Analyze Game
              </Button>
            </div>
          </div>
          <GameStatusBanner status={status} intense={intense} />
          {moveError ? <GameStatusBanner status={moveError} intense /> : null}
          <ArenaHud white={players[0]} black={players[1]} turnName={turnPlayer.name} moves={moves.length} roomId={roomId} onCoachStarter={playCoachStarter} canUseStarter={isLocalGame || canMove} roleLabel={roleLabel} />
          <ChessBoardPanel fen={game.fen()} onDrop={onDrop} locked={ended || game.isGameOver() || !canMove} />
        </section>
        <aside className="space-y-4">
          <PlayerCard player={players[1]} active={game.turn() === "b" && !ended} clockSeconds={blackClock} statusLabel={getPlayerStatus(roomState, "black", isLocalGame)} />
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-xl font-bold">Move list</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{formatPlyCount(moves.length)}</span>
            </div>
            <MoveHistory moves={moves} />
            <GameStats moves={moves} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => void endCurrentRoom("ended")}>
                <Flag className="h-3.5 w-3.5" /> Resign
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void endCurrentRoom("draw")}>
                <Handshake className="h-3.5 w-3.5" /> Draw
              </Button>
              <Button variant="secondary" size="sm" onClick={resetGame} disabled={!isLocalGame}>
                <RotateCcw className="h-3.5 w-3.5" /> New
              </Button>
            </div>
          </Card>
          <PlayerCard player={players[0]} active={game.turn() === "w" && !ended} clockSeconds={whiteClock} statusLabel={getPlayerStatus(roomState, "white", isLocalGame)} />
          <Link href="/leaderboard" className="block rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:bg-white/[0.09]">
            Review your game to appear on the city leaderboard. Sign in to keep progress across devices.
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}

function getReviewResult(game: Chess) {
  if (game.isCheckmate()) return game.turn() === "w" ? "0-1" : "1-0";
  if (game.isDraw()) return "1/2-1/2";
  return "*" as const;
}

function formatPlyCount(count: number) {
  if (count === 0) return "0 moves";
  if (count === 1) return "1 ply";
  return `${count} plies`;
}

function ArenaHud({ white, black, turnName, moves, roomId, onCoachStarter, canUseStarter, roleLabel }: { white: Player; black: Player; turnName: string; moves: number; roomId: string; onCoachStarter: () => void; canUseStarter: boolean; roleLabel: string }) {
  const friendRoom = !isLocalRoom(roomId);

  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <MiniPlayer label="White" player={white} active={turnName === white.name} />
      <div className="rounded-[1.25rem] bg-slate-950/55 px-4 py-3 text-center">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Next action</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {moves === 0 ? "Drag a white piece to start" : `${turnName} to move`}
        </p>
        <p className="mt-1 text-xs text-[var(--gold)]">{friendRoom ? "Friend room" : roleLabel}</p>
        {moves < 6 && canUseStarter ? (
          <button
            type="button"
            onClick={onCoachStarter}
            className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
          >
            Coach starter move
          </button>
        ) : null}
      </div>
      <MiniPlayer label="Black" player={black} active={turnName === black.name} />
    </div>
  );
}

function MiniPlayer({ label, player, active }: { label: string; player: Player; active: boolean }) {
  return (
    <div className={`rounded-[1.25rem] border p-3 ${active ? "border-[var(--mint)]/50 bg-[rgba(118,247,203,0.08)]" : "border-white/10 bg-slate-950/35"}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold">{player.name}</p>
      <p className="mt-1 text-xs text-slate-400">{player.city} · {player.rating}</p>
    </div>
  );
}

function GameStats({ moves }: { moves: Move[] }) {
  const captures = moves.filter((move) => move.captured);
  const checks = moves.filter((move) => move.san.includes("+") || move.san.includes("#"));
  const whiteCaptures = captures.filter((move) => move.color === "w").length;
  const blackCaptures = captures.filter((move) => move.color === "b").length;

  return (
    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Activity className="h-4 w-4 text-[var(--mint)]" /> Match pulse
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Captures" value={`${whiteCaptures}-${blackCaptures}`} />
        <Stat label="Checks" value={checks.length.toString()} />
        <Stat label="Phase" value={moves.length < 10 ? "Open" : moves.length < 32 ? "Mid" : "End"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/45 p-3">
      <p className="font-[var(--font-display)] text-lg font-bold">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function getStatus(game: Chess, ended: boolean, whiteClock: number, blackClock: number, roomId: string, isLocalGame: boolean, roomState: MultiplayerRoomState | null, roomRole: RoomRole) {
  if (whiteClock === 0) return "Black wins on time. Review the scramble while it is fresh.";
  if (blackClock === 0) return "White wins on time. Clean clock pressure.";
  if (ended) return "Game ended. Jump to review for coach feedback.";
  if (!isLocalGame && roomRole === "spectator") return "Spectator mode. You can watch the game and open the coach review.";
  if (!isLocalGame && roomState?.status === "waiting") return "Waiting for opponent. Share the invite link to assign Black.";
  if (game.isCheckmate()) return `${game.turn() === "w" ? "Black" : "White"} wins by checkmate.`;
  if (game.isDraw()) return "Draw agreed by the position. Time to inspect the missed chances.";
  if (game.inCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move is in check.`;
  if (!isLocalGame) return `${game.turn() === "w" ? "White" : "Black"} to move. Synced friend room is live.`;
  return `${game.turn() === "w" ? "White" : "Black"} to move.`;
}

function isLocalRoom(roomId: string) {
  const normalized = roomId.toLowerCase();
  return normalized === "local" || normalized.startsWith("local-");
}

function toDisplayPlayer(roomState: MultiplayerRoomState | null, role: "white" | "black", profile: { name: string; city: City }, isLocalGame?: boolean): Player {
  const roomPlayer = roomState?.players.find((player) => player.role === role);
  if (roomPlayer) {
    return {
      id: roomPlayer.id,
      name: roomPlayer.name,
      city: roomPlayer.city,
      rating: roomPlayer.rating,
      color: role,
      isPro: role === "white"
    };
  }

  if (role === "white") {
    return { id: "local", name: profile.name, city: profile.city, rating: 1420, color: "white", isPro: true };
  }

  return { id: "friend", name: isLocalGame ? "Local Rival" : "Waiting Friend", city: profile.city, rating: 1390, color: "black" };
}

function canCurrentTabMove(roomState: MultiplayerRoomState | null, role: RoomRole, turn: "w" | "b") {
  if (!roomState || roomState.status !== "active") return false;
  if (!roomState.players.some((player) => player.role === "white") || !roomState.players.some((player) => player.role === "black")) return false;
  return (role === "white" && turn === "w") || (role === "black" && turn === "b");
}

function getPlayerStatus(roomState: MultiplayerRoomState | null, role: "white" | "black", isLocalGame: boolean) {
  if (isLocalGame) return "Local";
  const player = roomState?.players.find((item) => item.role === role);
  if (!player) return "Waiting";
  return player.connected ? "Connected" : "Reconnecting";
}
