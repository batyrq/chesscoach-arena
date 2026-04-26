"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Crown, Flame, History, MapPin, Sparkles, Trophy } from "lucide-react";
import { cities, cityCopy } from "@/lib/demo-data";
import { createLeaderboardAdapter, getLeaderboardMode } from "@/lib/leaderboard";
import type { City, GameReviewRecord, LeaderboardEntry, PlayerProfile } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function CityLeaderboard() {
  const [city, setCity] = useState<City>("Almaty");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(null);
  const [recentReviews, setRecentReviews] = useState<GameReviewRecord[]>([]);
  const adapter = useMemo(() => createLeaderboardAdapter(), []);

  useEffect(() => {
    startTransition(() => {
      const player = adapter.getCurrentPlayer();
      setCurrentPlayer(player);
      setCity(player?.city ?? "Almaty");
      setEntries(adapter.getEntries());
      setRecentReviews(adapter.getRecentReviews());
    });
  }, [adapter]);

  const cityEntries = useMemo(() => entries.filter((player) => city === "Other" ? true : player.city === city), [city, entries]);
  const globalEntries = useMemo(() => [...entries].sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore).slice(0, 6), [entries]);
  const currentCityRank = useMemo(() => {
    if (!currentPlayer) return null;
    const rankedCity = entries.filter((player) => player.city === currentPlayer.city).sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore);
    const rank = rankedCity.findIndex((player) => player.playerId === currentPlayer.playerId);
    return rank >= 0 ? rank + 1 : null;
  }, [currentPlayer, entries]);
  const totals = useMemo(() => ({
    games: cityEntries.reduce((sum, player) => sum + player.games, 0),
    avgCoach: Math.round(cityEntries.reduce((sum, player) => sum + player.coachScore, 0) / Math.max(cityEntries.length, 1)),
    reviews: cityEntries.reduce((sum, player) => sum + player.reviews, 0)
  }), [cityEntries]);

  return (
    <div className="space-y-6">
      <section className="glass rounded-[2rem] p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gold)]">City ladder</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">Top players from {city}</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">{cityCopy[city]}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{getLeaderboardMode()}</p>
          </div>
          <Select value={city} onChange={(event) => setCity(event.target.value as City)} className="md:w-56">
            {cities.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </div>

        {currentPlayer ? <CurrentPlayerCard player={currentPlayer} rank={currentCityRank} /> : <MissingProfileState />}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <CityStat label="Games tracked" value={totals.games.toString()} />
          <CityStat label="Avg coach score" value={totals.avgCoach.toString()} />
          <CityStat label="Reviewed games" value={totals.reviews.toString()} />
        </div>

        <Podium entries={cityEntries.slice(0, 3)} city={city} />

        <div className="mt-6 space-y-3">
          {cityEntries.map((player, index) => (
            <PlayerRow key={`${player.id}-${player.isDemo ? "demo" : "local"}`} player={player} rank={index + 1} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-[var(--gold)]" />
            <h3 className="font-[var(--font-display)] text-2xl font-bold">Global top players</h3>
          </div>
          <div className="space-y-3">
            {globalEntries.map((player, index) => <PlayerRow key={`global-${player.id}`} player={player} rank={index + 1} compact />)}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <History className="h-5 w-5 text-[var(--mint)]" />
            <h3 className="font-[var(--font-display)] text-2xl font-bold">Recent reviews</h3>
          </div>
          <RecentActivity reviews={recentReviews} />
        </div>
      </section>
    </div>
  );
}

function CurrentPlayerCard({ player, rank }: { player: PlayerProfile; rank: number | null }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--mint)]/25 bg-[rgba(118,247,203,0.08)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--mint)]">
            <MapPin className="h-4 w-4" /> Your rank in {player.city}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-3xl font-black">{rank ? `#${rank}` : "Unranked"} · {player.displayName}</h3>
          <p className="mt-2 text-sm text-slate-300">{player.games} games · {player.reviews} AI reviews · {player.wins}-{player.losses}-{player.draws}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
          <MiniStat label="Rating" value={player.rating.toString()} />
          <MiniStat label="Coach" value={player.coachScore.toString()} />
          <MiniStat label="Badges" value={player.badges.length.toString()} />
        </div>
      </div>
      <BadgeList badges={player.badges} />
    </div>
  );
}

