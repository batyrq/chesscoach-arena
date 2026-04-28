"use client";

import { startTransition, useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Brain, Check, Crown, Puzzle, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activateDemoPro, loadProStatus, type ProStatus } from "@/lib/pro";
import { useI18n } from "@/lib/i18n";

const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export default function ProPage() {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const [status, setStatus] = useState<ProStatus>(initialProStatus);
  const [upgrading, setUpgrading] = useState(false);
  const freeFeatures = ru
    ? ["Игра на одном устройстве", "Комнаты с другом", "Быстрый разбор", "Городской рейтинг"]
    : ["Same-device games", "Friend rooms", "Quick game review", "City leaderboard"];
  const proFeatures = ru
    ? ["Углубленный разбор", "Задачи из ошибок", "Личный план тренировки", "Бейдж Founder Pro"]
    : ["Deeper game review", "Blunder-to-puzzle drills", "Personalized training plan", "Founder Pro badge"];

  useEffect(() => {
    startTransition(() => setStatus(loadProStatus()));
  }, []);

  async function upgrade() {
    setUpgrading(true);
    const next = await activateDemoPro();
    setStatus(next);
    setUpgrading(false);
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-4 md:px-8">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[var(--gold)]">Founder demo</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight">
              {t("proTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              {t("proSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {status.isPro ? <FounderBadge /> : null}
              <span className="arena-badge rounded-lg px-4 py-2 text-sm">{t("noRealPayment")}</span>
              <span className="arena-badge rounded-lg px-4 py-2 text-sm">{t("progressSaved")}</span>
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="grid md:grid-cols-2">
              <Plan title="Free" price="$0" features={freeFeatures} />
              <div className="relative border-t border-[var(--gold)]/30 bg-[linear-gradient(145deg,rgba(214,173,99,0.14),rgba(127,163,106,0.08))] p-6 md:border-l md:border-t-0">
                <div className="absolute right-5 top-5 rounded-lg bg-[var(--gold)] px-3 py-1 text-xs font-bold text-slate-950">Demo</div>
                <p className="flex items-center gap-2 font-[var(--font-display)] text-2xl font-bold">
                  <Crown className="h-5 w-5 text-[var(--gold)]" /> Pro
                </p>
                <p className="mt-3 text-4xl font-black">$9<span className="text-sm font-semibold text-slate-300">/mo</span></p>
                <p className="mt-2 text-sm text-slate-300">{ru ? "Founder Demo. Без карты и реальной оплаты." : "Founder Demo access. No card fields and no real charge."}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-100">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> {feature}</li>
                  ))}
                </ul>
                <Button className="mt-7 w-full" size="lg" onClick={() => void upgrade()} disabled={upgrading || status.isPro}>
                  <Sparkles className="h-4 w-4" /> {status.isPro ? t("proActive") : upgrading ? "..." : t("upgradeToProDemo")}
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {status.isPro ? (
          <section className="mt-8 rounded-xl border border-[var(--mint)]/30 bg-[rgba(127,163,106,0.08)] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">
                  <BadgeCheck className="h-4 w-4" /> {t("proActive")}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">{ru ? "Профиль готов к Pro Demo." : "Your profile is ready for the Pro demo track."}</h2>
                <p className="mt-2 text-sm text-slate-300">{ru ? "Статус сохраняется после обновления." : "Status persists after refresh and stays with your profile."}</p>
              </div>
              <Button asChild>
                <Link href="/leaderboard">{ru ? "Показать бейдж в рейтинге" : "View badge on leaderboard"} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <ValueCard icon={<Brain />} title={t("gameReview")} body={ru ? "Короткая обратная связь превращает партию в понятный план." : "Concise feedback turns one game into clear training priorities."} />
          <ValueCard icon={<Puzzle />} title={ru ? "Задача из ошибки" : "Blunder puzzle"} body={ru ? "Ключевая ошибка становится карточкой для тренировки." : "The biggest mistake becomes a revealable training card."} />
          <ValueCard icon={<Share2 />} title={ru ? "История для шера" : "Shareable story"} body={ru ? "Заголовок и резюме помогают быстро рассказать о прогрессе." : "A headline and coach summary make the review easy to share."} />
          <ValueCard icon={<Trophy />} title={ru ? "Статус в городе" : "City status"} body={ru ? "Бейдж Founder Pro виден в профиле и рейтинге." : "Founder Pro badge appears in profile and leaderboard surfaces."} />
        </section>

        <section className="mt-10 rounded-xl border border-white/10 bg-white/[0.04] p-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
            <Users className="h-4 w-4" /> {ru ? "Заметка о демо" : "Demo checkout note"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {ru ? "Это демо не собирает реальные платежи. Кнопка активирует Founder Pro и сохраняет статус в профиле." : "This demo intentionally avoids real payment collection. The button records Founder Pro status with your profile."}
          </p>
        </section>
      </main>
    </AppShell>
  );
}

function Plan({ title, price, features }: { title: string; price: string; features: string[] }) {
  return (
    <div className="p-6">
      <p className="font-[var(--font-display)] text-2xl font-bold">{title}</p>
      <p className="mt-3 text-4xl font-black">{price}</p>
      <ul className="mt-6 space-y-3 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> {feature}</li>
        ))}
      </ul>
    </div>
  );
}

function FounderBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/35 bg-[rgba(214,173,99,0.12)] px-4 py-2 text-sm font-semibold text-[var(--gold)]">
      <Crown className="h-4 w-4" /> Founder Pro / {t("progressSaved")}
    </span>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-[var(--gold)]">
        {icon}
      </div>
      <h2 className="font-[var(--font-display)] text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </Card>
  );
}
