"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Link from "next/link";
import { ArrowLeft, BarChart3, ChevronRight, Crown, Medal, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { CoachAnalysisCard } from "@/components/CoachAnalysisCard";
import { MoveHistory } from "@/components/MoveHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { analyzeGameFromMoves } from "@/lib/analysis";
import type { CoachPersonality, EnhancedCoachReview } from "@/lib/coach-review";
import { createLeaderboardAdapter } from "@/lib/leaderboard";
import { loadProStatus, type ProStatus } from "@/lib/pro";
import { loadGameReview } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";
import type { LeaderboardUpdateResult, MoveEvaluation } from "@/lib/types";

const demoPgn = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. e5 d5 7. exf6 dxc4 8. fxg7 Rg8";
type ReviewState = NonNullable<ReturnType<typeof loadGameReview>>;
const coachPersonalities: CoachPersonality[] = ["Friendly Coach", "Strict Coach", "BigTech Interview Coach", "Meme Coach"];
const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export function AnalysisClient({ gameId }: { gameId: string }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const [review, setReview] = useState<ReviewState | null>(null);
  const [leaderboardUpdate, setLeaderboardUpdate] = useState<LeaderboardUpdateResult | null>(null);
  const [personality, setPersonality] = useState<CoachPersonality>("Friendly Coach");
  const [enhancedReview, setEnhancedReview] = useState<EnhancedCoachReview | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState("");
  const [proStatus, setProStatus] = useState<ProStatus>(initialProStatus);
  const [loaded, setLoaded] = useState(false);
  const leaderboard = useMemo(() => createLeaderboardAdapter(), []);

  useEffect(() => {
    const storedReview = loadGameReview(gameId);
    startTransition(() => {
      setReview(storedReview ?? (gameId === "demo" ? createDemoReview() : null));
      setProStatus(loadProStatus());
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

  useEffect(() => {
    if (!analysis || !review || gameId === "demo") return;
    const local = loadEnhancedCoachReview(gameId);
    if (local) {
      startTransition(() => setEnhancedReview(local));
      return;
    }

    let cancelled = false;
    void fetch("/api/coach-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        pgn: review.pgn,
        fen: review.fen,
        moves: review.moves,
        analysis,
        player: {
          city: leaderboardUpdate?.player.city,
          rank: leaderboardUpdate?.newRank ?? leaderboardUpdate?.cityRank,
        },
        playerId: leaderboardUpdate?.player.playerId,
        personality,
        loadExistingOnly: true,
      }),
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { review?: EnhancedCoachReview | null } | null) => {
        if (cancelled || !payload?.review) return;
        saveEnhancedCoachReview(gameId, payload.review);
        startTransition(() => setEnhancedReview(payload.review ?? null));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [analysis, gameId, leaderboardUpdate, personality, review]);

  useEffect(() => {
    if (!analysis || !enhancedReview || !leaderboardUpdate || gameId === "demo") return;

    void fetch("/api/coach-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        analysis,
        playerId: leaderboardUpdate.player.playerId,
        enhancedReview,
      }),
    }).catch(() => undefined);
  }, [analysis, enhancedReview, gameId, leaderboardUpdate]);

  async function generateEnhancedReview() {
    if (!analysis || !review) return;
    setEnhancedLoading(true);
    setEnhancedError("");

    try {
      const response = await fetch("/api/coach-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          pgn: review.pgn,
          fen: review.fen,
          moves: review.moves,
          analysis,
          player: {
            city: leaderboardUpdate?.player.city,
            rank: leaderboardUpdate?.newRank ?? leaderboardUpdate?.cityRank,
          },
          playerId: leaderboardUpdate?.player.playerId,
          personality,
        }),
      });

      if (!response.ok) throw new Error("Coach review request failed");
      const payload = await response.json() as { review?: EnhancedCoachReview };
      if (!payload.review) throw new Error("Coach review response was empty");
      saveEnhancedCoachReview(gameId, payload.review);
      startTransition(() => setEnhancedReview(payload.review ?? null));
    } catch {
      setEnhancedError(ru ? "Сейчас доступен быстрый разбор. Попробуйте углубленный разбор позже." : "Quick review is ready. Try deeper review again later.");
    } finally {
      setEnhancedLoading(false);
    }
  }

  if (loaded && !review) {
    return (
      <AppShell>
        <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-5 pb-16 md:px-8">
          <Card className="w-full overflow-hidden p-0">
            <div className="relative p-8 md:p-10">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--mint)]/10 blur-3xl" />
              <p className="text-sm font-semibold tracking-[0.12em] text-[var(--mint)]">{t("noReviewFound")}</p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-[-0.03em]">{t("emptyCoachRoom")}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                {ru ? "Сыграйте локальную партию или комнату с другом, затем откройте разбор партии." : "Play a local game or friend room first, then open Game Review so the coach can replay the actual moves."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/lobby">{t("startFromLobby")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/analysis/demo">{t("viewDemoReview")}</Link>
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
              <ArrowLeft className="h-4 w-4" /> {t("lobby")}
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-[var(--mint)]">{t("gameReview")}</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl font-bold tracking-[-0.03em]">{t("coachRoom")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {t("coachReview")} / {formatPlyCount(review?.moves.length ?? 0, locale)}. {ru ? "Получите углубленный разбор для дополнительных идей." : "Generate a deeper review when you want extra training ideas."}
            </p>
          </div>
          {review ? <ChessBoardPanel fen={review.fen} locked lastMove={review.moves.at(-1) ?? null} /> : <BoardSkeleton />}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Medal className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="font-[var(--font-display)] text-xl font-bold">{t("moveArchive")}</h2>
            </div>
            <MoveHistory moves={review?.moves ?? []} />
          </Card>
        </section>
        <section className="space-y-5">
          {analysis ? <CoachAnalysisCard analysis={analysis} /> : <Card className="h-96 animate-pulse" />}
          {analysis ? (
            <EnhancedCoachPanel
              review={enhancedReview}
              loading={enhancedLoading}
              error={enhancedError}
              personality={personality}
              onPersonalityChange={setPersonality}
              onGenerate={() => void generateEnhancedReview()}
              proActive={proStatus.isPro}
            />
          ) : null}
          {leaderboardUpdate ? <RankingUpdateCard update={leaderboardUpdate} /> : null}
          {analysis ? (
            <>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                  <p className="text-sm font-semibold tracking-[0.12em] text-[var(--mint)]">{t("moveTimeline")}</p>
                  <h2 className="mt-1 font-[var(--font-display)] text-2xl font-bold">{t("whatChanged")}</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <MoveTimeline evaluations={analysis.evaluations} />
              </Card>
              <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[var(--mint)]" />
                  <h2 className="font-[var(--font-display)] text-2xl font-bold">{t("materialSwing")}</h2>
                </div>
                <MaterialSwing timeline={analysis.materialTimeline} />
              </Card>
            </>
          ) : null}
          {analysis ? (
            <Card className="p-5">
              <h2 className="font-[var(--font-display)] text-2xl font-bold">{t("phaseAdvice")}</h2>
              <div className="mt-4 grid gap-3">
                <Phase title={t("opening")} body={analysis.phaseAdvice.opening} />
                <Phase title={t("middlegame")} body={analysis.phaseAdvice.middlegame} />
                <Phase title={t("endgame")} body={analysis.phaseAdvice.endgame} />
              </div>
              <Button asChild className="mt-5">
                <Link href="/leaderboard">{t("leaderboard")}</Link>
              </Button>
            </Card>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}

function EnhancedCoachPanel({
  review,
  loading,
  error,
  personality,
  onPersonalityChange,
  onGenerate,
  proActive,
}: {
  review: EnhancedCoachReview | null;
  loading: boolean;
  error: string;
  personality: CoachPersonality;
  onPersonalityChange: (personality: CoachPersonality) => void;
  onGenerate: () => void;
  proActive: boolean;
}) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const [answerVisible, setAnswerVisible] = useState(false);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative p-5">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[var(--gold)]/10 blur-2xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-[var(--gold)]">{t("deeperReview")}</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">{t("positionDrill")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              {t("generateDeeperReview")}
            </p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-semibold text-slate-200">
            {review ? (ru ? "Готово" : "Ready") : t("quickReview")}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/30 bg-[rgba(248,200,106,0.1)] px-3 py-1 text-[var(--gold)]">
            <Crown className="h-3.5 w-3.5" /> {proActive ? t("proActive") : t("proUnlock")}
          </span>
          {!proActive ? (
            <Link href="/pro" className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-slate-300 transition hover:text-white">
              {t("upgradeToProDemo")}
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Select value={personality} onChange={(event) => onPersonalityChange(event.target.value as CoachPersonality)}>
            {coachPersonalities.map((item) => <option key={item} value={item}>{personalityLabel(item, t)}</option>)}
          </Select>
          <Button onClick={onGenerate} disabled={loading}>
            <Sparkles className="h-4 w-4" /> {loading ? t("reviewing") : t("generateDeeperReview")}
          </Button>
        </div>

        {error ? <p className="mt-3 text-sm text-[var(--gold)]">{error}</p> : null}

        {review ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.25rem] border border-[var(--mint)]/25 bg-[rgba(118,247,203,0.08)] p-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--mint)]">{t("shareableHeadline")}</p>
              <p className="mt-2 font-[var(--font-display)] text-xl font-bold">{review.shareHeadline}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{review.summary}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <CoachTextBlock title={t("biggestMistake")} body={review.biggestMistakeExplanation} tone="danger" />
              <CoachTextBlock title={t("betterMove")} body={review.betterMoveExplanation} />
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-white">{t("personalizedTips")}</p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-300">
                {review.trainingTips.map((tip, index) => (
                  <li key={`${index}-${tip}`} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">{tip}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Phase title={t("opening")} body={review.phaseAdvice.opening} />
              <Phase title={t("middlegame")} body={review.phaseAdvice.middlegame} />
              <Phase title={t("endgame")} body={review.phaseAdvice.endgame} />
            </div>
            <CoachTextBlock title={t("trainingDrill")} body={review.trainingDrill} />
            <div className="rounded-[1.25rem] border border-[var(--gold)]/30 bg-[rgba(248,200,106,0.08)] p-4">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--gold)]">{t("betterMove")}</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{review.puzzle.question}</p>
              {answerVisible ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/45 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">{t("answer")}: {review.puzzle.answerMove}</p>
                  <p className="mt-1 leading-6">{review.puzzle.explanation}</p>
                </div>
              ) : null}
              <Button className="mt-4" variant="secondary" onClick={() => setAnswerVisible((value) => !value)}>
                {answerVisible ? t("hideAnswer") : t("revealAnswer")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            {ru ? "Быстрый разбор готов." : "Quick review is ready."} {t("generateDeeperReview")}
          </div>
        )}
      </div>
    </Card>
  );
}

