"use client";

import { AlertTriangle, BarChart3, Brain, Gauge, ShieldAlert, Target, TrendingUp } from "lucide-react";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { useI18n } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/types";

export function CoachAnalysisCard({ analysis }: { analysis: AnalysisResult }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const moment = analysis.criticalMoment;

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold tracking-[0.12em] text-[var(--mint)]">{t("gameReview")}</p>
        <CardTitle className="text-3xl">{t("coachReview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label={ru ? "Точность" : "Accuracy"} value={`${analysis.accuracy}%`} />
          <Metric label={ru ? "Ошибки" : "Mistakes"} value={analysis.mistakes.toString()} />
          <Metric label={ru ? "Зевки" : "Blunders"} value={analysis.blunders.toString()} />
          <Metric label={ru ? "Материал" : "Material"} value={formatMaterial(analysis.materialSwing, locale)} />
        </div>
        <div className="rounded-[1.25rem] border border-[var(--mint)]/25 bg-[rgba(118,247,203,0.08)] p-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Gauge className="h-5 w-5 text-[var(--mint)]" /> {t("coachVerdict")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{analysis.summary}</p>
        </div>
        <Insight icon={<Brain className="h-5 w-5" />} title={moment ? `${t("keyMoment")} ${moment.moveNumber}: ${moment.originalMove}` : t("biggestMistake")} body={analysis.biggestMistake} tone="danger" />
        <Insight icon={<TrendingUp className="h-5 w-5" />} title={`${t("betterMove")}: ${analysis.betterMove}`} body={analysis.whyItWorks} />
        {moment ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <MomentStat label={ru ? "Сторона" : "Side"} value={moment.color === "w" ? t("white") : t("black")} />
            <MomentStat label={ru ? "Перевес" : "Swing"} value={`${Math.abs(moment.swing).toFixed(1)} ${ru ? "очк." : "pts"}`} />
            <MomentStat label={ru ? "До хода" : "Before move"} value={ru ? `Ход ${moment.ply}` : `Ply ${moment.ply}`} />
          </div>
        ) : null}
        <Insight icon={<Target className="h-5 w-5" />} title={t("trainingDrill")} body={analysis.drill} />
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5 text-[var(--mint)]" /> 3 {t("personalizedTips")}
          </p>
          <ul className="mt-3 space-y-3 text-sm text-slate-300">
            {analysis.tips.map((tip) => (
              <li key={tip.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <p className="font-semibold text-white">{tip.title}</p>
                <p className="mt-1 leading-6">{tip.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.25rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <ShieldAlert className="h-5 w-5 text-[var(--gold)]" /> {t("proUnlock")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {t("proUnlockBody")}
          </p>
          <div className="mt-4">
            <ProUpgradeModal triggerLabel={t("unlockDeeper")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-3xl font-bold">{value}</p>
    </div>
  );
}

function MomentStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-[var(--coral)]/20 bg-[rgba(255,127,127,0.07)] p-3">
      <p className="flex items-center gap-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
        <AlertTriangle className="h-3.5 w-3.5 text-[var(--coral)]" /> {label}
      </p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}

function Insight({ icon, title, body, tone = "default" }: { icon: React.ReactNode; title: string; body: string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tone === "danger" ? "border-[var(--coral)]/30 bg-[rgba(255,127,127,0.08)]" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="flex items-center gap-2 font-semibold text-white">{icon}{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function formatMaterial(score: number, locale: string = "en") {
  if (score === 0) return locale === "ru" ? "Равно" : "Equal";
  if (locale === "ru") return `${score > 0 ? "+Б" : "+Ч"} ${Math.abs(score)}`;
  return `${score > 0 ? "+W" : "+B"} ${Math.abs(score)}`;
}
