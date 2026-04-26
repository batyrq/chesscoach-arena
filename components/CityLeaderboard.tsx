"use client";

import { useMemo, useState } from "react";
import { Crown, Flame } from "lucide-react";
import { cities, cityCopy, leaderboardPlayers } from "@/lib/demo-data";
import type { City } from "@/lib/types";
import { Select } from "@/components/ui/select";

export function CityLeaderboard() {
  const [city, setCity] = useState<City>("Almaty");
  const players = useMemo(() => leaderboardPlayers.filter((player) => city === "Other" ? true : player.city === city), [city]);

  return (
    <div className="glass rounded-[2rem] p-5 md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">City ladder</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">Top players from {city}</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">{cityCopy[city]}</p>
        </div>
        <Select value={city} onChange={(event) => setCity(event.target.value as City)} className="md:w-56">
          {cities.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </div>
      <div className="mt-6 space-y-3">
        {players.map((player, index) => (
          <div key={player.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950/70 font-[var(--font-display)] font-bold">
              {index + 1}
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {player.name}
                {player.isPro ? <Crown className="h-4 w-4 text-[var(--gold)]" /> : null}
              </p>
              <p className="mt-1 text-xs text-slate-400">{player.city} · {player.wins}/{player.games} · coach {player.coachScore}</p>
            </div>
            <div className="text-right">
              <p className="font-[var(--font-display)] text-xl font-bold">{player.rating}</p>
              <p className="flex items-center gap-1 text-xs text-[var(--mint)]"><Flame className="h-3.5 w-3.5" /> {player.streak}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