function CoachTextBlock({ title, body, tone = "default" }: { title: string; body: string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tone === "danger" ? "border-[var(--coral)]/30 bg-[rgba(255,127,127,0.08)]" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function personalityLabel(personality: CoachPersonality, t: ReturnType<typeof useI18n>["t"]) {
  if (personality === "Friendly Coach") return t("friendlyCoach");
  if (personality === "Strict Coach") return t("strictCoach");
  if (personality === "BigTech Interview Coach") return t("interviewCoach");
  return t("memeCoach");
}

function RankingUpdateCard({ update }: { update: LeaderboardUpdateResult }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">
              <Trophy className="h-4 w-4" /> {ru ? "Ранг обновлен" : "City ranking updated"}
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">
              {update.alreadyCounted ? (ru ? "Этот разбор уже учтен." : "This review is already counted.") : `${ru ? "Вы" : "You are"} #${update.cityRank} ${ru ? "в" : "in"} ${update.player.city}.`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {update.alreadyCounted
                ? (ru ? "Прогресс не начисляется дважды за один и тот же разбор." : "Progress does not increment twice for the same review.")
                : ru
                  ? `${update.player.displayName}: ${formatDelta(update.ratingChange)} к рейтингу и ${formatDelta(update.coachScoreChange)} к оценке тренера.`
                  : `${update.player.displayName} gained ${formatDelta(update.ratingChange)} rating and ${formatDelta(update.coachScoreChange)} coach score from this review.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
              <span className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-1">
                {update.alreadyCounted ? t("reviewedGames") : t("rankSaved")}
              </span>
              <span className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-1">
                {t("rank")} {formatRank(update.oldRank)} -&gt; {formatRank(update.newRank)}
              </span>
              {update.badgesEarned.length ? update.badgesEarned.map((badge) => (
                <span key={badge} className="rounded-lg border border-[var(--gold)]/25 bg-[rgba(214,173,99,0.1)] px-3 py-1 text-[var(--gold)]">
                  {badge}
                </span>
              )) : (
                <span className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-1">{ru ? "Новых бейджей нет" : "No new badges"}</span>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href="/leaderboard">{t("leaderboard")}</Link>
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
  const { locale } = useI18n();
  const ru = locale === "ru";
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
            <ChevronRight className="h-3.5 w-3.5" /> {ru ? "Материал после" : "Material after"}: {formatMaterial(item.materialAfter, locale)} {item.gaveCheck ? (ru ? "- шах" : "- check") : ""}
          </p>
        </div>
      )) : (
        <p className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          {ru ? "Сыграйте несколько ходов, и здесь появится лента разбора." : "Play a few moves and come back here for a move-by-move coach timeline."}
        </p>
      )}
    </div>
  );
}

function MaterialSwing({ timeline }: { timeline: Array<{ ply: number; label: string; balance: number }> }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  if (!timeline.length) {
    return <p className="text-sm text-slate-300">{ru ? "Материальных изменений пока нет. Позиция оставалась равной." : "No material changes yet. The board stayed balanced in the saved sequence."}</p>;
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
            <span className="text-right font-semibold text-white">{formatMaterial(point.balance, locale)}</span>
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

function formatMaterial(score: number, locale: string = "en") {
  if (score === 0) return locale === "ru" ? "Равно" : "Equal";
  if (locale === "ru") return `${score > 0 ? "Белые +" : "Черные +"}${Math.abs(score)}`;
  return `${score > 0 ? "White +" : "Black +"}${Math.abs(score)}`;
}

function formatDelta(value: number) {
  if (value === 0) return "+0";
  return value > 0 ? `+${value}` : value.toString();
}

function formatRank(rank: number | null) {
  return rank ? `#${rank}` : "unranked";
}

function formatPlyCount(count: number, locale: string = "en") {
  if (locale === "ru") return `${count} ходов`;
  if (count === 0) return "0 moves";
  if (count === 1) return "1 ply";
  return `${count} plies`;
}

function loadEnhancedCoachReview(gameId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getEnhancedReviewKey(gameId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EnhancedCoachReview;
  } catch {
    return null;
  }
}

function saveEnhancedCoachReview(gameId: string, review: EnhancedCoachReview) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getEnhancedReviewKey(gameId), JSON.stringify(review));
}

function getEnhancedReviewKey(gameId: string) {
  return `chesscoach.enhancedReview.${gameId}`;
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
