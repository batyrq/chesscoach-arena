"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Swords } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div className="min-h-screen overflow-hidden pb-20 md:pb-0">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-board opacity-25" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold)] text-stone-950 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-base font-bold">ChessCoach Arena</p>
            <p className="hidden text-xs text-slate-500 sm:block">{t("brandTagline")}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          <DesktopNavLink href="/" active={pathname === "/"}>{locale === "ru" ? "Домой" : "Home"}</DesktopNavLink>
          <DesktopNavLink href="/lobby" active={pathname.startsWith("/lobby") || pathname.startsWith("/game")}>{locale === "ru" ? "Играть" : "Play"}</DesktopNavLink>
          <DesktopNavLink href="/learn" active={pathname.startsWith("/learn")}>{locale === "ru" ? "Учиться" : "Learn"}</DesktopNavLink>
          <DesktopNavLink href="/leaderboard" active={pathname.startsWith("/leaderboard")}>{locale === "ru" ? "Рейтинг" : "Ranking"}</DesktopNavLink>
          <ProUpgradeModal triggerLabel={t("pro")} />
          <LanguageToggle locale={locale} setLocale={setLocale} />
          <AuthStatus />
        </nav>
        <div className="hidden items-center gap-3 md:flex lg:hidden">
          <DesktopNavLink href="/lobby" active={pathname.startsWith("/lobby") || pathname.startsWith("/game")}>{locale === "ru" ? "Играть" : "Play"}</DesktopNavLink>
          <DesktopNavLink href="/learn" active={pathname.startsWith("/learn")}>{locale === "ru" ? "Учиться" : "Learn"}</DesktopNavLink>
          <DesktopNavLink href="/leaderboard" active={pathname.startsWith("/leaderboard")}>{locale === "ru" ? "Рейтинг" : "Ranking"}</DesktopNavLink>
          <LanguageToggle locale={locale} setLocale={setLocale} />
          <AuthStatus />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle locale={locale} setLocale={setLocale} compact />
          <AuthStatus />
        </div>
      </header>
      {children}
      <MobileBottomNav />
      <OnboardingFlow />
    </div>
  );
}

function DesktopNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link className={`rounded-full px-3 py-2 font-semibold transition ${active ? "bg-[rgba(134,168,111,0.14)] text-white" : "text-slate-300 hover:text-white"}`} href={href}>
      {children}
    </Link>
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
