import Link from "next/link";
import { ArrowRight, Database, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CityLeaderboard } from "@/components/CityLeaderboard";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LeaderboardPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Leaderboard</p>
            <h1 className="mt-4 font-[var(--font-display)] text-5xl font-black leading-tight tracking-[-0.05em]">
              Your city ladder updates after every review.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Live Supabase rankings persist your profile, coach score, badges, and reviewed games, with the local demo ladder still ready when the backend is unavailable.
            </p>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--mint)] p-3 text-slate-950">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Live when configured, local when not</p>
                <p className="text-sm text-slate-400">Supabase powers the real ladder; localStorage keeps the demo flow resilient.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-10">
          <CityLeaderboard />
        </section>

        <section className="mt-10 rounded-[2rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
                <Users className="h-4 w-4" /> Weekly city challenge
              </p>
              <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">Play, review, climb, repeat.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The sticky loop is simple: every analyzed game raises your coach profile and gives you a reason to invite the next rival.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/lobby">Play for rating <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <ProUpgradeModal triggerLabel="Get city badge" />
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
