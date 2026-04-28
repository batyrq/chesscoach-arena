"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type React from "react";
import Link from "next/link";
import { Award, CalendarDays, Crown, Flame, History, MapPin, Medal, Search, Target, Trophy, UserRound } from "lucide-react";
import { cities, cityCopy } from "@/lib/demo-data";
import { getAuthView } from "@/lib/auth";
import { createLeaderboardAdapter } from "@/lib/leaderboard";
import type { City, GameReviewRecord, LeaderboardEntry, PlayerProfile } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type CityFilter = City | "All Cities";
type BoardScope = "city" | "global";
type TimeFilter = "all" | "week";

export function CityLeaderboard() {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  const [city, setCity] = useState<CityFilter>("Almaty");
  const [scope, setScope] = useState<BoardScope>("city");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(null);
  const [recentReviews, setRecentReviews] = useState<GameReviewRecord[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const adapter = useMemo(() => createLeaderboardAdapter(), []);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      const [auth, player] = await Promise.all([getAuthView(), adapter.getCurrentPlayer()]);
      const [nextEntries, reviews] = await Promise.all([adapter.getEntries(), adapter.getRecentReviews()]);
      if (cancelled) return;
      startTransition(() => {
        setSignedIn(Boolean(auth.user));
        setCurrentPlayer(player);
        setCity(player?.city ?? "Almaty");
        setEntries(nextEntries);
        setRecentReviews(reviews);
        setLoadedAt(Date.now());
      });
    }

    void loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const visibleEntries = useMemo(() => {
    const now = loadedAt;
    return entries
      .filter((player) => scope === "global" || city === "All Cities" || player.city === city)
      .filter((player) => {
        if (timeFilter === "all") return true;
        if (!player.lastPlayedAt) return false;
        return now - new Date(player.lastPlayedAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore || b.reviews - a.reviews)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [city, entries, loadedAt, scope, timeFilter]);

  const currentCityRank = useMemo(() => {
    if (!currentPlayer) return null;
    const rankedCity = entries
      .filter((player) => player.city === currentPlayer.city)
      .sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore);
    const rank = rankedCity.findIndex((player) => player.playerId === currentPlayer.playerId);
    return rank >= 0 ? rank + 1 : null;
  }, [currentPlayer, entries]);

  const currentEntry = useMemo(() => {
    if (!currentPlayer) return null;
    return entries.find((entry) => entry.playerId === currentPlayer.playerId) ?? currentPlayer;
  }, [currentPlayer, entries]);

  const totals = useMemo(() => ({
    reviewedGames: visibleEntries.reduce((sum, player) => sum + player.reviews, 0),
    avgCoach: Math.round(visibleEntries.reduce((sum, player) => sum + player.coachScore, 0) / Math.max(visibleEntries.length, 1)),
    topRating: visibleEntries[0]?.rating ?? currentPlayer?.rating ?? 1200,
    streak: currentEntry ? Math.min(9, Math.max(1, currentEntry.reviews)) : 0,
  }), [currentEntry, currentPlayer, visibleEntries]);

  const boardTitle = scope === "global" || city === "All Cities" ? (ru ? "Все города" : "All Cities") : city;

  return (
    <div className="space-y-6">
      <section className="arena-panel overflow-hidden rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">{t("arenaBoard")}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold">{t("topPlayers")} / {boardTitle}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              {scope === "global" || city === "All Cities" ? (ru ? "Сильнейшие игроки со всех городов." : "The strongest player profiles across every city.") : cityCopy[city]}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
            <Select value={city} onChange={(event) => setCity(event.target.value as CityFilter)}>
              <option value="All Cities">{ru ? "Все города" : "All Cities"}</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <SegmentedControl value={scope} options={[["city", t("city")], ["global", t("global")]]} onChange={(value) => setScope(value as BoardScope)} />
            <SegmentedControl value={timeFilter} options={[["all", t("allTime")], ["week", t("thisWeek")]]} onChange={(value) => setTimeFilter(value as TimeFilter)} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ArenaStat label={t("yourRank")} value={currentPlayer ? formatRank(currentCityRank, locale) : t("guestProfile")} detail={currentPlayer ? `${ru ? "в" : "in"} ${currentPlayer.city}` : (ru ? "Создайте профиль" : "Create a profile")} icon={<MapPin className="h-4 w-4" />} />
          <ArenaStat label={ru ? "Рейтинг арены" : "Arena Rating"} value={(currentEntry?.rating ?? totals.topRating).toString()} detail={ru ? "Общий счет" : "All-time score"} icon={<Trophy className="h-4 w-4" />} />
          <ArenaStat label={t("reviewedGames")} value={(currentEntry?.reviews ?? totals.reviewedGames).toString()} detail={ru ? "Партии с разбором" : "Reviewed games"} icon={<Search className="h-4 w-4" />} />
          <ArenaStat label={t("currentForm")} value={totals.streak ? `${totals.streak}x` : (ru ? "Готово" : "Ready")} detail={`${ru ? "Оценка тренера" : "Coach Score"} ${currentEntry?.coachScore ?? totals.avgCoach}`} icon={<Flame className="h-4 w-4" />} />
        </div>

        {currentPlayer ? <CurrentPlayerCard player={currentPlayer} rank={currentCityRank} signedIn={signedIn} /> : <GuestProfileState />}

        <Podium entries={visibleEntries.slice(0, 3)} />

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-950/30">
          <div className="hidden grid-cols-[4rem_1.4fr_0.8fr_0.8fr_0.8fr_1fr_0.9fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
            <span>{t("rank")}</span>
            <span>{ru ? "Игрок" : "Player"}</span>
            <span>{t("city")}</span>
            <span>{ru ? "Рейтинг" : "Rating"}</span>
            <span>{ru ? "Разбор" : "Coach"}</span>
            <span>{ru ? "Бейджи" : "Badges"}</span>
            <span>{ru ? "Последний разбор" : "Last Review"}</span>
          </div>
          <div className="divide-y divide-white/10">
            {visibleEntries.map((player) => (
              <PlayerRow key={`${player.id}-${player.isDemo ? "seed" : "ranked"}`} player={player} rank={player.rank} />
            ))}
            {!visibleEntries.length ? <EmptyCityState /> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Medal className="h-5 w-5 text-[var(--gold)]" />
            <h3 className="font-[var(--font-display)] text-2xl font-bold">{t("cityChampions")}</h3>
          </div>
          <div className="space-y-3">
            {[...entries].sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore).slice(0, 6).map((player, index) => (
              <CompactPlayer key={`champion-${player.id}`} player={player} rank={index + 1} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <History className="h-5 w-5 text-[var(--mint)]" />
            <h3 className="font-[var(--font-display)] text-2xl font-bold">{t("recentReviews")}</h3>
          </div>
          <RecentActivity reviews={recentReviews} />
        </div>
      </section>
    </div>
  );
}

function SegmentedControl({ value, options, onChange }: { value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-slate-950/55 p-1">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition ${value === optionValue ? "bg-[var(--gold)] text-slate-950" : "text-slate-300 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ArenaStat({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{icon}{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function CurrentPlayerCard({ player, rank, signedIn }: { player: PlayerProfile; rank: number | null; signedIn: boolean }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[var(--mint)]/35 bg-[rgba(127,163,106,0.1)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">
            <Target className="h-4 w-4" /> {t("yourRank")}
          </p>
          <h3 className="mt-2 font-[var(--font-display)] text-3xl font-black">{formatRank(rank, locale)} / {player.displayName}</h3>
          <p className="mt-2 text-sm text-slate-300">
            {player.games} {ru ? "партий" : "games"} / {player.reviews} {ru ? "разборов" : "reviews"} / {player.wins}-{player.losses}-{player.draws}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-1 text-slate-300">
              {signedIn ? t("rankSaved") : `${t("guestProfile")} / ${t("thisDevice")}`}
            </span>
            {player.isPro ? <FounderBadge /> : null}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat label={ru ? "Рейтинг" : "Rating"} value={player.rating.toString()} />
          <MiniStat label={ru ? "Тренер" : "Coach"} value={player.coachScore.toString()} />
          <MiniStat label={ru ? "Бейджи" : "Badges"} value={player.badges.length.toString()} />
        </div>
      </div>
      <BadgeList badges={player.badges} />
    </div>
  );
}

function GuestProfileState() {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  return (
    <div className="mt-6 rounded-xl border border-[var(--gold)]/25 bg-[rgba(214,173,99,0.08)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-[var(--font-display)] text-xl font-bold">
            <UserRound className="h-5 w-5 text-[var(--gold)]" /> {ru ? "Войдите, чтобы сохранять ранг на разных устройствах." : "Sign in to save your rank across devices."}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ru ? "Можно играть гостем и сохранить прогресс позже." : "You can keep playing as a guest, then save progress when you are ready."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth">{t("signIn")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/lobby">{ru ? "Продолжить гостем" : "Continue as guest"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) return null;
  const podium = [entries[1], entries[0], entries[2]].filter(Boolean);

  return (
    <div className="mt-8 grid items-end gap-3 md:grid-cols-3">
      {podium.map((player) => {
        const champion = player.rank === 1;
        return (
          <div key={`podium-${player.id}`} className={`relative overflow-hidden rounded-xl border p-5 transition ${champion ? "border-[var(--gold)]/45 bg-[rgba(214,173,99,0.15)] md:min-h-64" : "border-white/10 bg-white/[0.05] md:min-h-52"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`flex items-center justify-center rounded-lg font-[var(--font-display)] font-black ${champion ? "h-14 w-14 bg-[var(--gold)] text-2xl text-slate-950" : "h-12 w-12 bg-slate-950/70 text-xl text-white"}`}>
                #{player.rank}
              </div>
              {player.isPro ? <FounderBadge /> : null}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Avatar name={displayPlayerName(player)} large={champion} />
              <div>
                <p className="font-[var(--font-display)] text-xl font-bold">{displayPlayerName(player)}</p>
                <p className="text-xs text-slate-400">{player.city}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <MiniStat label="Rating" value={player.rating.toString()} />
              <MiniStat label="Coach" value={player.coachScore.toString()} />
            </div>
            <BadgeList badges={player.badges.slice(0, champion ? 3 : 2)} compact />
          </div>
        );
      })}
    </div>
  );
}

function PlayerRow({ player, rank }: { player: LeaderboardEntry; rank: number }) {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  return (
    <div className={`grid gap-3 p-4 transition hover:bg-white/[0.04] lg:grid-cols-[4rem_1.4fr_0.8fr_0.8fr_0.8fr_1fr_0.9fr] lg:items-center ${player.isCurrentPlayer ? "bg-[rgba(127,163,106,0.12)] ring-1 ring-inset ring-[var(--mint)]/30" : ""}`}>
      <div className="flex items-center justify-between lg:block">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/70 font-[var(--font-display)] text-lg font-bold">
          {rank}
        </span>
        <span className="font-[var(--font-display)] text-2xl font-black lg:hidden">{player.rating}</span>
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <Avatar name={displayPlayerName(player)} />
          <span className="truncate">{displayPlayerName(player)}</span>
          {player.isCurrentPlayer ? <span className="rounded-md bg-[var(--mint)] px-2 py-0.5 text-[0.65rem] font-bold text-slate-950">{ru ? "Вы" : "You"}</span> : null}
          {player.isPro ? <FounderBadge compact /> : null}
        </p>
      </div>
      <Metric label={t("city")} value={player.city} />
      <Metric label={ru ? "Рейтинг" : "Rating"} value={player.rating.toString()} strong />
      <Metric label={ru ? "Разбор" : "Coach"} value={player.coachScore.toString()} />
      <div>
        <p className="text-xs text-slate-500 lg:hidden">{ru ? "Бейджи" : "Badges"}</p>
        <BadgeList badges={player.badges.slice(0, 2)} compact />
      </div>
      <Metric label={ru ? "Последний разбор" : "Last Review"} value={formatLastActive(player.lastPlayedAt, locale)} icon={<CalendarDays className="h-3.5 w-3.5" />} />
    </div>
  );
}

function CompactPlayer({ player, rank }: { player: LeaderboardEntry; rank: number }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  return (
    <div className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg border p-3 ${player.isCurrentPlayer ? "border-[var(--mint)]/35 bg-[rgba(127,163,106,0.1)]" : "border-white/10 bg-slate-950/35"}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/70 font-[var(--font-display)] font-bold">{rank}</div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-semibold">
          <span className="truncate">{displayPlayerName(player)}</span>
          {player.isPro ? <Crown className="h-4 w-4 shrink-0 text-[var(--gold)]" /> : null}
        </p>
        <p className="mt-1 text-xs text-slate-400">{player.city} / {player.reviews} {ru ? "разборов" : "reviews"}</p>
      </div>
      <div className="text-right">
        <p className="font-[var(--font-display)] text-xl font-bold">{player.rating}</p>
        <p className="text-xs text-[var(--mint)]">{ru ? "тренер" : "coach"} {player.coachScore}</p>
      </div>
    </div>
  );
}

function EmptyCityState() {
  const { t, locale } = useI18n();
  const ru = locale === "ru";
  return (
    <div className="p-5">
      <div className="rounded-lg border border-[var(--gold)]/25 bg-[rgba(214,173,99,0.08)] p-5">
        <p className="font-[var(--font-display)] text-xl font-bold">{ru ? "Станьте первым игроком в этом городе." : "Be the first player in this city."}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {ru ? "Сыграйте партию и разберите её, чтобы попасть в рейтинг." : "Play and review a game to enter the rankings."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/lobby">{t("startGame")}</Link>
        </Button>
      </div>
    </div>
  );
}

function RecentActivity({ reviews }: { reviews: GameReviewRecord[] }) {
  const { locale } = useI18n();
  const ru = locale === "ru";
  if (!reviews.length) {
    return <p className="rounded-lg border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">{ru ? "Разобранных партий пока нет. Сделайте разбор, и здесь появится лента тренировок." : "No reviewed games yet. Analyze a game and this becomes your training activity feed."}</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={`${review.gameId}-${review.playerId}`} className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <Search className="h-4 w-4 text-[var(--mint)]" /> {sanitizeDemoName(review.displayName)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{review.city} / {ru ? "точность" : "accuracy"} {review.accuracy}% / {review.blunders} {ru ? "зевков" : "blunders"}</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">{review.summary}</p>
        </div>
      ))}
    </div>
  );
}

function BadgeList({ badges, compact }: { badges: string[]; compact?: boolean }) {
  const { t } = useI18n();
  if (!badges.length) return <p className={`${compact ? "mt-1" : "mt-3"} text-xs text-slate-500`}>{t("badgesUnlock")}</p>;

  return (
    <div className={`${compact ? "mt-1" : "mt-3"} flex flex-wrap gap-2 ${compact ? "text-[0.65rem]" : "text-xs"}`}>
      {badges.map((badge) => (
        <span key={badge} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.07] px-2.5 py-1 font-semibold text-slate-200">
          <Award className="h-3.5 w-3.5 text-[var(--gold)]" /> {badge}
        </span>
      ))}
    </div>
  );
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CC";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(145deg,rgba(214,173,99,0.95),rgba(127,163,106,0.88))] font-[var(--font-display)] font-black text-slate-950 ${large ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm"}`}>
      {initials}
    </span>
  );
}

function Metric({ label, value, strong, icon }: { label: string; value: string; strong?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-500 lg:hidden">{icon}{label}</p>
      <p className={`${strong ? "font-[var(--font-display)] text-xl font-bold text-white" : "text-sm font-semibold text-slate-300"}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950/45 p-3">
      <p className="font-[var(--font-display)] text-xl font-bold">{value}</p>
      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function FounderBadge({ compact }: { compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-[var(--gold)]/35 bg-[rgba(214,173,99,0.12)] font-semibold text-[var(--gold)] ${compact ? "px-2 py-0.5 text-[0.65rem]" : "px-3 py-1 text-xs"}`}>
      <Crown className="h-3.5 w-3.5" /> Founder Pro
    </span>
  );
}

function formatRank(rank: number | null, locale: string = "en") {
  return rank ? `#${rank}` : locale === "ru" ? "Без ранга" : "Unranked";
}

function formatLastActive(value: string | null | undefined, locale: string = "en") {
  if (!value) return locale === "ru" ? "Новый" : "New";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return locale === "ru" ? "Сегодня" : "Today";
  if (days === 1) return locale === "ru" ? "Вчера" : "Yesterday";
  if (days < 7) return locale === "ru" ? `${days} дн. назад` : `${days}d ago`;
  return "7d+";
}

function displayPlayerName(player: Pick<LeaderboardEntry, "name" | "rank" | "isCurrentPlayer">) {
  if (player.isCurrentPlayer) return player.name;
  return sanitizeDemoName(player.name, player.rank);
}

function sanitizeDemoName(name: string, index = 1) {
  if (!/(guest gambiteer|guest gambitee|^p1$|p1 white|codex|qa|phase|test user|local|test|demo)/i.test(name)) return name;
  const names = ["Aruzhan S.", "Nursultan K.", "Dana K.", "Dias M.", "Amina N.", "Timur S.", "Miras A.", "Alina B."];
  return names[Math.abs(index - 1) % names.length];
}
