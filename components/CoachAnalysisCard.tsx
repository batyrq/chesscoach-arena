import { Brain, Gauge, ShieldAlert, Target, TrendingUp } from "lucide-react";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import type { AnalysisResult } from "@/lib/types";

export function CoachAnalysisCard({ analysis }: { analysis: AnalysisResult }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">AI Coach</p>
        <CardTitle className="text-3xl">Post-game review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Accuracy" value={`${analysis.accuracy}%`} />
          <Metric label="Blunders" value={analysis.blunders.toString()} />
        </div>
        <div className="rounded-[1.25rem] border border-[var(--mint)]/25 bg-[rgba(118,247,203,0.08)] p-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Gauge className="h-5 w-5 text-[var(--mint)]" /> Coach verdict
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your position was playable, but the review found one decision where preparation, king safety, and calculation stopped agreeing. That is the moment to train.
          </p>
        </div>
        <Insight icon={<Brain className="h-5 w-5" />} title="Biggest mistake" body={analysis.biggestMistake} tone="danger" />
        <Insight icon={<TrendingUp className="h-5 w-5" />} title={`Better move: ${analysis.betterMove}`} body={analysis.whyItWorks} />
        <Insight icon={<Target className="h-5 w-5" />} title="Training drill" body={analysis.drill} />
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="font-semibold">3 personalized tips</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {analysis.tips.map((tip) => <li key={tip}>- {tip}</li>)}
          </ul>
        </div>
        <div className="rounded-[1.25rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-4">
          <p className="flex items-center gap-2 font-semibold text-white">
            <ShieldAlert className="h-5 w-5 text-[var(--gold)]" /> Pro unlock
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Deeper review would add engine-backed candidate lines, opening tags, and a custom drill queue for this exact mistake pattern.
          </p>
          <div className="mt-4">
            <ProUpgradeModal triggerLabel="Unlock deeper Pro analysis" />
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

function Insight({ icon, title, body, tone = "default" }: { icon: React.ReactNode; title: string; body: string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tone === "danger" ? "border-[var(--coral)]/30 bg-[rgba(255,127,127,0.08)]" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="flex items-center gap-2 font-semibold text-white">{icon}{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
