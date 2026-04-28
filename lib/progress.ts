"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { getNextLessonId, lessons } from "@/lib/learning";

const progressKey = "chesscoach.learningProgress";
const progressEvent = "chesscoach:progress";

export type OnboardingChoices = {
  goal?: string;
  level?: string;
  dailyTime?: string;
  focus?: string;
};

export type DailyGoal = "easy" | "standard" | "ambitious";

export type AchievementId =
  | "first-lesson"
  | "first-review"
  | "first-training-game"
  | "three-day-streak"
  | "hundred-xp"
  | "five-lessons"
  | "first-puzzle";

export type LearningProgress = {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: DailyGoal;
  dailyXp: number;
  dailyDate: string | null;
  completedLessons: string[];
  completedReviewsCount: number;
  completedPuzzlesCount: number;
  completedTrainingGamesCount: number;
  achievements: AchievementId[];
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  onboarding: OnboardingChoices;
};

export type ProgressEventKind = "lesson" | "review" | "puzzle" | "training-game";

export const achievementCopy: Record<AchievementId, { en: string; ru: string }> = {
  "first-lesson": { en: "First Lesson", ru: "Первый урок" },
  "first-review": { en: "First Review", ru: "Первый разбор" },
  "first-training-game": { en: "First Training Game", ru: "Первая тренировка" },
  "three-day-streak": { en: "3-Day Streak", ru: "Серия 3 дня" },
  "hundred-xp": { en: "100 XP", ru: "100 XP" },
  "five-lessons": { en: "5 Completed Lessons", ru: "5 уроков" },
  "first-puzzle": { en: "First Puzzle Solved", ru: "Первая задача" }
};

const defaultProgress: LearningProgress = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  dailyGoal: "standard",
  dailyXp: 0,
  dailyDate: null,
  completedLessons: [],
  completedReviewsCount: 0,
  completedPuzzlesCount: 0,
  completedTrainingGamesCount: 0,
  achievements: [],
  onboardingCompleted: false,
  onboardingSkipped: false,
  onboarding: {}
};

export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = () => {
      startTransition(() => {
        setProgress(loadLearningProgress());
        setHydrated(true);
      });
    };
    load();
    window.addEventListener(progressEvent, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(progressEvent, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return useMemo(() => ({ progress, hydrated }), [progress, hydrated]);
}

export function loadLearningProgress(): LearningProgress {
  if (typeof window === "undefined") return defaultProgress;
  const raw = window.localStorage.getItem(progressKey);
  if (!raw) return resetDailyProgress(defaultProgress);

  try {
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return resetDailyProgress(defaultProgress);
  }
}

export function saveLearningProgress(progress: LearningProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressKey, JSON.stringify(normalizeProgress(progress)));
  window.dispatchEvent(new Event(progressEvent));
}

export function completeOnboarding(choices: OnboardingChoices, skipped = false) {
  const progress = loadLearningProgress();
  saveLearningProgress({
    ...progress,
    onboardingCompleted: !skipped,
    onboardingSkipped: skipped,
    onboarding: choices,
    dailyGoal: choices.dailyTime === "5" ? "easy" : choices.dailyTime === "20" ? "ambitious" : progress.dailyGoal
  });
}

export function recordProgressEvent(kind: ProgressEventKind, options: { lessonId?: string; xp?: number } = {}) {
  const progress = touchToday(loadLearningProgress());
  const xp = options.xp ?? defaultXp(kind);
  const completedLessons = kind === "lesson" && options.lessonId && !progress.completedLessons.includes(options.lessonId)
    ? [...progress.completedLessons, options.lessonId]
    : progress.completedLessons;
  const completedReviewsCount = progress.completedReviewsCount + (kind === "review" ? 1 : 0);
  const completedPuzzlesCount = progress.completedPuzzlesCount + (kind === "puzzle" ? 1 : 0);
  const completedTrainingGamesCount = progress.completedTrainingGamesCount + (kind === "training-game" ? 1 : 0);

  saveLearningProgress(unlockAchievements({
    ...progress,
    xp: progress.xp + xp,
    dailyXp: progress.dailyXp + xp,
    completedLessons,
    completedReviewsCount,
    completedPuzzlesCount,
    completedTrainingGamesCount
  }));
}

export function getLevelFromXp(xp: number) {
  let level = 1;
  while (xp >= getNextLevelXp(level + 1)) level += 1;
  return level;
}

export function getNextLevelXp(level: number) {
  if (level <= 1) return 0;
  return 25 * (level - 1) * (level + 2);
}

export function getDailyGoalXp(goal: DailyGoal) {
  if (goal === "easy") return 30;
  if (goal === "ambitious") return 100;
  return 50;
}

export function getRecommendedLessonId(progress: LearningProgress) {
  const focus = progress.onboarding.focus;
  if (focus === "review" && !progress.completedLessons.includes("undefended")) return "undefended";
  if (focus === "puzzles" && !progress.completedLessons.includes("fork")) return "fork";
  return getNextLessonId(progress.completedLessons);
}

function normalizeProgress(value: Partial<LearningProgress>): LearningProgress {
  const merged = resetDailyProgress({
    ...defaultProgress,
    ...value,
    onboarding: value.onboarding ?? {},
    completedLessons: Array.isArray(value.completedLessons) ? value.completedLessons.filter((id) => lessons.some((lesson) => lesson.id === id)) : [],
    achievements: Array.isArray(value.achievements) ? value.achievements.filter((id) => id in achievementCopy) as AchievementId[] : []
  });
  return unlockAchievements(merged);
}

function resetDailyProgress(progress: LearningProgress): LearningProgress {
  const today = todayKey();
  if (progress.dailyDate === today) return progress;
  return { ...progress, dailyDate: today, dailyXp: 0 };
}

function touchToday(progress: LearningProgress): LearningProgress {
  const today = todayKey();
  const yesterday = offsetDayKey(-1);
  const dailyReset = resetDailyProgress(progress);
  if (progress.lastActiveDate === today) return dailyReset;
  return {
    ...dailyReset,
    streak: progress.lastActiveDate === yesterday ? progress.streak + 1 : 1,
    lastActiveDate: today
  };
}

function unlockAchievements(progress: LearningProgress): LearningProgress {
  const next = new Set(progress.achievements);
  if (progress.completedLessons.length >= 1) next.add("first-lesson");
  if (progress.completedReviewsCount >= 1) next.add("first-review");
  if (progress.completedTrainingGamesCount >= 1) next.add("first-training-game");
  if (progress.streak >= 3) next.add("three-day-streak");
  if (progress.xp >= 100) next.add("hundred-xp");
  if (progress.completedLessons.length >= 5) next.add("five-lessons");
  if (progress.completedPuzzlesCount >= 1 || progress.completedLessons.some((id) => ["fork", "mate-one"].includes(id))) next.add("first-puzzle");
  return { ...progress, achievements: [...next] };
}

function defaultXp(kind: ProgressEventKind) {
  if (kind === "lesson") return 25;
  if (kind === "review") return 35;
  if (kind === "puzzle") return 20;
  return 25;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDayKey(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
