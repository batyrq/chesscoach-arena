"use client";

import { Crown, Sparkles, Wand2 } from "lucide-react";
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
            Stripe is stubbed for the MVP, but this modal is ready to connect to checkout.
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
              <li>Custom board skins and profile badges</li>
            </ul>
          </div>
        </div>
        <Button className="mt-6 w-full" size="lg">
          Open checkout stub
        </Button>
      </DialogContent>
    </Dialog>
  );
}
