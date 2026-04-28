"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, ChevronRight, Flame, Lock, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { AchievementShelf, LearningPathSummary, ProgressOverview } from "@/components/ProgressWidgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLessonById, getLessonIndex, learningModules, lessons, localText } from "@/lib/learning";
import { recordProgressEvent, useLearningProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnFallback />}>
      <LearnContent />
    </Suspense>
  );
}

function LearnContent() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const searchParams = useSearchParams();
  const { progress } = useLearningProgress();
  const requestedLesson = searchParams.get("lesson");
  const unlockedCount = Math.max(1, progress.completedLessons.length + 1);
  const selected = useMemo(() => {
    const lesson = getLessonById(requestedLesson);
    const index = getLessonIndex(lesson.id);
    return index >= unlockedCount ? lessons[unlockedCount - 1] : lesson;
  }, [requestedLesson, unlockedCount]);
  const [activeLessonId, setActiveLessonId] = useState(selected.id);
  const activeLesson = getLessonById(activeLessonId);
  const activeIndex = getLessonIndex(activeLesson.id);
  const locked = activeIndex > progress.completedLessons.length;
  const completed = progress.completedLessons.includes(activeLesson.id);

  function completeLesson() {
    if (locked || completed) return;
    recordProgressEvent(activeLesson.id === "fork" || activeLesson.id === "mate-one" ? "puzzle" : "lesson", {
      lessonId: activeLesson.id,
      xp: activeLesson.xp
    });
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <section className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--mint)]">
                {ru ? "Учебный путь" : "Learning path"}
              </p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-bold tracking-[-0.03em]">
                {ru ? "Учись короткими шахматными шагами" : "Learn chess in short steps"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                {ru ? "Каждый урок занимает несколько минут, дает XP и подсказывает следующий практический шаг." : "Each lesson takes a few minutes, grants XP, and points you to the next practice step."}
              </p>
            </div>
            <ProgressOverview compact />
            <LearningPathSummary progress={progress} />
            <AchievementShelf limit={4} />
          </div>

          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
                      {ru ? "Урок" : "Lesson"} {activeIndex + 1}/{lessons.length}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/25 bg-[rgba(214,173,99,0.1)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                      <Star className="h-3.5 w-3.5" /> {activeLesson.xp} XP
                    </span>
                  </div>
                  <h2 className="mt-4 font-[var(--font-display)] text-3xl font-bold">{localText(activeLesson.title, locale)}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{localText(activeLesson.summary, locale)}</p>
                  <div className="mt-4 rounded-xl border border-[var(--mint)]/25 bg-[rgba(127,163,106,0.1)] p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <BookOpen className="h-4 w-4 text-[var(--mint)]" /> {ru ? "Подсказка тренера" : "Coach note"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{localText(activeLesson.coachNote, locale)}</p>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">{ru ? "Мини-задание" : "Mini task"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{localText(activeLesson.task, locale)}</p>
                  </div>
                  <Button onClick={completeLesson} disabled={locked || completed} className="mt-5 w-full" size="lg">
                    {locked ? <Lock className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                    {locked ? (ru ? "Сначала предыдущий урок" : "Finish previous lesson first") : completed ? (ru ? "Урок пройден" : "Lesson complete") : (ru ? "Завершить урок" : "Complete lesson")}
                  </Button>
                </div>
                <div className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
                  <ChessBoardPanel fen={activeLesson.fen} locked />
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {learningModules.map((module) => {
                const done = module.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
                return (
                  <Card key={module.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">{localText(module.title, locale)}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{localText(module.description, locale)}</p>
                      </div>
                      <span className="rounded-full bg-slate-950/55 px-3 py-1 text-xs font-semibold text-slate-300">{done}/{module.lessons.length}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {module.lessons.map((lesson) => {
                        const index = getLessonIndex(lesson.id);
                        const isLocked = index > progress.completedLessons.length;
                        const isDone = progress.completedLessons.includes(lesson.id);
                        const isActive = lesson.id === activeLesson.id;
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                            className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${isActive ? "border-[var(--mint)] bg-[rgba(127,163,106,0.12)]" : "border-white/10 bg-white/[0.035]"} ${isLocked ? "opacity-55" : "hover:bg-white/[0.07]"}`}
                          >
                            <span>
                              <span className="block font-semibold text-white">{localText(lesson.title, locale)}</span>
                              <span className="mt-1 block text-xs text-slate-400">{lesson.xp} XP</span>
                            </span>
                            {isDone ? <Check className="h-4 w-4 text-[var(--mint)]" /> : isLocked ? <Lock className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function LearnFallback() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <div className="h-[70vh] animate-pulse rounded-xl bg-white/[0.05]" />
      </main>
    </AppShell>
  );
}
