"use client";

import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { BadgeCheck, Brain, Crown, Share2, Sparkles, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { activateDemoPro, loadProStatus, type ProStatus } from "@/lib/pro";
import { useI18n } from "@/lib/i18n";

const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export function ProUpgradeModal({ triggerLabel = "Upgrade to Pro" }: { triggerLabel?: string }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const [status, setStatus] = useState<ProStatus>(initialProStatus);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const refresh = () => setStatus(loadProStatus());
    window.addEventListener("storage", refresh);
    window.addEventListener("chesscoach:pro-updated", refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("chesscoach:pro-updated", refresh);
    };
  }, []);

  async function upgrade() {
    setUpgrading(true);
    const next = await activateDemoPro();
    setStatus(next);
    setUpgrading(false);
  }

  const freeItems = ru
    ? ["Тренировки и партии с другом", "Быстрый разбор", "Городской рейтинг", "Гостевой профиль"]
    : ["Practice and friend games", "Quick coach review", "City leaderboard", "Guest profile"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={status.isPro ? "secondary" : "default"}>
          {status.isPro ? <Crown className="h-4 w-4" /> : null}
          {status.isPro ? t("founderPro") : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">
            ChessCoach Pro
          </p>
          <DialogTitle>{ru ? "Превратите каждый зевок в тренировку." : "Turn every blunder into a training loop."}</DialogTitle>
          <DialogDescription>
            {ru ? "Демо-апгрейд без карты и реальной оплаты." : "Demo checkout only. No card and no real payment collection."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PlanCard title="Free" price="$0" items={freeItems} />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--gold)]/45 bg-[linear-gradient(145deg,rgba(248,200,106,0.18),rgba(118,247,203,0.08))] p-5">
            <div className="absolute right-4 top-4 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-slate-950">
              Founder Demo
            </div>
            <p className="flex items-center gap-2 font-[var(--font-display)] text-xl font-bold">
              <Crown className="h-5 w-5 text-[var(--gold)]" /> Pro
            </p>
            <p className="mt-2 text-3xl font-bold">$9<span className="text-sm text-slate-300">/mo demo</span></p>
            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              <Feature icon={<Brain className="h-4 w-4" />} text={ru ? "Углублённый разбор тренера" : "Deeper coach review"} />
              <Feature icon={<Wand2 className="h-4 w-4" />} text={ru ? "Тренировка по ошибкам" : "Blunder-to-puzzle training"} />
              <Feature icon={<Share2 className="h-4 w-4" />} text={ru ? "Краткое резюме для шера" : "Shareable coach summary"} />
              <Feature icon={<Trophy className="h-4 w-4" />} text={ru ? "Pro-бейдж в городском профиле" : "Pro badge on your city profile"} />
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          {ru ? "Демо-апгрейд — без реальной оплаты. Статус Founder Pro сохраняется в профиле." : "Demo checkout — no real payment will be charged. The upgrade saves a Founder Pro status with your profile."}
        </div>
        {status.isPro ? (
          <div className="mt-4 rounded-[1.25rem] border border-[var(--mint)]/30 bg-[rgba(118,247,203,0.1)] p-4 text-sm text-slate-200">
            <p className="flex items-center gap-2 font-semibold text-white">
              <BadgeCheck className="h-4 w-4 text-[var(--mint)]" /> {t("proActive")}
            </p>
            <p className="mt-1 text-slate-300">
              {status.provider === "supabase" ? t("progressSaved") : `${t("progressSaved")} · ${t("thisDevice")}`}
            </p>
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button size="lg" onClick={() => void upgrade()} disabled={upgrading || status.isPro}>
            <Sparkles className="h-4 w-4" /> {status.isPro ? t("proActive") : upgrading ? (ru ? "Активируем..." : "Activating...") : t("upgradeToProDemo")}
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/pro">{ru ? "Страница Pro" : "Full Pro page"}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({ title, price, items }: { title: string; price: string; items: string[] }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <p className="font-[var(--font-display)] text-xl font-bold">{title}</p>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="mt-5 space-y-3 text-sm text-slate-300">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <li className="flex gap-2 text-sm"><span className="mt-0.5 text-[var(--mint)]">{icon}</span>{text}</li>;
}
