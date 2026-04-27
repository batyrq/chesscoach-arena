"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Link from "next/link";
import { ArrowLeft, BarChart3, ChevronRight, Medal, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { CoachAnalysisCard } from "@/components/CoachAnalysisCard";
import { MoveHistory } from "@/components/MoveHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeGameFromMoves } from "@/lib/analysis";
import { createLeaderboardAdapter } from "@/lib/leaderboard";
import { loadGameReview } from "@/lib/storage";
import type { LeaderboardUpdateResult, MoveEvaluation } from "@/lib/types";

const demoPgn = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. exf6 dxc4 8. fxg7 Rg8";
type ReviewState = NonNullable<ReturnType<typeof loadGameReview>>;

export function AnalysisClient({ gameId }: { gameId: string }) {
  const [review, setReview] = useState<ReviewState | null>(null);
  const [leaderboardUpdate, setLeaderboardUpdate] = useState<LeaderboardUpdateResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const leaderboard = useMemo(() => createLeaderboardAdapter(), []);

  useEffect(() => {
    const storedReview = loadGameReview(gameId);
    startTransition(() => {
      setReview(storedReview ?? (gameId === "demo" ? createDemoReview() : null));
      setLoaded(true);
    });
  }, [gameId]);

  const analysis = useMemo(() => {
    if (!review) return null;
    return analyzeGameFromMoves(review.moves, review.fen, review.pgn);
  }, [review]);

  useEffect(() => {
    if (!analysis || !review || gameId === "demo") return;
    let cancelled = false;
    void leaderboard.recordAnalyzedGame({ gameId, analysis, result: review.result, review }).then((update) => {
      if (cancelled) return;
      startTransition(() => setLeaderboardUpdate((current) => current && !current.alreadyCounted ? current : update));
    });
    return () => {
      cancelled = true;
    };
  }, [analysis, gameId, leaderboard, review]);

  if (loaded && !review) {
    return (
      <AppShell>
        <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-5 pb-16 md:px-8">
          <Card className="w-full overflow-hidden p-0">
            <div className="relative p-8 md:p-10">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--mint)]/10 blur-3xl" />
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">No review found</p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-black tracking-[-0.04em]">This coach room is empty.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                I could not find saved moves for <span className="font-semibold text-white">{gameId}</span>. Play a local game or friend room first, then tap Analyze Game so the coach can replay the actual moves.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/lobby">Start from lobby</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/analysis/demo">View demo review</Link>
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-16 md:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-5">
          <Button asChild variant="secondary">
            <Link href="/lobby">
              <ArrowLeft className="h-4 w-4" /> Back to lobby
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">Game review</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black tracking-[-0.04em]">Coach room</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Engine-lite review replaying {review?.moves.length ?? 0} plies from this exact game. Stockfish-depth lines are ready for the Pro adapter.
            </p>
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
          {leaderboardUpdate ? <RankingUpdateCard update={leaderboardUpdate} /> : null}
          {analysis ? (
            <>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--mint)]">Move timeline</p>
                    <h2 className="mt-1 font-[var(--font-display)] text-2xl font-bold">What changed</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <MoveTimeline evaluations={analysis.evaluations} />
              </Card>
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[var(--mint)]" />
                  <h2 className="font-[var(--font-display)] text-2xl font-bold">Material swing</h2>
                </div>
                <MaterialSwing timeline={analysis.materialTimeline} />
              </Card>
            </>
          ) : null}
          {analysis ? (
            <Card className="p-5">
              <h2 className="font-[var(--font-display)] text-2xl font-bold">Phase advice</h2>
              <div className="mt-4 grid gap-3">
                <Phase title="Opening" body={analysis.phaseAdvice.opening} />
                <Phase title="Middlegame" body={analysis.phaseAdvice.middlegame} />
                <Phase title="Endgame" body={analysis.phaseAdvice.endgame} />
              </div>
              <Button asChild className="mt-5">
                <Link href="/leaderboard">See city leaderboard</Link>
              </Button>
            </Card>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}

function RankingUpdateCard({ update }: { update: LeaderboardUpdateResult }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative p-5">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[var(--mint)]/10 blur-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--mint)]">
              <Trophy className="h-4 w-4" /> City ranking updated
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">
              {update.alreadyCounted ? "This review is already counted." : `You are #${update.cityRank} in ${update.player.city}.`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {update.alreadyCounted
                ? "Refresh-safe progression is on, so games and reviews do not increment twice for the same analysis."
                : `${update.player.displayName} gained ${formatDelta(update.ratingChange)} rating and ${formatDelta(update.coachScoreChange)} coach score from this review.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1">
                {update.adapterMode === "supabase" ? "Live Supabase" : "Local demo"}
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1">
                Rank {formatRank(update.oldRank)} to {formatRank(update.newRank)}
              </span>
              {update.badgesEarned.length ? update.badgesEarned.map((badge) => (
                <span key={badge} className="rounded-full border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.1)] px-3 py-1 text-[var(--gold)]">
                  {badge}
                </span>
              )) : (
                <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1">No new badges</span>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href="/leaderboard">View City Leaderboard</Link>
          </Button>
        </div>
      </div>
    </Card>
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
      flags: move.flags,
      captured: move.captured
    };
  });

  return { pgn: demoPgn, fen: game.fen(), moves };
}

function MoveTimeline({ evaluations }: { evaluations: MoveEvaluation[] }) {
  return (
    <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
      {evaluations.length ? evaluations.map((item) => (
        <div key={item.ply} className={`rounded-[1.15rem] border p-3 ${qualityClass(item.quality)}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {item.moveNumber}{item.color === "w" ? "." : "..."} {item.san}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{item.reason}</p>
            </div>
            <span className="rounded-full bg-slate-950/55 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-300">
              {item.quality}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <ChevronRight className="h-3.5 w-3.5" /> Material after: {formatMaterial(item.materialAfter)} {item.gaveCheck ? "- check" : ""}
          </p>
        </div>
      )) : (
        <p className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Play a few moves and come back here for a move-by-move coach timeline.
        </p>
      )}
    </div>
  );
}

