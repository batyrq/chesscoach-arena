 "use client";

import Link from "next/link";
import type React from "react";
import { ArrowRight, Crosshair, Medal, ShieldCheck, Swords, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CityLeaderboard } from "@/components/CityLeaderboard";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export default function LeaderboardPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-[var(--gold)]">City Arena</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight tracking-[-0.03em]">
              {t("cityArenaRankings")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Win games, review your mistakes, and climb your city leaderboard.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-400">Your rank updates after reviewed games.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/lobby">{t("playGame")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/analysis/demo">{t("startTraining")}</Link>
              </Button>
              <ProUpgradeModal triggerLabel="Go Pro" />
            </div>
          </div>
          <Card className="grid gap-4 p-5 sm:grid-cols-3">
            <ArenaProof icon={<Trophy className="h-5 w-5" />} label="City Champions" value="Top players rise first" />
            <ArenaProof icon={<Crosshair className="h-5 w-5" />} label="Coach Score" value="Mistakes become points" />
            <ArenaProof icon={<ShieldCheck className="h-5 w-5" />} label="Founder Pro" value="Premium status badge" />
          </Card>
        </section>

        <section className="mt-10">
          <CityLeaderboard />
        </section>

        <section className="mt-10 rounded-[2rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
                <Medal className="h-4 w-4" /> Weekly city challenge
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">Play, review, climb, repeat.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every coach review sharpens your form and gives you a reason to challenge the next rival.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/lobby">Enter Arena <Swords className="h-4 w-4" /></Link>
              </Button>
              <ProUpgradeModal triggerLabel="Founder Pro" />
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function ArenaProof({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[var(--gold)]">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
