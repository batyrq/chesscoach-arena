"use client";

import Link from "next/link";
import { Languages, Swords } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-board opacity-25" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)] text-stone-950 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-base font-bold">ChessCoach Arena</p>
            <p className="text-xs text-slate-500">{t("brandTagline")}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          <Link className="transition hover:text-white" href="/lobby">{t("lobby")}</Link>
          <Link className="transition hover:text-white" href="/leaderboard">{t("leaderboard")}</Link>
          <ProUpgradeModal triggerLabel={t("pro")} />
          <LanguageToggle locale={locale} setLocale={setLocale} />
          <AuthStatus />
        </nav>
        <div className="hidden items-center gap-3 md:flex lg:hidden">
          <Link className="text-sm text-slate-300 transition hover:text-white" href="/lobby">{t("lobby")}</Link>
          <Link className="text-sm text-slate-300 transition hover:text-white" href="/leaderboard">{t("leaderboard")}</Link>
          <LanguageToggle locale={locale} setLocale={setLocale} />
          <AuthStatus />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ButtonLink href="/lobby" label={t("lobby")} />
          <ButtonLink href="/leaderboard" label={t("rank")} />
          <LanguageToggle locale={locale} setLocale={setLocale} compact />
          <AuthStatus />
        </div>
      </header>
      {children}
    </div>
  );
}

function LanguageToggle({ locale, setLocale, compact }: { locale: "ru" | "en"; setLocale: (locale: "ru" | "en") => void; compact?: boolean }) {
  const next = locale === "ru" ? "en" : "ru";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] font-semibold text-slate-300 transition hover:bg-white/[0.1] hover:text-white ${compact ? "px-2.5 py-2 text-xs" : "px-3 py-2 text-xs"}`}
      aria-label="Switch language"
    >
      <Languages className="h-3.5 w-3.5" />
      {locale.toUpperCase()}
    </button>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-300">
      {label}
    </Link>
  );
}