function MaterialSwing({ timeline }: { timeline: Array<{ ply: number; label: string; balance: number }> }) {
  if (!timeline.length) {
    return <p className="text-sm text-slate-300">No material changes yet. The board stayed balanced in the saved sequence.</p>;
  }

  return (
    <div className="space-y-3">
      {timeline.slice(-10).map((point) => {
        const width = Math.min(100, 16 + Math.abs(point.balance) * 8);
        return (
          <div key={point.ply} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 text-sm">
            <span className="truncate text-slate-400">{point.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className={`h-full rounded-full ${point.balance >= 0 ? "bg-[var(--mint)]" : "bg-[var(--coral)]"}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-right font-semibold text-white">{formatMaterial(point.balance)}</span>
          </div>
        );
      })}
    </div>
  );
}

function qualityClass(quality: MoveEvaluation["quality"]) {
  if (quality === "blunder") return "border-[var(--coral)]/35 bg-[rgba(255,127,127,0.08)]";
  if (quality === "mistake") return "border-[var(--gold)]/30 bg-[rgba(248,200,106,0.07)]";
  if (quality === "inaccuracy") return "border-white/10 bg-white/[0.05]";
  if (quality === "best") return "border-[var(--mint)]/30 bg-[rgba(118,247,203,0.08)]";
  return "border-white/10 bg-slate-950/35";
}

function formatMaterial(score: number) {
  if (score === 0) return "Equal";
  return `${score > 0 ? "White +" : "Black +"}${Math.abs(score)}`;
}

function formatDelta(value: number) {
  if (value === 0) return "+0";
  return value > 0 ? `+${value}` : value.toString();
}

function formatRank(rank: number | null) {
  return rank ? `#${rank}` : "unranked";
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
