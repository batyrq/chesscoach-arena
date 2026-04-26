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
import { loadProfile, saveGameReview } from "@/lib/storage";
import type { City, Move, Player } from "@/lib/types";

export function GameClient({ roomId }: { roomId: string }) {
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<Move[]>([]);
  const [whiteClock, setWhiteClock] = useState(300);
  const [blackClock, setBlackClock] = useState(300);
  const [ended, setEnded] = useState(false);
  const [profile, setProfile] = useState<{ name: string; city: City }>({ name: "Guest Gambiteer", city: "Almaty" });

  useEffect(() => {
    const storedProfile = loadProfile();
    if (!storedProfile) return;

    startTransition(() => setProfile(storedProfile));
  }, []);

  useEffect(() => {
    if (ended || game.isGameOver()) return;
    const timer = window.setInterval(() => {
      if (game.turn() === "w") setWhiteClock((value) => Math.max(0, value - 1));
      else setBlackClock((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [ended, game]);

  const players: [Player, Player] = useMemo(() => [
    { id: "local", name: profile.name, city: profile.city, rating: 1420, color: "white", isPro: true },
    { id: "friend", name: roomId.startsWith("LOCAL") ? "Local Rival" : "Waiting Friend", city: profile.city, rating: 1390, color: "black" }
  ], [profile, roomId]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (ended) return false;

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

  function resetGame() {
    setGame(new Chess());
    setMoves([]);
    setWhiteClock(300);
    setBlackClock(300);
    setEnded(false);
  }

  function saveAndReview() {
    const gameId = `${roomId}-${Date.now()}`;
    saveGameReview(gameId, { pgn: game.pgn(), fen: game.fen(), moves });
    window.location.href = `/analysis/${gameId}`;
  }

  function playCoachStarter() {
    const starters = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"]
    ] as const;
    const starter = starters[moves.length % starters.length];
    onDrop(starter[0], starter[1]);
  }

  const status = getStatus(game, ended, whiteClock, blackClock, roomId);
  const intense = game.inCheck() || game.isCheckmate() || whiteClock === 0 || blackClock === 0;
  const turnPlayer = game.turn() === "w" ? players[0] : players[1];

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-16 md:px-8 xl:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Room {roomId}</p>
              <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black tracking-[-0.04em]">Training match</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <ShareRoomButton roomId={roomId} />
              <Button onClick={saveAndReview}>
                <Search className="h-4 w-4" /> Analyze Game
              </Button>
            </div>
          </div>
          <GameStatusBanner status={status} intense={intense} />
          <ArenaHud white={players[0]} black={players[1]} turnName={turnPlayer.name} moves={moves.length} roomId={roomId} onCoachStarter={playCoachStarter} />
          <ChessBoardPanel fen={game.fen()} onDrop={onDrop} locked={ended || game.isGameOver()} />
        </section>
        <aside className="space-y-4">
          <PlayerCard player={players[1]} active={game.turn() === "b" && !ended} clockSeconds={blackClock} />
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-xl font-bold">Move list</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{moves.length} plies</span>
            </div>
            <MoveHistory moves={moves} />
            <GameStats moves={moves} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEnded(true)}>
                <Flag className="h-3.5 w-3.5" /> Resign
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEnded(true)}>
                <Handshake className="h-3.5 w-3.5" /> Draw
              </Button>
              <Button variant="secondary" size="sm" onClick={resetGame}>
                <RotateCcw className="h-3.5 w-3.5" /> New
              </Button>
            </div>
          </Card>
          <PlayerCard player={players[0]} active={game.turn() === "w" && !ended} clockSeconds={whiteClock} />
          <Link href="/leaderboard" className="block rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:bg-white/[0.09]">
            After the review, your city result belongs on the leaderboard. Demo mode shows seeded rankings until Supabase is connected.
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}

function ArenaHud({ white, black, turnName, moves, roomId, onCoachStarter }: { white: Player; black: Player; turnName: string; moves: number; roomId: string; onCoachStarter: () => void }) {
  const friendRoom = !roomId.startsWith("LOCAL");

  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <MiniPlayer label="White" player={white} active={turnName === white.name} />
      <div className="rounded-[1.25rem] bg-slate-950/55 px-4 py-3 text-center">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Next action</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {moves === 0 ? "Drag a white piece to start" : `${turnName} to move`}
        </p>
        {friendRoom ? <p className="mt-1 text-xs text-[var(--gold)]">Invite link room</p> : null}
        {moves < 4 ? (
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

function getStatus(game: Chess, ended: boolean, whiteClock: number, blackClock: number, roomId: string) {
  if (whiteClock === 0) return "Black wins on time. Review the scramble while it is fresh.";
  if (blackClock === 0) return "White wins on time. Clean clock pressure.";
  if (ended) return "Game ended. Jump to review for coach feedback.";
  if (game.isCheckmate()) return `${game.turn() === "w" ? "Black" : "White"} wins by checkmate.`;
  if (game.isDraw()) return "Draw agreed by the position. Time to inspect the missed chances.";
  if (game.inCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move is in check.`;
  if (!roomId.startsWith("LOCAL")) return "Friend room ready. Share the invite link; until they join, you can play both sides for the demo.";
  return `${game.turn() === "w" ? "White" : "Black"} to move.`;
}
