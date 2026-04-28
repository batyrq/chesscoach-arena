"use client";

import Link from "next/link";
import { ArrowRight, Brain, Brush, Link2, Map, MoveUpRight, ShieldCheck, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { leaderboardPlayers } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";

const features = [
  { title: "AI Coach", icon: Brain, body: "A post-game review that turns one messy game into clear training priorities." },
  { title: "Friend Link Multiplayer", icon: Link2, body: "Create a room, send a code, and get straight to the interesting part." },
  { title: "City Leaderboard", icon: Map, body: "Represent Almaty, Astana, Shymkent, Karaganda, or your own scene." },
  { title: "Pro Skins", icon: Brush, body: "Premium board styles, badges, and deeper engine lines for serious climbers." }
];

export default function LandingPage() {
  const { t } = useI18n();
  const topCities = [
    { city: "Almaty", score: 94, players: 128 },
    { city: "Astana", score: 89, players: 101 },
    { city: "Shymkent", score: 84, players: 74 },
    { city: "Karaganda", score: 81, players: 62 }
  ];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 md:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
              {t("lobbyKicker")}
            </div>
            <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              {t("landingTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {t("landingSubtitle")}
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
              <HeroMetric value="30s" label="to first move" />
              <HeroMetric value="81%" label="sample review" />
              <HeroMetric value="#7" label="city target" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild href="/lobby" size="lg">
                {t("startGame")} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild href="/pro" variant="secondary" size="lg">
                {t("seeProDemo")}
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {t("bestDemoPath")}
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-4">
              {["Friend rooms", "AI review", "City leaderboard", "Pro path"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:-translate-y-0.5 hover:border-[var(--mint)]/30">
                  <span className="text-[var(--mint)]">*</span> {item}
                </div>
              ))}
            </div>
          </div>
          <HeroBoard />
        </section>
        <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group p-6 transition hover:-translate-y-1 hover:border-[var(--mint)]/40" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--gold)] transition group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-[var(--font-display)] text-xl font-bold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{feature.body}</p>
              </Card>
            );
          })}
        </section>
        <section className="mt-16 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">Coach preview</p>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">One game becomes tomorrow&apos;s training plan.</h2>
              </div>
              <div className="hidden rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-bold text-slate-950 sm:block">
                81% accuracy
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CoachPreview title="Biggest mistake" body="You grabbed on g7 before your pieces were ready, giving Black a rook lift and tempo." />
              <CoachPreview title="Better move" body="Castle first, then decide whether the pawn push is still forcing after the king is safe." />
              <CoachPreview title="Training drill" body="Solve 10 positions where the best move is a quiet defender before a tactical shot." />
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">City heat</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">Leaderboard teaser</h2>
            <div className="mt-6 space-y-3">
              {topCities.map((item, index) => (
                <Link key={item.city} href="/leaderboard" className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-[var(--gold)]/40">
                  <span className="font-[var(--font-display)] text-[var(--gold)]">#{index + 1}</span>
                  <span>
                    <span className="block font-semibold">{item.city}</span>
                    <span className="text-xs text-slate-400">{item.players} active climbers</span>
                  </span>
                  <span className="font-[var(--font-display)] text-xl font-bold">{item.score}</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
        <section className="mt-16 glass grid gap-6 rounded-[2rem] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Monetization ready</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">Free gets players hooked. Pro makes the training loop serious.</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <span className="rounded-2xl bg-white/[0.06] p-3"><Zap className="mb-2 h-4 w-4 text-[var(--mint)]" /> Deeper AI Coach</span>
              <span className="rounded-2xl bg-white/[0.06] p-3"><ShieldCheck className="mb-2 h-4 w-4 text-[var(--gold)]" /> Blunder puzzles</span>
              <span className="rounded-2xl bg-white/[0.06] p-3"><Brush className="mb-2 h-4 w-4 text-[var(--blue)]" /> Founder badge</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/pro">Open demo checkout</Link>
            </Button>
            <ProUpgradeModal />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/45 p-4">
      <p className="font-[var(--font-display)] text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function CoachPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5 transition hover:-translate-y-1 hover:bg-slate-950/65">
      <p className="flex items-center gap-2 font-semibold text-white">
        <MoveUpRight className="h-4 w-4 text-[var(--mint)]" /> {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function HeroBoard() {
  const pieces = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜", "♟", "♟", "♟", "♟", "", "♟", "♟", "♟", "", "", "", "", "♟", "", "", "", "", "", "", "♟", "", "", "", "", "", "", "♞", "", "", "", "", "", "", "", "♟", "", "♟", "♟", "♟", "♟", "♟", "♟", "", "♟", "", "♟", "", "", "♜", "", "♝", "♛", "♚", "♝", "♞", "♜"];

  return (
    <div className="glass relative overflow-hidden rounded-[2.5rem] p-5">
      <div className="absolute right-6 top-6 z-10 rounded-full bg-[var(--mint)] px-4 py-2 text-xs font-bold text-slate-950">
        Coach: +14% accuracy
      </div>
      <div className="grid grid-cols-8 overflow-hidden rounded-[1.75rem] border border-white/10">
        {Array.from({ length: 64 }).map((_, index) => {
          const dark = (Math.floor(index / 8) + index) % 2 === 1;
          return (
            <div key={index} className={`flex aspect-square items-center justify-center text-3xl ${dark ? "bg-[var(--board-dark)]" : "bg-[var(--board-light)]"} ${index < 24 ? "text-[#17120d]" : "text-[#f8f4e8] [text-shadow:_0_1px_2px_rgba(0,0,0,0.85)]"}`}>
              {pieces[index]}
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/leaderboard" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">Almaty rank</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">#7</p>
        </Link>
        <Link href="/analysis/demo" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">Review depth</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">Pro-ready</p>
        </Link>
      </div>
      <div className="mt-3 rounded-[1.25rem] border border-white/10 bg-slate-950/55 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-[var(--gold)]" /> Current city boss
        </p>
        <p className="mt-1 text-sm text-slate-300">{leaderboardPlayers[0].name} · {leaderboardPlayers[0].rating} · Almaty</p>
      </div>
    </div>
  );
}
