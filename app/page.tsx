"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Play, Search, ShieldCheck, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { AchievementShelf, DashboardNextSteps, ProgressOverview } from "@/components/ProgressWidgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRecommendedLessonId, useLearningProgress } from "@/lib/progress";
import { getLessonById as lessonById, localText } from "@/lib/learning";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress } = useLearningProgress();
  const nextLesson = lessonById(getRecommendedLessonId(progress));

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
              {ru ? "Играй. Учись. Разбирай ошибки." : "Play. Learn. Review mistakes."}
            </div>
            <div>
              <h1 className="font-[var(--font-display)] text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
                ChessCoach Arena
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                {ru
                  ? "Мобильная шахматная тренировка: сыграйте партию, пройдите короткий урок и превратите ошибки в следующий шаг."
                  : "A mobile-first chess learning platform: play a game, take a short lesson, and turn mistakes into your next step."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {(ru
                ? ["Играй в шахматы", "Учись короткими уроками", "Разбирай ошибки", "Расти каждый день"]
                : ["Play chess", "Learn with short lessons", "Review mistakes", "Improve every day"]
              ).map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.05] p-3 text-sm font-semibold text-slate-200">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-[var(--mint)]" /> {item}
                </div>
              ))}
            </div>
            <DashboardNextSteps />
          </div>

          <Card className="overflow-hidden p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mint)]">{ru ? "Сегодняшний план" : "Today’s plan"}</p>
                <h2 className="mt-1 font-[var(--font-display)] text-2xl font-bold">{localText(nextLesson.title, locale)}</h2>
              </div>
              <Button asChild size="sm">
                <Link href={`/learn?lesson=${nextLesson.id}`}>{ru ? "Продолжить" : "Continue"}</Link>
              </Button>
            </div>
            <ChessBoardPanel fen={nextLesson.fen} locked />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat icon={<Flame className="h-4 w-4" />} label={ru ? "Серия" : "Streak"} value={`${progress.streak}`} />
              <MiniStat icon={<BookOpen className="h-4 w-4" />} label={ru ? "Уроки" : "Lessons"} value={`${progress.completedLessons.length}`} />
              <MiniStat icon={<Trophy className="h-4 w-4" />} label="XP" value={`${progress.xp}`} />
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-5">
            <ProgressOverview />
            <Card className="p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <HomeAction href="/lobby" icon={<Play className="h-5 w-5" />} title={ru ? "Начать партию" : "Start a game"} body={ru ? "Друг, бот или одно устройство." : "Friend, bot, or same device."} />
                <HomeAction href="/learn" icon={<BookOpen className="h-5 w-5" />} title={ru ? "Открыть уроки" : "Open lessons"} body={ru ? "Короткий путь от основ до тактики." : "A short path from basics to tactics."} />
                <HomeAction href="/analysis/demo" icon={<Search className="h-5 w-5" />} title={ru ? "Посмотреть разбор" : "View review"} body={ru ? "Понять, как ошибки становятся планом." : "See how mistakes become a plan."} />
              </div>
            </Card>
          </div>
          <div className="space-y-5">
            <AchievementShelf />
            <Card className="p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">
                <ShieldCheck className="h-4 w-4" /> {ru ? "Почему возвращаться?" : "Why come back?"}
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold">
                {ru ? "Каждый день дает маленький шахматный шаг." : "Every day gives one small chess step."}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {ru ? "XP, серия, уроки и разборы показывают, что тренировать дальше, без лишнего шума." : "XP, streaks, lessons, and reviews show what to train next without extra noise."}
              </p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link href="/learn">
                  {ru ? "Начать обучение" : "Start learning"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <p className="flex items-center gap-1 text-xs text-slate-400">{icon}{label}</p>
      <p className="mt-1 font-[var(--font-display)] text-xl font-bold">{value}</p>
    </div>
  );
}

function HomeAction({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[var(--mint)]/35 hover:bg-white/[0.08]">
      <span className="text-[var(--gold)]">{icon}</span>
      <span className="mt-3 block font-[var(--font-display)] text-lg font-bold">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-slate-300">{body}</span>
    </Link>
  );
}
