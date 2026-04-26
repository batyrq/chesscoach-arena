"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { ArrowLeft, Medal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { CoachAnalysisCard } from "@/components/CoachAnalysisCard";
import { MoveHistory } from "@/components/MoveHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeGameFromMoves } from "@/lib/analysis";
import { loadGameReview } from "@/lib/storage";
import type { Move } from "@/lib/types";

const demoPgn = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. exf6 dxc4 8. fxg7 Rg8";

export function AnalysisClient({ gameId }: { gameId: string }) {
  const [review] = useState<{ pgn: string; fen: string; moves: Move[] } | null>(() => loadGameReview(gameId) ?? createDemoReview());

  const analysis = useMemo(() => {
    if (!review) return null;
    return analyzeGameFromMoves(review.moves, review.fen);
  }, [review]);

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-16 md:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-5">
          <Button asChild href="/lobby" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to lobby
          </Button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">Game review</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black tracking-[-0.04em]">Coach room</h1>
          </div>
          {review ? <ChessBoardPanel fen={review.fen} locked /> : <BoardSkeleton />}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Medal className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="font-[var(--font-display)] text-xl font-bold">Move archive</h2>
            </div>
            <MoveHistory moves={review?.moves ?? []} />
          </Card>
        </section>
        <section className="space-y-5">
          {analysis ? <CoachAnalysisCard analysis={analysis} /> : <Card className="h-96 animate-pulse" />}
          {analysis ? (
            <Card className="p-5">
              <h2 className="font-[var(--font-display)] text-2xl font-bold">Phase advice</h2>
              <div className="mt-4 grid gap-3">
                <Phase title="Opening" body={analysis.phaseAdvice.opening} />
                <Phase title="Middlegame" body={analysis.phaseAdvice.middlegame} />
                <Phase title="Endgame" body={analysis.phaseAdvice.endgame} />
              </div>
              <Button asChild href="/leaderboard" className="mt-5">
                See city leaderboard
              </Button>
            </Card>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}

function createDemoReview() {
  const game = new Chess();
  game.loadPgn(demoPgn);
  const history = new Chess();
  const moves = game.history({ verbose: true }).map((move, index) => {
    history.move(move.san);
    return {
      san: move.san,
      from: move.from,
      to: move.to,
      color: move.color,
      fenAfter: history.fen(),
      moveNumber: Math.ceil((index + 1) / 2),
      flags: move.flags
    };
  });

  return { pgn: demoPgn, fen: game.fen(), moves };
}

function Phase({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function BoardSkeleton() {
  return <div className="aspect-square w-full max-w-[620px] animate-pulse rounded-[2rem] bg-white/[0.06]" />;
}
