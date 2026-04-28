"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Puzzle, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLessonById, localText } from "@/lib/learning";
import { useI18n } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/types";

export function ReviewLearningBridge({ analysis }: { analysis: AnalysisResult }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  const recommendation = recommendFromAnalysis(analysis);
  const lesson = getLessonById(recommendation.lessonId);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(127,163,106,0.16)] text-[var(--mint)]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">
            {ru ? "Следующий урок" : "Next lesson"}
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">{localText(lesson.title, locale)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{ru ? recommendation.ru : recommendation.en}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <BridgeItem icon={<Target className="h-4 w-4" />} label={ru ? "Практика" : "Practice"} value={ru ? recommendation.practiceRu : recommendation.practiceEn} />
        <BridgeItem icon={<Puzzle className="h-4 w-4" />} label={ru ? "Тип задачи" : "Puzzle type"} value={ru ? recommendation.puzzleRu : recommendation.puzzleEn} />
      </div>
      <Button asChild className="mt-5 w-full">
        <Link href={`/learn?lesson=${lesson.id}`}>
          {ru ? "Перейти к уроку" : "Go to lesson"} <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}

function BridgeItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{icon}{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function recommendFromAnalysis(analysis: AnalysisResult) {
  const text = `${analysis.biggestMistake} ${analysis.whyItWorks} ${analysis.drill}`.toLowerCase();
  if (text.includes("queen") || text.includes("ферз")) {
    return {
      lessonId: "opening-principles",
      en: "You bring the queen out early or chase activity before development. Try this lesson: Opening principles.",
      ru: "Похоже, ферзь или активность появляются слишком рано. Попробуйте урок: Дебютные принципы.",
      practiceEn: "Develop two pieces before moving the queen.",
      practiceRu: "Развейте две фигуры до хода ферзем.",
      puzzleEn: "Opening safety",
      puzzleRu: "Безопасный дебют"
    };
  }
  if (analysis.blunders > 0 || text.includes("undefended") || text.includes("loose") || text.includes("material")) {
    return {
      lessonId: "undefended",
      en: "You often leave pieces undefended. Recommended lesson: Defending your pieces.",
      ru: "Похоже, вы часто оставляете фигуры без защиты. Рекомендуемый урок: Защита фигур.",
      practiceEn: "Name every attacked piece after each move.",
      practiceRu: "После каждого хода называйте все атакованные фигуры.",
      puzzleEn: "Hanging piece",
      puzzleRu: "Незащищенная фигура"
    };
  }
  if (analysis.mistakes > 1) {
    return {
      lessonId: "center",
      en: "Your position needed a calmer plan. Recommended lesson: Control the center.",
      ru: "Позиции нужен был спокойный план. Рекомендуемый урок: Контроль центра.",
      practiceEn: "Make one improving move before forcing tactics.",
      practiceRu: "Сделайте улучшающий ход до форсированной тактики.",
      puzzleEn: "Best move",
      puzzleRu: "Лучший ход"
    };
  }
  return {
    lessonId: "develop",
    en: "Your next gain is cleaner development. Try this lesson: Develop pieces.",
    ru: "Следующий шаг — чище развивать фигуры. Попробуйте урок: Развитие фигур.",
    practiceEn: "Bring a new piece into play every move.",
    practiceRu: "Каждым ходом вводите новую фигуру в игру.",
    puzzleEn: "Simple improvement",
    puzzleRu: "Простое улучшение"
  };
}
