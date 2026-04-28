"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Play, Search, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { AchievementShelf } from "@/components/ProgressWidgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDailyGoalXp, getRecommendedLessonId, useLearningProgress } from "@/lib/progress";
import { getLessonById as lessonById, localText } from "@/lib/learning";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress } = useLearningProgress();
  const nextLesson = lessonById(getRecommendedLessonId(progress));
  const dailyGoal = getDailyGoalXp(progress.dailyGoal);
  const dailyPercent = Math.min(100, Math.round((progress.dailyXp / dailyGoal) * 100));

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <Card className="p-5 md:p-6">
            <div>
              <p className="app-section-label">{ru ? "Продолжить обучение" : "Continue learning"}</p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold leading-tight tracking-[-0.01em] md:text-4xl">
                {localText(nextLesson.title, locale)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{localText(nextLesson.summary, locale)}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.78fr] md:items-center">
              <div>
                <div className="progress-track h-2.5">
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((progress.completedLessons.length / 10) * 100))}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {progress.completedLessons.length}/10 {ru ? "первых уроков" : "starter lessons"} · {nextLesson.xp} XP
                </p>
              </div>
              <Button asChild size="lg">
                <Link href={`/learn?lesson=${nextLesson.id}`}>
                  {ru ? "Продолжить" : "Continue"} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={<Flame className="h-4 w-4" />} label={ru ? "Серия" : "Streak"} value={`${progress.streak}`} />
              <MiniStat icon={<Trophy className="h-4 w-4" />} label="XP" value={`${progress.xp}`} />
              <MiniStat icon={<Target className="h-4 w-4" />} label={ru ? "Цель" : "Goal"} value={`${progress.dailyXp}/${dailyGoal}`} progress={dailyPercent} />
            </div>
          </Card>

          <Card className="overflow-hidden p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mint)]">{ru ? "Позиция урока" : "Lesson position"}</p>
                <h2 className="mt-1 font-[var(--font-display)] text-xl font-bold">{ru ? "Посмотрите пример" : "Preview the idea"}</h2>
              </div>
            </div>
            <ChessBoardPanel fen={nextLesson.fen} locked />
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <Card className="p-5">
            <p className="app-section-label">{ru ? "Быстрые действия" : "Quick actions"}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <HomeAction href="/lobby" icon={<Play className="h-5 w-5" />} title={ru ? "Играть" : "Play"} body={ru ? "Друг, бот или одно устройство." : "Friend, bot, or same device."} />
              <HomeAction href="/learn" icon={<BookOpen className="h-5 w-5" />} title={ru ? "Учиться" : "Learn"} body={ru ? "Уроки с вопросами и XP." : "Questions, feedback, and XP."} />
              <HomeAction href="/analysis/demo" icon={<Search className="h-5 w-5" />} title={ru ? "Разбор" : "Review"} body={ru ? "Превратите ошибку в план." : "Turn a mistake into a plan."} />
            </div>
          </Card>
          <div className="space-y-5">
            <AchievementShelf />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function MiniStat({ icon, label, value, progress }: { icon: React.ReactNode; label: string; value: string; progress?: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
      <p className="flex items-center gap-1 text-xs text-slate-400">{icon}{label}</p>
      <p className="mt-1 font-[var(--font-display)] text-xl font-bold">{value}</p>
      {typeof progress === "number" ? <div className="progress-track mt-2 h-1.5"><div className="progress-fill" style={{ width: `${progress}%` }} /></div> : null}
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
