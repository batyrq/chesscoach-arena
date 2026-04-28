"use client";

import Link from "next/link";
import { Award, BookOpen, Flame, Play, Search, Star, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLessonById, getLessonIndex, getNextLessonId, lessons, localText } from "@/lib/learning";
import { achievementCopy, getDailyGoalXp, getLevelFromXp, getNextLevelXp, getRecommendedLessonId, type LearningProgress, useLearningProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";

export function ProgressOverview({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress } = useLearningProgress();
  const level = getLevelFromXp(progress.xp);
  const nextLevelXp = getNextLevelXp(level + 1);
  const dailyGoal = getDailyGoalXp(progress.dailyGoal);
  const lesson = getLessonById(getRecommendedLessonId(progress));
  const dailyPercent = Math.min(100, Math.round((progress.dailyXp / dailyGoal) * 100));
  const levelPercent = Math.min(100, Math.round((progress.xp / nextLevelXp) * 100));

  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
      <MetricCard icon={<Flame className="h-5 w-5" />} label={ru ? "Серия" : "Streak"} value={`${progress.streak} ${ru ? "дн." : "days"}`} tone="gold" />
      <MetricCard icon={<Star className="h-5 w-5" />} label={ru ? "Уровень" : "Level"} value={`${level} / ${progress.xp} XP`} progress={levelPercent} />
      <MetricCard icon={<Target className="h-5 w-5" />} label={ru ? "Цель дня" : "Daily goal"} value={`${progress.dailyXp}/${dailyGoal} XP`} progress={dailyPercent} />
      {!compact ? (
        <Card className="p-5 md:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--mint)]">
                <BookOpen className="h-4 w-4" /> {ru ? "Продолжить обучение" : "Continue learning"}
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold">{localText(lesson.title, locale)}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{localText(lesson.summary, locale)}</p>
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/learn?lesson=${lesson.id}`}>{ru ? "Учиться" : "Learn"}</Link>
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function DashboardNextSteps() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress } = useLearningProgress();
  const lesson = getLessonById(getRecommendedLessonId(progress));

  const actions = [
    { href: "/lobby", icon: Play, title: ru ? "Играть в шахматы" : "Play chess", body: ru ? "Бот, друг или партия на одном устройстве." : "Bot, friend room, or same-device game." },
    { href: `/learn?lesson=${lesson.id}`, icon: BookOpen, title: ru ? "Учиться короткими уроками" : "Learn with short lessons", body: localText(lesson.title, locale) },
    { href: "/analysis/demo", icon: Search, title: ru ? "Разбирать ошибки" : "Review mistakes", body: ru ? "Посмотрите, как партия превращается в план." : "See how a game becomes a plan." }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href} className="rounded-xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-[var(--mint)]/35 hover:bg-white/[0.08]">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/55 text-[var(--gold)]">
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-3 block font-[var(--font-display)] text-lg font-bold">{action.title}</span>
            <span className="mt-1 block text-sm leading-5 text-slate-300">{action.body}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AchievementShelf({ limit = 4 }: { limit?: number }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress } = useLearningProgress();
  const earned = progress.achievements.slice(-limit);
  const visible = earned.length ? earned : (Object.keys(achievementCopy).slice(0, limit) as Array<keyof typeof achievementCopy>);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">
            <Award className="h-4 w-4" /> {ru ? "Достижения" : "Achievements"}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-xl font-bold">
            {earned.length ? (ru ? "Недавний прогресс" : "Recent progress") : (ru ? "Первые цели" : "First goals")}
          </h3>
        </div>
        <Trophy className="h-5 w-5 text-[var(--gold)]" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {visible.map((id) => {
          const active = progress.achievements.includes(id);
          return (
            <div key={id} className={`rounded-xl border p-3 text-sm ${active ? "border-[var(--gold)]/30 bg-[rgba(214,173,99,0.1)] text-white" : "border-white/10 bg-white/[0.035] text-slate-400"}`}>
              <p className="font-semibold">{localText(achievementCopy[id], locale)}</p>
              <p className="mt-1 text-xs">{active ? (ru ? "Открыто" : "Unlocked") : (ru ? "Скоро" : "Soon")}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function LearningPathSummary({ progress }: { progress: LearningProgress }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const nextId = getNextLessonId(progress.completedLessons);
  const nextLesson = getLessonById(nextId);
  const completed = progress.completedLessons.length;

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">{ru ? "Маршрут" : "Path"}</p>
      <h3 className="mt-2 font-[var(--font-display)] text-2xl font-bold">{localText(nextLesson.title, locale)}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{localText(nextLesson.coachNote, locale)}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/60">
        <div className="h-full rounded-full bg-[var(--mint)]" style={{ width: `${Math.round((completed / lessons.length) * 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{completed}/{lessons.length} {ru ? "уроков" : "lessons"} · #{getLessonIndex(nextLesson.id) + 1}</p>
    </Card>
  );
}

function MetricCard({ icon, label, value, progress, tone = "mint" }: { icon: React.ReactNode; label: string; value: string; progress?: number; tone?: "mint" | "gold" }) {
  return (
    <Card className="p-4">
      <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${tone === "gold" ? "text-[var(--gold)]" : "text-[var(--mint)]"}`}>
        {icon} {label}
      </p>
      <p className="mt-2 font-[var(--font-display)] text-2xl font-bold">{value}</p>
      {typeof progress === "number" ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/60">
          <div className="h-full rounded-full bg-[var(--mint)]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </Card>
  );
}
