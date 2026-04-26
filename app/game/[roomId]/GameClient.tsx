"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Chess, type Move as ChessMove } from "chess.js";
import { Flag, Handshake, RotateCcw, Search } from "lucide-react";
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
  const [profile] = useState<{ name: string; city: City }>(() => loadProfile() ?? { name: "Guest Gambiteer", city: "Almaty" });

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
        flags: move.flags
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

  const status = getStatus(game, ended, whiteClock, blackClock, roomId);
  const intense = game.inCheck() || game.isCheckmate() || whiteClock === 0 || blackClock === 0;

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
                <Search className="h-4 w-4" /> Review Game
              </Button>
            </div>
          </div>
          <GameStatusBanner status={status} intense={intense} />
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
            Your result can feed the city leaderboard once Supabase env vars are connected.
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}

function getStatus(game: Chess, ended: boolean, whiteClock: number, blackClock: number, roomId: string) {
  if (whiteClock === 0) return "Black wins on time. Review the scramble while it is fresh.";
  if (blackClock === 0) return "White wins on time. Clean clock pressure.";
  if (ended) return "Game ended. Jump to review for coach feedback.";
  if (game.isCheckmate()) return `${game.turn() === "w" ? "Black" : "White"} wins by checkmate.`;
  if (game.isDraw()) return "Draw agreed by the position. Time to inspect the missed chances.";
  if (game.inCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move is in check.`;
  if (!roomId.startsWith("LOCAL")) return "Friend room ready. Share the invite link, or play both sides for the demo.";
  return `${game.turn() === "w" ? "White" : "Black"} to move.`;
}
