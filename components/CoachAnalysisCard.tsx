import { Brain, Target, TrendingUp } from "lucide-react";
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
        <Insight icon={<Brain className="h-5 w-5" />} title="Biggest mistake" body={analysis.biggestMistake} />
        <Insight icon={<TrendingUp className="h-5 w-5" />} title={`Better move: ${analysis.betterMove}`} body={analysis.whyItWorks} />
        <Insight icon={<Target className="h-5 w-5" />} title="Training drill" body={analysis.drill} />
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="font-semibold">3 personalized tips</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {analysis.tips.map((tip) => <li key={tip}>- {tip}</li>)}
          </ul>
        </div>
        <ProUpgradeModal triggerLabel="Unlock deeper Pro analysis" />
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

function Insight({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="flex items-center gap-2 font-semibold text-white">{icon}{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
