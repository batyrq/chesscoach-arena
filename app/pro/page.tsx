"use client";

import { startTransition, useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Brain, Check, Crown, Puzzle, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activateDemoPro, loadProStatus, type ProStatus } from "@/lib/pro";

const freeFeatures = ["Local games", "Friend rooms", "Engine-lite review", "City leaderboard"];
const proFeatures = ["Gemini coach review", "Blunder-to-puzzle drills", "Personalized training plan", "Founder Pro badge"];
const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export default function ProPage() {
  const [status, setStatus] = useState<ProStatus>(initialProStatus);
  const [upgrading, setUpgrading] = useState(false);

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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Founder demo checkout</p>
            <h1 className="mt-4 font-[var(--font-display)] text-5xl font-black leading-tight tracking-[-0.05em]">
              Pro makes the coach loop feel like a real training product.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Play chess with friends, get AI coaching, solve your blunders as puzzles, and compete in your city. This demo upgrade shows the monetization path without collecting payment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {status.isPro ? <FounderBadge provider={status.provider} /> : null}
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">No real payment</span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300">Supabase + local fallback</span>
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
                <p className="mt-2 text-sm text-slate-300">Founder Demo access. No card fields, no Stripe, no real charge.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-100">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> {feature}</li>
                  ))}
                </ul>
                <Button className="mt-7 w-full" size="lg" onClick={() => void upgrade()} disabled={upgrading || status.isPro}>
                  <Sparkles className="h-4 w-4" /> {status.isPro ? "Founder Pro active" : upgrading ? "Activating demo..." : "Upgrade to Pro Demo"}
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
                  <BadgeCheck className="h-4 w-4" /> Founder Pro active
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold">Your profile is ready for the Pro demo track.</h2>
                <p className="mt-2 text-sm text-slate-300">Status persists after refresh and syncs to Supabase when configured.</p>
              </div>
              <Button asChild>
                <Link href="/leaderboard">View badge on leaderboard <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <ValueCard icon={<Brain />} title="AI Coach" body="Concise feedback grounded in engine-lite facts with Gemini tone layered on top." />
          <ValueCard icon={<Puzzle />} title="Blunder puzzle" body="The biggest mistake becomes a revealable training card." />
          <ValueCard icon={<Share2 />} title="Shareable story" body="A headline and coach summary make the review easy to pitch." />
          <ValueCard icon={<Trophy />} title="City status" body="Founder Pro badge travels into the profile and leaderboard surfaces." />
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
            <Users className="h-4 w-4" /> Demo checkout note
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            This phase intentionally avoids real payment collection. Stripe is not integrated; the button records founder upgrade intent, persists a Pro status, and keeps the app fully usable when Supabase is unavailable.
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
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/35 bg-[rgba(248,200,106,0.12)] px-4 py-2 text-sm font-semibold text-[var(--gold)]">
      <Crown className="h-4 w-4" /> Founder Pro · {provider === "supabase" ? "Supabase saved" : "Local saved"}
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
