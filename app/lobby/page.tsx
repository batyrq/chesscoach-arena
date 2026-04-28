"use client";

import { startTransition, Suspense, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot, Crown, Link2, MapPin, MonitorPlay, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cities } from "@/lib/demo-data";
import { createLeaderboardAdapter } from "@/lib/leaderboard";
import { loadProStatus, type ProStatus } from "@/lib/pro";
import type { City, PlayerProfile } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/storage";
import { shortRoomCode } from "@/lib/utils";

const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyFallback />}>
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("Guest Gambiteer");
  const [city, setCity] = useState<City>("Almaty");
  const [joinCode, setJoinCode] = useState("");
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const leaderboard = useMemo(() => createLeaderboardAdapter(), []);
  const [leaderboardMode, setLeaderboardMode] = useState<"supabase" | "local">("local");
  const [proStatus, setProStatus] = useState<ProStatus>(initialProStatus);
  const friendMode = searchParams.get("mode") === "friend";

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      startTransition(() => setProfileHydrated(true));
      return;
    }

    startTransition(() => {
      setName(profile.name);
      setCity(profile.city);
      setProStatus(loadProStatus());
      setProfileHydrated(true);
    });
    void leaderboard.getCurrentPlayer().then((player) => {
      startTransition(() => {
        setPlayerProfile(player);
        setLeaderboardMode(leaderboard.mode);
      });
    });
  }, [leaderboard]);

  useEffect(() => {
    if (!profileHydrated) return;
    saveProfile({ name, city });
  }, [city, name, profileHydrated]);

  async function persist() {
    saveProfile({ name, city });
    const player = await leaderboard.getCurrentPlayer();
    startTransition(() => {
      setPlayerProfile(player);
      setLeaderboardMode(leaderboard.mode);
    });
  }

  function updateName(nextName: string) {
    setName(nextName);
    saveProfile({ name: nextName, city });
    void leaderboard.getCurrentPlayer().then((player) => {
      startTransition(() => {
        setPlayerProfile(player);
        setLeaderboardMode(leaderboard.mode);
      });
    });
  }

  function updateCity(nextCity: City) {
    setCity(nextCity);
    saveProfile({ name, city: nextCity });
    void leaderboard.getCurrentPlayer().then((player) => {
      startTransition(() => {
        setPlayerProfile(player);
        setLeaderboardMode(leaderboard.mode);
      });
    });
  }

  async function createRoom(prefix = "ROOM") {
    await persist();
    const roomId = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/game/${roomId}`);
  }

  async function joinRoom() {
    await persist();
    router.push(`/game/${shortRoomCode(joinCode || "ARENA01")}`);
  }

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-8 px-5 pb-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">
            {friendMode ? "Friend room" : "Arena lobby"}
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl font-black leading-tight tracking-[-0.05em]">
            Choose your city. Bring your prep.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Set your arena identity once, then jump into a legal chess game, invite a friend, or run a fast practice match.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <OnboardingProof icon={<MapPin className="h-4 w-4" />} label="City identity" value={city} />
            <OnboardingProof icon={<Sparkles className="h-4 w-4" />} label="Coach loop" value="Instant review" />
            <OnboardingProof icon={<Trophy className="h-4 w-4" />} label="Goal" value="Climb local rank" />
          </div>
          {proStatus.isPro ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/35 bg-[rgba(248,200,106,0.1)] px-4 py-2 text-sm font-semibold text-[var(--gold)]">
              <Crown className="h-4 w-4" /> Founder Pro active
            </p>
          ) : null}
        </div>
        <Card className="p-6 md:p-8">
          <div className="grid gap-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-200">Display name</span>
              <Input value={name} onChange={(event) => updateName(event.target.value)} placeholder="Your chess name" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-200">City</span>
              <Select value={city} onChange={(event) => updateCity(event.target.value as City)}>
                {cities.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => void createRoom("FRIEND")} size="lg">
                <Link2 className="h-4 w-4" /> Create Friend Room
              </Button>
              <Button onClick={() => void createRoom("LOCAL")} variant="secondary" size="lg">
                <MonitorPlay className="h-4 w-4" /> Play Practice Game
              </Button>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[var(--gold)]/20 bg-[rgba(248,200,106,0.08)] p-4">
                Friend rooms create a shareable invite link and a polished waiting state.
              </div>
              <div className="rounded-[1.25rem] border border-[var(--mint)]/20 bg-[rgba(118,247,203,0.08)] p-4">
                Practice game is the fastest path: play both sides, then analyze.
              </div>
            </div>
            <CityRankPreview profile={playerProfile} city={city} mode={leaderboardMode} />
            <div className="rounded-[1.5rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Crown className="h-4 w-4 text-[var(--gold)]" /> {proStatus.isPro ? "Founder Pro ready" : "Pro demo upgrade"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {proStatus.isPro ? "Your deeper coach and puzzle features are framed as Pro-level demo value." : "Unlock the polished demo checkout, Pro badge, shareable coach summary, and blunder puzzles."}
                  </p>
                </div>
                <Button asChild variant="secondary" className="shrink-0">
                  <Link href="/pro">{proStatus.isPro ? "View Pro" : "Upgrade demo"}</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-3 text-sm font-semibold">Join Room by Code</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="ARENA01" />
                <Button onClick={() => void joinRoom()} variant="secondary" className="sm:w-36">
                  Join
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.5rem] bg-[rgba(118,247,203,0.08)] p-4 text-sm text-slate-300">
              <Bot className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mint)]" />
              Friend rooms create a shared game link, keep both boards in sync, and stay playable for guests.
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}

function CityRankPreview({ profile, city, mode }: { profile: PlayerProfile | null; city: City; mode: "supabase" | "local" }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--mint)]/20 bg-[rgba(118,247,203,0.07)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--mint)]">City Rank</p>
          <p className="mt-2 font-[var(--font-display)] text-xl font-bold">
            {profile ? `${profile.rating} rating · ${profile.coachScore} coach` : `Start at 1200 in ${city}`}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            You are ready to climb {city}. Every AI review updates your {mode === "supabase" ? "saved" : "guest"} rank.
          </p>
          <p className="mt-2 inline-flex rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-slate-300">
            {mode === "supabase" ? "Rank saved" : "Guest profile"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/45 px-4 py-3 text-sm text-slate-300">
          {profile ? `${profile.games} games · ${profile.reviews} reviews` : "No ranked games yet"}
        </div>
      </div>
    </div>
  );
}

function OnboardingProof({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">{icon}{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-lg font-bold">{value}</p>
    </div>
  );
}

function LobbyFallback() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center px-5 pb-16 md:px-8">
        <div className="glass h-96 animate-pulse rounded-[2rem]" />
      </main>
    </AppShell>
  );
}
