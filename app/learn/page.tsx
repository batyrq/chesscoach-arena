"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, ChevronRight, Flame, HelpCircle, Lightbulb, Lock, RotateCcw, Sparkles, Star, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { AchievementShelf, LearningPathSummary, ProgressOverview } from "@/components/ProgressWidgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLessonById, getLessonIndex, learningModules, lessons, localText, type LessonTask } from "@/lib/learning";
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
  const [answerState, setAnswerState] = useState<{ lessonId: string; correct: boolean } | null>(null);
  const [completionBurstLesson, setCompletionBurstLesson] = useState<string | null>(null);
  const answeredCorrectly = answerState?.lessonId === activeLesson.id && answerState.correct;
  const completionBurst = completionBurstLesson === activeLesson.id;

  function completeLesson() {
    if (locked || completed || !answeredCorrectly) return;
    recordProgressEvent(activeLesson.id === "fork" || activeLesson.id === "mate-one" ? "puzzle" : "lesson", {
      lessonId: activeLesson.id,
      xp: activeLesson.xp
    });
    setCompletionBurstLesson(activeLesson.id);
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-5">
            <div>
              <p className="app-section-label">
                {ru ? "Учебный путь" : "Learning path"}
              </p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold leading-tight tracking-[-0.01em] md:text-4xl">
                {ru ? "Короткие уроки с вопросами" : "Short lessons with questions"}
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
              <div className="grid gap-0 xl:grid-cols-[0.94fr_1.06fr]">
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
                      {ru ? "Урок" : "Lesson"} {activeIndex + 1}/{lessons.length}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--gold)]/25 bg-[rgba(214,173,99,0.1)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                      <Star className="h-3.5 w-3.5" /> {activeLesson.xp} XP
                    </span>
                  </div>
                  <h2 className="mt-4 font-[var(--font-display)] text-2xl font-bold md:text-3xl">{localText(activeLesson.title, locale)}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{localText(activeLesson.summary, locale)}</p>
                  <div className="mt-4 rounded-xl border border-[var(--mint)]/25 bg-[rgba(127,163,106,0.1)] p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <BookOpen className="h-4 w-4 text-[var(--mint)]" /> {ru ? "Подсказка тренера" : "Coach note"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{localText(activeLesson.coachNote, locale)}</p>
                  </div>
                  <LessonQuestionCard
                    key={activeLesson.id}
                    task={activeLesson.task}
                    fen={activeLesson.fen}
                    locked={locked || completed}
                    onSolved={() => setAnswerState({ lessonId: activeLesson.id, correct: true })}
                  />
                  {completionBurst ? (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/30 bg-[rgba(212,170,94,0.11)] px-4 py-3 text-sm font-bold text-[var(--gold)]">
                      <Sparkles className="h-4 w-4" /> +{activeLesson.xp} XP
                    </div>
                  ) : null}
                  <Button onClick={completeLesson} disabled={locked || completed || !answeredCorrectly} className="mt-5 w-full" size="lg">
                    {locked ? <Lock className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                    {locked ? (ru ? "Сначала предыдущий урок" : "Finish previous lesson first") : completed ? (ru ? "Урок пройден" : "Lesson complete") : answeredCorrectly ? (ru ? "Получить XP" : "Claim XP") : (ru ? "Ответьте на вопрос" : "Answer to continue")}
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
                    <div className="mt-4 grid gap-3">
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
                            className={`relative flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${isActive ? "border-[var(--mint)] bg-[rgba(127,163,106,0.12)]" : "border-white/10 bg-white/[0.035]"} ${isLocked ? "opacity-55" : "hover:bg-white/[0.07]"}`}
                          >
                            <span className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border ${isDone ? "border-[var(--mint)] bg-[var(--mint)]" : isActive ? "border-[var(--gold)] bg-[var(--panel-strong)]" : "border-white/20 bg-[var(--panel-strong)]"}`} />
                            <span>
                              <span className="block font-semibold text-white">{localText(lesson.title, locale)}</span>
                              <span className="mt-1 block text-xs text-slate-400">{lesson.xp} XP · {ru ? "вопрос" : "question"}</span>
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

function LessonQuestionCard({ task, fen, locked, onSolved }: { task: LessonTask; fen: string; locked: boolean; onSolved: () => void }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const [selected, setSelected] = useState<string | boolean | null>(null);
  const [square, setSquare] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");

  const isCorrect = status === "correct";
  const isWrong = status === "wrong";

  function submitAnswer(value: string | boolean) {
    if (locked || isCorrect) return;
    setSelected(value);
    const correct = task.type === "multiple-choice"
      ? value === task.correctAnswer
      : task.type === "true-false"
        ? value === task.correctAnswer
        : false;
    setStatus(correct ? "correct" : "wrong");
    if (correct) onSolved();
  }

  function submitSquare(nextSquare: string) {
    if (locked || task.type !== "square-select" || isCorrect) return;
    setSquare(nextSquare);
    const correct = task.correctSquares.includes(nextSquare);
    setStatus(correct ? "correct" : "wrong");
    if (correct) onSolved();
  }

  function retry() {
    setSelected(null);
    setSquare(null);
    setStatus("idle");
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.045)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <HelpCircle className="h-4 w-4 text-[var(--gold)]" /> {ru ? "Вопрос" : "Question"}
        </p>
        <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-slate-300">
          {ru ? "Выберите ответ" : "Choose an answer"}
        </span>
      </div>
      <p className="mt-3 text-base font-semibold leading-6 text-white">{localText(task.question, locale)}</p>

      {task.type === "multiple-choice" ? (
        <div className="mt-4 grid gap-2">
          {task.options.map((option) => {
            const active = selected === option.id;
            const correct = isCorrect && option.id === task.correctAnswer;
            const wrong = isWrong && active;
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked || isCorrect}
                onClick={() => submitAnswer(option.id)}
                className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${correct ? "border-[var(--mint)] bg-[rgba(134,168,111,0.18)] text-white" : wrong ? "border-[var(--coral)] bg-[rgba(212,110,89,0.16)] text-white" : active ? "border-[var(--gold)] bg-[rgba(212,170,94,0.12)] text-white" : "border-white/10 bg-slate-950/35 text-slate-200 hover:bg-white/[0.07]"}`}
              >
                {localText(option.label, locale)}
              </button>
            );
          })}
        </div>
      ) : null}

      {task.type === "true-false" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { value: true, label: ru ? "Да" : "Yes" },
            { value: false, label: ru ? "Нет" : "No" }
          ].map((option) => {
            const active = selected === option.value;
            const correct = isCorrect && option.value === task.correctAnswer;
            const wrong = isWrong && active;
            return (
              <button
                key={String(option.value)}
                type="button"
                disabled={locked || isCorrect}
                onClick={() => submitAnswer(option.value)}
                className={`min-h-12 rounded-lg border px-4 py-3 text-sm font-semibold transition ${correct ? "border-[var(--mint)] bg-[rgba(134,168,111,0.18)]" : wrong ? "border-[var(--coral)] bg-[rgba(212,110,89,0.16)]" : "border-white/10 bg-slate-950/35 hover:bg-white/[0.07]"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {task.type === "square-select" ? (
        <div className="mt-4">
          <ChessBoardPanel
            fen={fen}
            locked={locked || isCorrect}
            onSquareClick={(nextSquare) => submitSquare(nextSquare)}
            selectedSquares={square ? [square] : []}
            correctSquares={isCorrect && square ? [square] : []}
            incorrectSquares={isWrong && square ? [square] : []}
          />
        </div>
      ) : null}

      <div className={`mt-4 rounded-lg border p-3 ${isCorrect ? "border-[var(--mint)]/35 bg-[rgba(134,168,111,0.12)]" : isWrong ? "border-[var(--coral)]/35 bg-[rgba(212,110,89,0.12)]" : "border-white/10 bg-slate-950/25"}`}>
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          {isCorrect ? <Check className="h-4 w-4 text-[var(--mint)]" /> : isWrong ? <X className="h-4 w-4 text-[var(--coral)]" /> : <Lightbulb className="h-4 w-4 text-[var(--gold)]" />}
          {isCorrect ? (ru ? "Верно" : "Correct") : isWrong ? (ru ? "Почти" : "Not quite") : (ru ? "Подсказка" : "Hint")}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {isCorrect ? localText(task.explanation, locale) : isWrong ? localText(task.failureMessage, locale) : localText(task.hint, locale)}
        </p>
        {isWrong ? (
          <button type="button" onClick={retry} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
            <RotateCcw className="h-3.5 w-3.5" /> {ru ? "Попробовать еще раз" : "Try again"}
          </button>
        ) : null}
        {isCorrect ? <p className="mt-2 text-xs font-bold text-[var(--gold)]">+XP · {ru ? "можно продолжить" : "continue when ready"}</p> : null}
      </div>
    </div>
  );
}
