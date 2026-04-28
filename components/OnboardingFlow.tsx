"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, Flag, GraduationCap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeOnboarding, type OnboardingChoices, useLearningProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";

type StepId = "goal" | "level" | "dailyTime" | "focus" | "finish";

const steps: StepId[] = ["goal", "level", "dailyTime", "focus", "finish"];

const options = {
  goal: [
    { value: "scratch", en: "Learn from scratch", ru: "Учиться с нуля" },
    { value: "tactics", en: "Improve tactics", ru: "Улучшить тактику" },
    { value: "blunders", en: "Stop blundering pieces", ru: "Перестать зевать фигуры" },
    { value: "friends", en: "Get better against friends", ru: "Играть сильнее с друзьями" },
    { value: "play", en: "Just start playing", ru: "Просто начать играть" }
  ],
  level: [
    { value: "new", en: "New to chess", ru: "Новичок в шахматах" },
    { value: "moves", en: "Know piece moves", ru: "Знаю ходы фигур" },
    { value: "casual", en: "Casual player", ru: "Играю иногда" },
    { value: "regular", en: "Regular player", ru: "Играю регулярно" }
  ],
  dailyTime: [
    { value: "5", en: "5 min", ru: "5 мин" },
    { value: "10", en: "10 min", ru: "10 мин" },
    { value: "15", en: "15 min", ru: "15 мин" },
    { value: "20", en: "20+ min", ru: "20+ мин" }
  ],
  focus: [
    { value: "lessons", en: "Lessons", ru: "Уроки" },
    { value: "games", en: "Playing games", ru: "Партии" },
    { value: "puzzles", en: "Puzzles", ru: "Задачи" },
    { value: "review", en: "Game review", ru: "Разбор партий" }
  ]
};

export function OnboardingFlow() {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const { progress, hydrated } = useLearningProgress();
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<OnboardingChoices>({});
  const step = steps[stepIndex];

  if (!hydrated || progress.onboardingCompleted || progress.onboardingSkipped) return null;

  function select(key: keyof OnboardingChoices, value: string) {
    setChoices((current) => ({ ...current, [key]: value }));
    if (stepIndex < steps.length - 1) setStepIndex((value) => value + 1);
  }

  function skip() {
    completeOnboarding(choices, true);
  }

  function finish() {
    completeOnboarding(choices, false);
  }

  const progressPercent = Math.round(((stepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 pb-4 pt-12 backdrop-blur-sm sm:items-center sm:p-6">
      <Card className="w-full max-w-xl overflow-hidden">
        <div className="border-b border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--mint)]">
                {ru ? "Быстрый старт" : "Quick start"}
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">
                {ru ? "Соберем ваш план обучения" : "Build your chess learning plan"}
              </h2>
            </div>
            <button type="button" onClick={skip} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">
              {ru ? "Пропустить" : "Skip"}
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/60">
            <div className="h-full rounded-full bg-[var(--mint)] transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="p-5">
          {step !== "finish" ? (
            <StepContent step={step} choices={choices} onSelect={select} ru={ru} />
          ) : (
            <FinishContent choices={choices} onFinish={finish} ru={ru} />
          )}
        </div>
      </Card>
    </div>
  );
}

function StepContent({ step, choices, onSelect, ru }: { step: Exclude<StepId, "finish">; choices: OnboardingChoices; onSelect: (key: keyof OnboardingChoices, value: string) => void; ru: boolean }) {
  const meta = getStepMeta(step, ru);
  const Icon = meta.icon;
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(127,163,106,0.18)] text-[var(--mint)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-[var(--font-display)] text-xl font-bold">{meta.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">{meta.body}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {options[step].map((item) => {
          const active = choices[step] === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(step, item.value)}
              className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${active ? "border-[var(--mint)] bg-[rgba(127,163,106,0.16)] text-white" : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}
            >
              {ru ? item.ru : item.en}
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FinishContent({ choices, onFinish, ru }: { choices: OnboardingChoices; onFinish: () => void; ru: boolean }) {
  const focus = choices.focus;
  const recommendation = focus === "puzzles"
    ? (ru ? "Начните с короткой тактики и урока про вилку." : "Start with short tactics and the fork lesson.")
    : focus === "review"
      ? (ru ? "Сыграйте партию и откройте разбор, затем закрепите уроком." : "Play a game, open review, then reinforce it with a lesson.")
      : focus === "games"
        ? (ru ? "Начните с тренировочного бота и разберите первую партию." : "Start with the training bot and review your first game.")
        : (ru ? "Начните с первого урока и короткой ежедневной цели." : "Start with the first lesson and a small daily goal.");

  return (
    <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mint)] text-stone-950">
        <Check className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-[var(--font-display)] text-2xl font-bold">
        {ru ? "План готов" : "Your plan is ready"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation}</p>
      <div className="mt-5 grid gap-2 text-sm text-slate-300">
        <PlanLine label={ru ? "Цель" : "Goal"} value={labelFor("goal", choices.goal, ru)} />
        <PlanLine label={ru ? "Уровень" : "Level"} value={labelFor("level", choices.level, ru)} />
        <PlanLine label={ru ? "Время" : "Daily time"} value={labelFor("dailyTime", choices.dailyTime, ru)} />
        <PlanLine label={ru ? "Фокус" : "Focus"} value={labelFor("focus", choices.focus, ru)} />
      </div>
      <Button onClick={onFinish} className="mt-6 w-full" size="lg">
        {ru ? "Начать обучение" : "Start learning"}
      </Button>
    </div>
  );
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function labelFor(key: keyof typeof options, value: string | undefined, ru: boolean) {
  const item = options[key].find((option) => option.value === value) ?? options[key][0];
  return ru ? item.ru : item.en;
}

function getStepMeta(step: Exclude<StepId, "finish">, ru: boolean) {
  if (step === "goal") return { icon: Target, title: ru ? "Какая цель?" : "What is your goal?", body: ru ? "Выберите причину, по которой хотите возвращаться к тренировкам." : "Pick the reason that should pull you back into training." };
  if (step === "level") return { icon: GraduationCap, title: ru ? "Ваш уровень" : "Your level", body: ru ? "Так мы подскажем правильный первый шаг." : "This helps us suggest the right first step." };
  if (step === "dailyTime") return { icon: Clock3, title: ru ? "Сколько времени в день?" : "How much time per day?", body: ru ? "Небольшая цель лучше редких больших рывков." : "A small daily goal beats rare big sessions." };
  return { icon: Flag, title: ru ? "Что тренировать первым?" : "What should we train first?", body: ru ? "Вы сможете менять фокус позже." : "You can change focus later." };
}
