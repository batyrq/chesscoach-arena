import Link from "next/link";
import { ArrowRight, Brain, Brush, Link2, Map } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";

const features = [
  { title: "AI Coach", icon: Brain, body: "A post-game review that turns one messy game into clear training priorities." },
  { title: "Friend Link Multiplayer", icon: Link2, body: "Create a room, send a code, and get straight to the interesting part." },
  { title: "City Leaderboard", icon: Map, body: "Represent Almaty, Astana, Shymkent, Karaganda, or your own scene." },
  { title: "Pro Skins", icon: Brush, body: "Premium board styles, badges, and deeper engine lines for serious climbers." }
];

export default function LandingPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 md:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
              Built for students who want receipts after every game
            </div>
            <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Play chess. Get coached. Climb your city leaderboard.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ChessCoach Arena turns friend matches into focused training loops with legal play, instant review, local pride, and a Pro path that feels real enough to demo today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild href="/lobby" size="lg">
                Start Game <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild href="/lobby?mode=friend" variant="secondary" size="lg">
                Play with Friend
              </Button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["Live room links", "Coach review", "Vercel-ready"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
                  <span className="text-[var(--mint)]">●</span> {item}
                </div>
              ))}
            </div>
          </div>
          <HeroBoard />
        </section>
        <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group p-6 transition hover:-translate-y-1 hover:border-[var(--mint)]/40" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--gold)] transition group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-[var(--font-display)] text-xl font-bold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{feature.body}</p>
              </Card>
            );
          })}
        </section>
        <section className="mt-16 glass grid gap-6 rounded-[2rem] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">Monetization ready</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">Free gets players hooked. Pro makes the training loop serious.</h2>
          </div>
          <ProUpgradeModal />
        </section>
      </main>
    </AppShell>
  );
}

function HeroBoard() {
  const pieces = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜", "♟", "♟", "♟", "♟", "", "♟", "♟", "♟", "", "", "", "", "♟", "", "", "", "", "", "", "♙", "", "", "", "", "", "", "♘", "", "", "", "", "", "", "", "♙", "", "♙", "♙", "♙", "♙", "♙", "♙", "", "♙", "", "♙", "", "", "♖", "", "♗", "♕", "♔", "♗", "♘", "♖"];

  return (
    <div className="glass relative overflow-hidden rounded-[2.5rem] p-5">
      <div className="absolute right-6 top-6 z-10 rounded-full bg-[var(--mint)] px-4 py-2 text-xs font-bold text-slate-950">
        Coach: +14% accuracy
      </div>
      <div className="grid grid-cols-8 overflow-hidden rounded-[1.75rem] border border-white/10">
        {Array.from({ length: 64 }).map((_, index) => {
          const dark = (Math.floor(index / 8) + index) % 2 === 1;
          return (
            <div key={index} className={`flex aspect-square items-center justify-center text-3xl ${dark ? "bg-[#315065]" : "bg-[#d7c49e] text-slate-950"}`}>
              {pieces[index]}
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/leaderboard" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">Almaty rank</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">#7</p>
        </Link>
        <Link href="/analysis/demo" className="rounded-[1.25rem] bg-white/[0.07] p-4 transition hover:bg-white/[0.12]">
          <p className="text-xs text-slate-400">Review depth</p>
          <p className="font-[var(--font-display)] text-2xl font-bold">Pro-ready</p>
        </Link>
      </div>
    </div>
  );
}
