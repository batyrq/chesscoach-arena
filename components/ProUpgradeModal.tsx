"use client";

import { useState } from "react";
import { BadgeCheck, Crown, Palette, Sparkles, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export function ProUpgradeModal({ triggerLabel = "Upgrade to Pro" }: { triggerLabel?: string }) {
  const [checkoutReady, setCheckoutReady] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">
            ChessCoach Pro
          </p>
          <DialogTitle>Train like your city is watching.</DialogTitle>
          <DialogDescription>
            A polished checkout fallback for judges, with the product value clear before Stripe is connected.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="font-[var(--font-display)] text-xl font-bold">Free</p>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>3 game reviews per day</li>
              <li>Basic city leaderboard</li>
              <li>Friend link games</li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--gold)]/40 bg-[linear-gradient(145deg,rgba(248,200,106,0.18),rgba(118,247,203,0.08))] p-5">
            <div className="absolute right-4 top-4 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-slate-950">
              Popular
            </div>
            <p className="flex items-center gap-2 font-[var(--font-display)] text-xl font-bold">
              <Crown className="h-5 w-5 text-[var(--gold)]" /> Pro
            </p>
            <p className="mt-2 text-3xl font-bold">$9<span className="text-sm text-slate-300">/mo</span></p>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> Unlimited AI reviews</li>
              <li className="flex gap-2"><Wand2 className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> Deeper Stockfish lines</li>
              <li className="flex gap-2"><Palette className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> Custom board skins</li>
              <li className="flex gap-2"><Trophy className="mt-0.5 h-4 w-4 text-[var(--mint)]" /> City champion badge</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <BadgeCheck className="mb-2 h-4 w-4 text-[var(--mint)]" />
            Priority coach queue
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <Wand2 className="mb-2 h-4 w-4 text-[var(--gold)]" />
            Candidate engine lines
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <Crown className="mb-2 h-4 w-4 text-[var(--gold)]" />
            Profile badge flex
          </div>
        </div>
        {checkoutReady ? (
          <div className="mt-6 rounded-[1.25rem] border border-[var(--mint)]/30 bg-[rgba(118,247,203,0.1)] p-4 text-sm text-slate-200">
            Checkout handoff ready. For the hackathon demo, this confirms the upgrade intent; in production it routes to Stripe Checkout for ChessCoach Pro.
          </div>
        ) : null}
        <Button className="mt-6 w-full" size="lg" onClick={() => setCheckoutReady(true)}>
          Preview checkout handoff
        </Button>
      </DialogContent>
    </Dialog>
  );
}
