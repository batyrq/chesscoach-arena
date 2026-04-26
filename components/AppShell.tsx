import Link from "next/link";
import { Crown, Swords } from "lucide-react";
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
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link className="transition hover:text-white" href="/lobby">Lobby</Link>
          <Link className="transition hover:text-white" href="/leaderboard">Leaderboard</Link>
          <ProUpgradeModal triggerLabel="Pro" />
        </nav>
        <div className="md:hidden">
          <Crown className="h-5 w-5 text-[var(--gold)]" />
        </div>
      </header>
      {children}
    </div>
  );
}