function MissingProfileState() {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-5">
      <p className="font-[var(--font-display)] text-xl font-bold">Create your city profile to enter the ladder.</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">Choose a name and city in the lobby. Your next AI review will create a local ranked profile automatically.</p>
      <Button asChild className="mt-4">
        <Link href="/lobby">Go to lobby</Link>
      </Button>
    </div>
  );
}

function Podium({ entries, city }: { entries: LeaderboardEntry[]; city: City }) {
  if (!entries.length) return null;

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      {entries.map((player, index) => (
        <div key={`podium-${player.id}`} className={`relative overflow-hidden rounded-[1.35rem] border p-4 ${index === 0 ? "border-[var(--gold)]/35 bg-[rgba(248,200,106,0.13)]" : "border-white/10 bg-white/[0.05]"}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">#{index + 1} in {city}</p>
          <p className="mt-3 flex items-center gap-2 font-[var(--font-display)] text-lg font-bold">
            {player.name}
            {player.isPro ? <Crown className="h-4 w-4 text-[var(--gold)]" /> : null}
          </p>
          <p className="mt-1 text-xs text-slate-400">{player.rating} rating · coach {player.coachScore}</p>
          <BadgeList badges={player.badges.slice(0, 2)} compact />
        </div>
      ))}
    </div>
  );
}

function PlayerRow({ player, rank, compact }: { player: LeaderboardEntry; rank: number; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-[1.25rem] border p-4 ${player.isCurrentPlayer ? "border-[var(--mint)]/35 bg-[rgba(118,247,203,0.1)]" : "border-white/10 bg-white/[0.05]"} ${compact ? "py-3" : ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950/70 font-[var(--font-display)] font-bold">
        {rank}
      </div>
      <div>
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {player.name}
          {player.isCurrentPlayer ? <span className="rounded-full bg-[var(--mint)] px-2 py-0.5 text-[0.65rem] font-bold text-slate-950">YOU</span> : null}
          {player.isPro ? <Crown className="h-4 w-4 text-[var(--gold)]" /> : null}
        </p>
        <p className="mt-1 text-xs text-slate-400">{player.city} · {player.wins}/{player.games} wins · {player.reviews} reviews · coach {player.coachScore}</p>
      </div>
      <div className="text-right">
        <p className="font-[var(--font-display)] text-xl font-bold">{player.rating}</p>
        <p className="flex items-center justify-end gap-1 text-xs text-[var(--mint)]"><Flame className="h-3.5 w-3.5" /> {player.streak}</p>
      </div>
    </div>
  );
}

function RecentActivity({ reviews }: { reviews: GameReviewRecord[] }) {
  if (!reviews.length) {
    return <p className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">No local reviews yet. Analyze a game and this becomes your training activity feed.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={`${review.gameId}-${review.playerId}`} className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--mint)]" /> {review.displayName}
          </p>
          <p className="mt-1 text-xs text-slate-400">{review.city} · accuracy {review.accuracy}% · {review.blunders} blunders</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">{review.summary}</p>
        </div>
      ))}
    </div>
  );
}

function BadgeList({ badges, compact }: { badges: string[]; compact?: boolean }) {
  if (!badges.length) return <p className="mt-3 text-xs text-slate-500">Badges unlock after reviewed games.</p>;

  return (
    <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "text-[0.65rem]" : "text-xs"}`}>
      {badges.map((badge) => (
        <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 font-semibold text-slate-200">
          <Award className="h-3.5 w-3.5 text-[var(--gold)]" /> {badge}
        </span>
      ))}
    </div>
  );
}

function CityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
      <p className="font-[var(--font-display)] text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/45 p-3">
      <p className="font-[var(--font-display)] text-xl font-bold">{value}</p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}
