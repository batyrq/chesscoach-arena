import Link from "next/link";
import { Swords } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-board opacity-40" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold)] text-slate-950 shadow-[0_0_30px_rgba(248,200,106,0.25)]">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold">ChessCoach Arena</p>
            <p className="text-xs text-slate-500">City-ranked training battles</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          <Link className="transition hover:text-white" href="/lobby">Lobby</Link>
          <Link className="transition hover:text-white" href="/leaderboard">Leaderboard</Link>
          <ProUpgradeModal triggerLabel="Pro" />
          <AuthStatus />
        </nav>
        <div className="hidden items-center gap-3 md:flex lg:hidden">
          <Link className="text-sm text-slate-300 transition hover:text-white" href="/lobby">Lobby</Link>
          <Link className="text-sm text-slate-300 transition hover:text-white" href="/leaderboard">Leaderboard</Link>
          <AuthStatus />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ButtonLink href="/lobby" label="Lobby" />
          <ButtonLink href="/leaderboard" label="Rank" />
          <ProUpgradeModal triggerLabel="Pro" />
          <AuthStatus />
        </div>
      </header>
      {children}
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-300">
      {label}
    </Link>
  );
}
