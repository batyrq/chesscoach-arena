"use client";

import { startTransition, Suspense, useEffect, useState } from "react";
import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Link2, MapPin, MonitorPlay, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cities } from "@/lib/demo-data";
import type { City } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/storage";
import { shortRoomCode } from "@/lib/utils";

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
  const friendMode = searchParams.get("mode") === "friend";

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) return;

    startTransition(() => {
      setName(profile.name);
      setCity(profile.city);
    });
  }, []);

  function persist() {
    saveProfile({ name, city });
  }

  function createRoom(prefix = "ROOM") {
    persist();
    const roomId = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/game/${roomId}`);
  }

  function joinRoom() {
    persist();
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
            Set your arena identity once, then jump into a legal chess game, invite a friend, or run the fastest judge-friendly local demo.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <OnboardingProof icon={<MapPin className="h-4 w-4" />} label="City identity" value={city} />
            <OnboardingProof icon={<Sparkles className="h-4 w-4" />} label="Coach loop" value="Instant review" />
            <OnboardingProof icon={<Trophy className="h-4 w-4" />} label="Goal" value="Climb local rank" />
          </div>
        </div>
        <Card className="p-6 md:p-8">
          <div className="grid gap-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-200">Display name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your chess name" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-200">City</span>
              <Select value={city} onChange={(event) => setCity(event.target.value as City)}>
                {cities.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => createRoom("FRIEND")} size="lg">
                <Link2 className="h-4 w-4" /> Create Friend Room
              </Button>
              <Button onClick={() => createRoom("LOCAL")} variant="secondary" size="lg">
                <MonitorPlay className="h-4 w-4" /> Play Local Demo
              </Button>
            </div>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[var(--gold)]/20 bg-[rgba(248,200,106,0.08)] p-4">
                Friend rooms create a shareable invite link and a polished waiting state.
              </div>
              <div className="rounded-[1.25rem] border border-[var(--mint)]/20 bg-[rgba(118,247,203,0.08)] p-4">
                Local demo is the fastest path: play both sides, then analyze.
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-3 text-sm font-semibold">Join Room by Code</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="ARENA01" />
                <Button onClick={joinRoom} variant="secondary" className="sm:w-36">
                  Join
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.5rem] bg-[rgba(118,247,203,0.08)] p-4 text-sm text-slate-300">
              <Bot className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mint)]" />
              Multiplayer note: room links are demo-local today, with the Supabase schema stub ready for realtime persistence.
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
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
