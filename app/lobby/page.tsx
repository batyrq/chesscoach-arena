"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Link2, MonitorPlay } from "lucide-react";
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
  const router = useRouter();
  const [name, setName] = useState(() => loadProfile()?.name ?? "Guest Gambiteer");
  const [city, setCity] = useState<City>(() => loadProfile()?.city ?? "Almaty");
  const [joinCode, setJoinCode] = useState("");
  const [friendMode] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "friend");

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
            The demo stores your profile locally and keeps the Supabase path clean for real rooms, leaderboard rows, and realtime updates.
          </p>
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
