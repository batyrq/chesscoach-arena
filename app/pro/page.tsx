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
    ? ["ÐŸÐ°Ñ€Ñ‚Ð¸Ð¸ Ð½Ð° Ð¾Ð´Ð½Ð¾Ð¼ ÑƒÑÑ‚Ñ€Ð¾Ð¹ÑÑ‚Ð²Ðµ", "ÐšÐ¾Ð¼Ð½Ð°Ñ‚Ñ‹ Ñ Ð´Ñ€ÑƒÐ³Ð¾Ð¼", "Ð‘Ñ‹ÑÑ‚Ñ€Ñ‹Ð¹ Ñ€Ð°Ð·Ð±Ð¾Ñ€", "Ð“Ð¾Ñ€Ð¾Ð´ÑÐºÐ¾Ð¹ Ñ€ÐµÐ¹Ñ‚Ð¸Ð½Ð³"]
    : ["Same-device games", "Friend rooms", "Quick coach review", "City leaderboard"];
  const proFeatures = ru
    ? ["Ð£Ð³Ð»ÑƒÐ±Ð»Ñ‘Ð½Ð½Ñ‹Ð¹ Ñ€Ð°Ð·Ð±Ð¾Ñ€", "Ð—Ð°Ð´Ð°Ñ‡Ð¸ Ð¸Ð· Ð¾ÑˆÐ¸Ð±Ð¾Ðº", "Ð›Ð¸Ñ‡Ð½Ñ‹Ð¹ Ð¿Ð»Ð°Ð½ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ¸", "Ð‘ÐµÐ¹Ð´Ð¶ Founder Pro"]
    : ["Deeper coach review", "Blunder-to-puzzle drills", "Personalized training plan", "Founder Pro badge"];

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
            <p className="text-sm font-semibold tracking-[0.12em] text-[var(--gold)]">Founder demo</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight tracking-[-0.03em]">
              {t("proTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              {t("proSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {status.isPro ? <FounderBadge provider={status.provider} /> : null}
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">{t("noRealPayment")}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">{t("progressSaved")}</span>
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="grid md:grid-cols-2">
              <Plan title="Free" price="$0" features={freeFeatures} />
              <div className="relative border-t border-[var(--gold)]/30 bg-[linear-gradient(145deg,rgba(248,200,106,0.16),rgba(118,247,203,0.08))] p-6 md:border-l md:border-t-0">
                <div className="absolute right-5 top-5 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-slate-950">Demo</div>
                <p className="flex items-center gap-2 font-[var(--font-display)] text-2xl font-bold">
                  <Crown className="h-5 w-5 text-[var(--gold)]" /> Pro
                </p>
                <p className="mt-3 text-4xl font-black">$9<span className="text-sm font-semibold text-slate-300">/mo</span></p>
                <p className="mt-2 text-sm text-slate-300">{ru ? "Ð”Ð¾ÑÑ‚ÑƒÐ¿ Founder Demo. Ð‘ÐµÐ· ÐºÐ°Ñ€Ñ‚Ñ‹ Ð¸ Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾Ð¹ Ð¾Ð¿Ð»Ð°Ñ‚Ñ‹." : "Founder Demo access. No card fields and no real charge."}</p>
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
          <section className="mt-8 rounded-[2rem] border border-[var(--mint)]/30 bg-[rgba(118,247,203,0.08)] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--mint)]">
                  <BadgeCheck className="h-4 w-4" /> {t("proActive")}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">{ru ? "ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŒ Ð³Ð¾Ñ‚Ð¾Ð² Ðº Pro Demo." : "Your profile is ready for the Pro demo track."}</h2>
                <p className="mt-2 text-sm text-slate-300">{ru ? "Ð¡Ñ‚Ð°Ñ‚ÑƒÑ ÑÐ¾Ñ…Ñ€Ð°Ð½ÑÐµÑ‚ÑÑ Ð¿Ð¾ÑÐ»Ðµ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ." : "Status persists after refresh and stays with your profile."}</p>
              </div>
              <Button asChild>
                <Link href="/leaderboard">{ru ? "ÐŸÐ¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð±ÐµÐ¹Ð´Ð¶ Ð² Ñ€ÐµÐ¹Ñ‚Ð¸Ð½Ð³Ðµ" : "View badge on leaderboard"} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <ValueCard icon={<Brain />} title={ru ? "Ð Ð°Ð·Ð±Ð¾Ñ€ Ñ‚Ñ€ÐµÐ½ÐµÑ€Ð°" : "Coach review"} body={ru ? "ÐšÐ¾Ñ€Ð¾Ñ‚ÐºÐ°Ñ Ð¾Ð±Ñ€Ð°Ñ‚Ð½Ð°Ñ ÑÐ²ÑÐ·ÑŒ Ð¿Ñ€ÐµÐ²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ð¿Ð°Ñ€Ñ‚Ð¸ÑŽ Ð² Ð¿Ð¾Ð½ÑÑ‚Ð½Ñ‹Ð¹ Ð¿Ð»Ð°Ð½ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ¸." : "Concise feedback turns one game into clear training priorities."} />
          <ValueCard icon={<Puzzle />} title={ru ? "Ð—Ð°Ð´Ð°Ñ‡Ð° Ð¸Ð· Ð¾ÑˆÐ¸Ð±ÐºÐ¸" : "Blunder puzzle"} body={ru ? "ÐšÐ»ÑŽÑ‡ÐµÐ²Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ° ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑÑ ÐºÐ°Ñ€Ñ‚Ð¾Ñ‡ÐºÐ¾Ð¹ Ð´Ð»Ñ Ñ‚Ñ€ÐµÐ½Ð¸Ñ€Ð¾Ð²ÐºÐ¸." : "The biggest mistake becomes a revealable training card."} />
          <ValueCard icon={<Share2 />} title={ru ? "Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ Ð´Ð»Ñ ÑˆÐµÑ€Ð°" : "Shareable story"} body={ru ? "Ð—Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº Ð¸ Ñ€ÐµÐ·ÑŽÐ¼Ðµ Ð¿Ð¾Ð¼Ð¾Ð³Ð°ÑŽÑ‚ Ð±Ñ‹ÑÑ‚Ñ€Ð¾ Ñ€Ð°ÑÑÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð¾ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐµ." : "A headline and coach summary make the review easy to share."} />
          <ValueCard icon={<Trophy />} title={ru ? "Ð¡Ñ‚Ð°Ñ‚ÑƒÑ Ð² Ð³Ð¾Ñ€Ð¾Ð´Ðµ" : "City status"} body={ru ? "Ð‘ÐµÐ¹Ð´Ð¶ Founder Pro Ð²Ð¸Ð´ÐµÐ½ Ð² Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ðµ Ð¸ Ñ€ÐµÐ¹Ñ‚Ð¸Ð½Ð³Ðµ." : "Founder Pro badge travels into profile and leaderboard surfaces."} />
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
            <Users className="h-4 w-4" /> {ru ? "Ð—Ð°Ð¼ÐµÑ‚ÐºÐ° Ð¾ Ð´ÐµÐ¼Ð¾" : "Demo checkout note"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {ru ? "Ð­Ñ‚Ð¾ Ð´ÐµÐ¼Ð¾ Ð½Ðµ ÑÐ¾Ð±Ð¸Ñ€Ð°ÐµÑ‚ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð¿Ð»Ð°Ñ‚ÐµÐ¶Ð¸. ÐšÐ½Ð¾Ð¿ÐºÐ° Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€ÑƒÐµÑ‚ Founder Pro Ð¸ ÑÐ¾Ñ…Ñ€Ð°Ð½ÑÐµÑ‚ ÑÑ‚Ð°Ñ‚ÑƒÑ Ð² Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ðµ." : "This demo intentionally avoids real payment collection. The button records founder upgrade intent and keeps Pro status with your profile."}
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

function FounderBadge({ provider }: { provider: ProStatus["provider"] }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/35 bg-[rgba(248,200,106,0.12)] px-4 py-2 text-sm font-semibold text-[var(--gold)]">
      <Crown className="h-4 w-4" /> Founder Pro · {provider === "supabase" ? t("progressSaved") : t("thisDevice")}
    </span>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--gold)]">
        {icon}
      </div>
      <h2 className="font-[var(--font-display)] text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </Card>
  );
}
