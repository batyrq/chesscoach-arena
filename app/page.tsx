"use client";

import Link from "next/link";
import { ArrowRight, Brain, Link2, Map, MoveUpRight, ShieldCheck, Trophy, Zap } from "lucide-react";
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
  const features = [
    { title: t("gameReview"), icon: Brain, body: ru ? "После партии вы сразу видите ключевой момент, лучший ход и тренировку." : "After a game, see the key moment, better move, and training drill." },
    { title: t("friendRoom"), icon: Link2, body: ru ? "Создайте комнату, отправьте ссылку и играйте с общими часами." : "Create a room, send a link, and play with shared clocks." },
    { title: t("leaderboard"), icon: Map, body: ru ? "Представляйте свой город и поднимайтесь в плотном рейтинге." : "Represent your city and climb a dense competitive ranking." },
    { title: t("pro"), icon: ShieldCheck, body: ru ? "Pro добавляет глубокий разбор, задачи и бейдж Founder." : "Pro adds deeper review, drills, and the Founder badge." }
  ];
  const topCities = [
    { city: "Almaty", score: 94, players: 128 },
    { city: "Astana", score: 89, players: 101 },
    { city: "Shymkent", score: 84, players: 74 },
    { city: "Karaganda", score: 81, players: 62 }
  ];

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 md:px-8">
        <section className="grid items-center gap-8 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
              {t("lobbyKicker")}
            </div>
            <h1 className="mt-5 max-w-4xl font-[var(--font-display)] text-4xl font-bold leading-tight md:text-6xl">
              {t("landingTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              {t("landingSubtitle")}
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
              <HeroMetric value="30s" label={ru ? "до первого хода" : "to first move"} />
              <HeroMetric value="81%" label={ru ? "пример разбора" : "sample review"} />
              <HeroMetric value="#7" label={ru ? "цель в городе" : "city target"} />
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild href="/lobby" size="lg">
                {t("startGame")} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild href="/pro" variant="secondary" size="lg">
                {t("seeProDemo")}
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-400">{t("bestDemoPath")}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {(ru ? ["Комнаты", "Разбор", "Рейтинг", "Pro"] : ["Friend rooms", "Game Review", "Leaderboard", "Pro path"]).map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 transition hover:border-[var(--mint)]/30">
                  <span className="text-[var(--mint)]">•</span> {item}
                </div>
              ))}
            </div>
          </div>
          <HeroBoard />
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group p-5 transition hover:border-[var(--mint)]/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-[var(--gold)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-[var(--font-display)] text-xl font-bold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{feature.body}</p>
              </Card>
            );
          })}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden p-6 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">{ru ? "Превью разбора" : "Review preview"}</p>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "Одна партия становится планом тренировки." : "One game becomes tomorrow's training plan."}</h2>
              </div>
              <div className="hidden rounded-lg bg-[var(--mint)] px-4 py-2 text-sm font-bold text-slate-950 sm:block">
                81% accuracy
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <CoachPreview title={t("keyMoment")} body={ru ? "Пешка была взята до развития фигур, и соперник получил темп." : "You grabbed material before your pieces were ready, giving the opponent tempo."} />
              <CoachPreview title={t("betterMove")} body={ru ? "Сначала обезопасьте короля, затем считайте форсированный вариант." : "Secure the king first, then calculate the forcing line."} />
              <CoachPreview title={t("trainingDrill")} body={ru ? "Решите 10 позиций, где лучший ход - тихая защита перед тактикой." : "Solve 10 positions where the best move is a quiet defender before a tactical shot."} />
            </div>
          </Card>
          <Card className="p-6 md:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">{ru ? "Городская гонка" : "City race"}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "Превью рейтинга" : "Leaderboard teaser"}</h2>
            <div className="mt-6 space-y-3">
              {topCities.map((item, index) => (
                <Link key={item.city} href="/leaderboard" className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-4 transition hover:border-[var(--gold)]/40">
                  <span className="font-[var(--font-display)] text-[var(--gold)]">#{index + 1}</span>
                  <span>
                    <span className="block font-semibold">{item.city}</span>
                    <span className="text-xs text-slate-400">{item.players} {ru ? "активных игроков" : "active climbers"}</span>
                  </span>
                  <span className="font-[var(--font-display)] text-xl font-bold">{item.score}</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-14 arena-panel grid gap-6 rounded-xl p-6 md:grid-cols-[1fr_auto] md:items-center md:p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">{t("proUnlock")}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{ru ? "Free запускает привычку. Pro делает тренировку системной." : "Free starts the habit. Pro keeps the training loop sharp."}</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <span className="rounded-lg bg-white/[0.06] p-3"><Zap className="mb-2 h-4 w-4 text-[var(--mint)]" /> {t("deeperReview")}</span>
              <span className="rounded-lg bg-white/[0.06] p-3"><ShieldCheck className="mb-2 h-4 w-4 text-[var(--gold)]" /> {ru ? "Задачи из ошибок" : "Blunder puzzles"}</span>
              <span className="rounded-lg bg-white/[0.06] p-3"><Trophy className="mb-2 h-4 w-4 text-[var(--blue)]" /> Founder Pro</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/pro">{ru ? "Открыть Pro Demo" : "Open Pro Demo"}</Link>
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
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
      <p className="font-[var(--font-display)] text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function CoachPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4 transition hover:bg-slate-950/65">
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
    <div className="arena-panel relative overflow-hidden rounded-xl p-4">
      <div className="absolute right-6 top-6 z-10 rounded-lg bg-[var(--mint)] px-4 py-2 text-xs font-bold text-slate-950">
        {ru ? "Тренер: +14% точность" : "Coach: +14% accuracy"}
      </div>
      <ChessBoardPanel fen="rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 2" locked lastMove={{ from: "e2", to: "e4" }} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/leaderboard" className="rounded-lg bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">{ru ? "Ранг Алматы" : "Almaty rank"}</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">#7</p>
        </Link>
        <Link href="/analysis/demo" className="rounded-lg bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">{ru ? "Глубина разбора" : "Review depth"}</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">{ru ? "Pro" : "Pro-ready"}</p>
        </Link>
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/55 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-[var(--gold)]" /> {ru ? "Лидер города" : "Current city leader"}
        </p>
        <p className="mt-1 text-sm text-slate-300">{leaderboardPlayers[0].name} / {leaderboardPlayers[0].rating} / Almaty</p>
      </div>
    </div>
  );
}
