import Link from "next/link";
import { ArrowRight, Database, Globe2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CityLeaderboard } from "@/components/CityLeaderboard";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leaderboardPlayers } from "@/lib/demo-data";

export default function LeaderboardPage() {
  const global = [...leaderboardPlayers].sort((a, b) => b.rating - a.rating).slice(0, 5);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Leaderboard</p>
            <h1 className="mt-4 font-[var(--font-display)] text-5xl font-black leading-tight tracking-[-0.05em]">
              Every city needs a final boss.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Demo data is live today, and the component is shaped to swap into Supabase rows for real ratings, reviews, and streaks.
            </p>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--mint)] p-3 text-slate-950">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Supabase-ready architecture</p>
                <p className="text-sm text-slate-400">Connect `leaderboard` rows and realtime room events when credentials are added.</p>
              </div>
            </div>
          </Card>
        </section>
        <section className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-[var(--mint)]" />
              <h2 className="font-[var(--font-display)] text-2xl font-bold">Global top players</h2>
            </div>
            <div className="space-y-3">
              {global.map((player, index) => (
                <div key={player.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-[1.25rem] bg-white/[0.05] p-4">
                  <div className="font-[var(--font-display)] text-xl font-bold text-[var(--gold)]">#{index + 1}</div>
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-slate-400">{player.city} · {player.wins} wins</p>
                  </div>
                  <p className="font-[var(--font-display)] text-xl font-bold">{player.rating}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild href="/lobby">
                Play for rating <ArrowRight className="h-4 w-4" />
              </Button>
              <ProUpgradeModal triggerLabel="Get profile badge" />
            </div>
          </Card>
          <CityLeaderboard />
        </section>
        <section className="mt-10 rounded-[2rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-6">
          <h2 className="font-[var(--font-display)] text-2xl font-bold">Top players from Almaty are heating up.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Almaty currently has the strongest Pro review density in the demo set. If this were live, that would be a very fun thing to turn into a weekly city challenge.
          </p>
          <Link href="/lobby" className="mt-4 inline-flex text-sm font-semibold text-[var(--gold)]">
            Start a challenge room
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
