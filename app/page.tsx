"use client";

import Link from "next/link";
import { ArrowRight, Brain, Brush, Link2, Map, MoveUpRight, ShieldCheck, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { leaderboardPlayers } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const features = ru
    ? [
        { title: "Ð Ð°Ð·Ð±Ð¾Ñ€ Ñ‚Ñ€ÐµÐ½ÐµÑ€Ð°", icon: Brain, body: "Ð Ð°Ð·Ð±Ð¾Ñ€ Ð¿Ð¾ÑÐ»Ðµ Ð¿Ð°Ñ€Ñ‚Ð¸Ð¸ Ð¿Ñ€ÐµÐ²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ð¾ÑˆÐ¸Ð±ÐºÐ¸ Ð² ÑÑÐ½Ñ‹Ðµ Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚Ñ‹." },
        { title: "ÐšÐ¾Ð¼Ð½Ð°Ñ‚Ñ‹ Ñ Ð´Ñ€ÑƒÐ³Ð¾Ð¼", icon: Link2, body: "Ð¡Ð¾Ð·Ð´Ð°Ð¹Ñ‚Ðµ ÐºÐ¾Ð¼Ð½Ð°Ñ‚Ñƒ, Ð¾Ñ‚Ð¿Ñ€Ð°Ð²ÑŒÑ‚Ðµ ÑÑÑ‹Ð»ÐºÑƒ Ð¸ ÑÑ€Ð°Ð·Ñƒ Ð¸Ð³Ñ€Ð°Ð¹Ñ‚Ðµ." },
        { title: "Ð“Ð¾Ñ€Ð¾Ð´ÑÐºÐ¾Ð¹ Ñ€ÐµÐ¹Ñ‚Ð¸Ð½Ð³", icon: Map, body: "ÐŸÑ€ÐµÐ´ÑÑ‚Ð°Ð²Ð»ÑÐ¹Ñ‚Ðµ ÐÐ»Ð¼Ð°Ñ‚Ñ‹, ÐÑÑ‚Ð°Ð½Ñƒ, Ð¨Ñ‹Ð¼ÐºÐµÐ½Ñ‚, ÐšÐ°Ñ€Ð°Ð³Ð°Ð½Ð´Ñƒ Ð¸Ð»Ð¸ ÑÐ²Ð¾Ð¹ Ð³Ð¾Ñ€Ð¾Ð´." },
        { title: "Pro-ÑÑ‚Ð°Ñ‚ÑƒÑ", icon: Brush, body: "ÐŸÑ€ÐµÐ¼Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ðµ Ð±ÐµÐ¹Ð´Ð¶Ð¸, Ð·Ð°Ð´Ð°Ñ‡Ð¸ Ð¸Ð· Ð¾ÑˆÐ¸Ð±Ð¾Ðº Ð¸ Ð³Ð»ÑƒÐ±Ð¾ÐºÐ¸Ðµ Ð»Ð¸Ð½Ð¸Ð¸ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ¸." }
      ]
    : [
        { title: "Coach review", icon: Brain, body: "A post-game review that turns one messy game into clear training priorities." },
        { title: "Friend rooms", icon: Link2, body: "Create a room, send a link, and get straight to the interesting part." },
        { title: "City leaderboard", icon: Map, body: "Represent Almaty, Astana, Shymkent, Karaganda, or your own scene." },
        { title: "Pro status", icon: Brush, body: "Premium badges, blunder drills, and deeper training lines for serious climbers." }
      ];
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
              <HeroMetric value="30s" label={ru ? "Ð´Ð¾ Ð¿ÐµÑ€Ð²Ð¾Ð³Ð¾ Ñ…Ð¾Ð´Ð°" : "to first move"} />
              <HeroMetric value="81%" label={ru ? "Ð¿Ñ€Ð¸Ð¼ÐµÑ€ Ñ€Ð°Ð·Ð±Ð¾Ñ€Ð°" : "sample review"} />
              <HeroMetric value="#7" label={ru ? "Ñ†ÐµÐ»ÑŒ Ð² Ð³Ð¾Ñ€Ð¾Ð´Ðµ" : "city target"} />
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
              {(ru ? ["ÐšÐ¾Ð¼Ð½Ð°Ñ‚Ñ‹", "Ð Ð°Ð·Ð±Ð¾Ñ€", "Ð ÐµÐ¹Ñ‚Ð¸Ð½Ð³", "Pro"] : ["Friend rooms", "Coach review", "City leaderboard", "Pro path"]).map((item) => (
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
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">{ru ? "ÐŸÑ€ÐµÐ²ÑŒÑŽ Ñ€Ð°Ð·Ð±Ð¾Ñ€Ð°" : "Coach preview"}</p>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "ÐžÐ´Ð½Ð° Ð¿Ð°Ñ€Ñ‚Ð¸Ñ ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑÑ Ð¿Ð»Ð°Ð½Ð¾Ð¼ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ¸." : "One game becomes tomorrow's training plan."}</h2>
              </div>
              <div className="hidden rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-bold text-slate-950 sm:block">
                81% accuracy
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CoachPreview title={t("biggestMistake")} body={ru ? "ÐŸÐµÑˆÐºÐ° Ð±Ñ‹Ð»Ð° Ð²Ð·ÑÑ‚Ð° Ð´Ð¾ Ñ€Ð°Ð·Ð²Ð¸Ñ‚Ð¸Ñ Ñ„Ð¸Ð³ÑƒÑ€, Ð¸ ÑÐ¾Ð¿ÐµÑ€Ð½Ð¸Ðº Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ð» Ñ‚ÐµÐ¼Ð¿." : "You grabbed material before your pieces were ready, giving the opponent tempo."} />
              <CoachPreview title={t("betterMove")} body={ru ? "Ð¡Ð½Ð°Ñ‡Ð°Ð»Ð° Ð¾Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÑŒÑ‚Ðµ ÐºÐ¾Ñ€Ð¾Ð»Ñ, Ð·Ð°Ñ‚ÐµÐ¼ ÑÑ‡Ð¸Ñ‚Ð°Ð¹Ñ‚Ðµ Ñ‚Ð°ÐºÑ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ ÑƒÐ´Ð°Ñ€." : "Secure the king first, then calculate the forcing line."} />
              <CoachPreview title={t("trainingDrill")} body={ru ? "Ð ÐµÑˆÐ¸Ñ‚Ðµ 10 Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¹, Ð³Ð´Ðµ Ð»ÑƒÑ‡ÑˆÐ¸Ð¹ Ñ…Ð¾Ð´ â€” Ñ‚Ð¸Ñ…Ð°Ñ Ð·Ð°Ñ‰Ð¸Ñ‚Ð° Ð¿ÐµÑ€ÐµÐ´ Ñ‚Ð°ÐºÑ‚Ð¸ÐºÐ¾Ð¹." : "Solve 10 positions where the best move is a quiet defender before a tactical shot."} />
            </div>
          </Card>
          <Card className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">{ru ? "Ð“Ð¾Ñ€Ð¾Ð´ÑÐºÐ°Ñ Ð³Ð¾Ð½ÐºÐ°" : "City heat"}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "ÐŸÑ€ÐµÐ²ÑŒÑŽ Ñ€ÐµÐ¹Ñ‚Ð¸Ð½Ð³Ð°" : "Leaderboard teaser"}</h2>
            <div className="mt-6 space-y-3">
              {topCities.map((item, index) => (
                <Link key={item.city} href="/leaderboard" className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-[var(--gold)]/40">
                  <span className="font-[var(--font-display)] text-[var(--gold)]">#{index + 1}</span>
                  <span>
                    <span className="block font-semibold">{item.city}</span>
                    <span className="text-xs text-slate-400">{item.players} {ru ? "Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ñ… Ð¸Ð³Ñ€Ð¾ÐºÐ¾Ð²" : "active climbers"}</span>
                  </span>
                  <span className="font-[var(--font-display)] text-xl font-bold">{item.score}</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>
        <section className="mt-16 glass grid gap-6 rounded-[2rem] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">{ru ? "Pro-Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ°" : "Pro training"}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "Free Ð·Ð°Ð¿ÑƒÑÐºÐ°ÐµÑ‚ Ð¿Ñ€Ð¸Ð²Ñ‹Ñ‡ÐºÑƒ. Pro Ð´ÐµÐ»Ð°ÐµÑ‚ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÑƒ ÑÐ¸ÑÑ‚ÐµÐ¼Ð½Ð¾Ð¹." : "Free starts the habit. Pro keeps the training loop sharp."}</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <span className="rounded-2xl bg-white/[0.06] p-3"><Zap className="mb-2 h-4 w-4 text-[var(--mint)]" /> {ru ? "Ð“Ð»ÑƒÐ±Ð¾ÐºÐ¸Ð¹ Ñ€Ð°Ð·Ð±Ð¾Ñ€" : "Deeper review"}</span>
              <span className="rounded-2xl bg-white/[0.06] p-3"><ShieldCheck className="mb-2 h-4 w-4 text-[var(--gold)]" /> {ru ? "Ð—Ð°Ð´Ð°Ñ‡Ð¸ Ð¸Ð· Ð¾ÑˆÐ¸Ð±Ð¾Ðº" : "Blunder puzzles"}</span>
              <span className="rounded-2xl bg-white/[0.06] p-3"><Brush className="mb-2 h-4 w-4 text-[var(--blue)]" /> {ru ? "Founder-Ð±ÐµÐ¹Ð´Ð¶" : "Founder badge"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/pro">{ru ? "ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Pro Demo" : "Open demo checkout"}</Link>
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
  const { locale } = useI18n();
  const ru = locale === "ru";

  return (
    <div className="glass relative overflow-hidden rounded-[2.5rem] p-5">
      <div className="absolute right-6 top-6 z-10 rounded-full bg-[var(--mint)] px-4 py-2 text-xs font-bold text-slate-950">
        {ru ? "Тренер: +14% точность" : "Coach: +14% accuracy"}
      </div>
      <ChessBoardPanel fen="rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 2" locked />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/leaderboard" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">{ru ? "Ранг Алматы" : "Almaty rank"}</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">#7</p>
        </Link>
        <Link href="/analysis/demo" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">{ru ? "Глубина разбора" : "Review depth"}</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">{ru ? "Pro" : "Pro-ready"}</p>
        </Link>
      </div>
      <div className="mt-3 rounded-[1.25rem] border border-white/10 bg-slate-950/55 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-[var(--gold)]" /> {ru ? "Лидер города" : "Current city leader"}
        </p>
        <p className="mt-1 text-sm text-slate-300">{leaderboardPlayers[0].name} · {leaderboardPlayers[0].rating} · Almaty</p>
      </div>
    </div>
  );
}
