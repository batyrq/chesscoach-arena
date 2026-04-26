import { leaderboardPlayers } from "@/lib/demo-data";
import { getOrCreateLocalPlayerId, loadProfile } from "@/lib/storage";
import type { AnalysisResult, Badge, City, Game, GameReviewRecord, LeaderboardEntry, LeaderboardUpdateResult, PlayerProfile } from "@/lib/types";

const playersKey = "chesscoach.leaderboard.players";
const reviewsKey = "chesscoach.leaderboard.reviews";

export interface LeaderboardAdapter {
  getCurrentPlayer(): PlayerProfile | null;
  getEntries(): LeaderboardEntry[];
  getRecentReviews(limit?: number): GameReviewRecord[];
  recordAnalyzedGame(input: {
    gameId: string;
    analysis: AnalysisResult;
    result?: Game["result"];
  }): LeaderboardUpdateResult | null;
}

export class LocalLeaderboardAdapter implements LeaderboardAdapter {
  getCurrentPlayer() {
    const profile = loadProfile();
    if (!profile) return null;

    const players = readPlayers();
    const existing = players[profile.playerId];
    const next = existing
      ? { ...existing, displayName: profile.name, city: profile.city }
      : createPlayerProfile(profile.playerId, profile.name, profile.city);

    writePlayers({ ...players, [next.playerId]: next });
    return next;
  }

  getEntries() {
    const current = this.getCurrentPlayer();
    const localPlayers = Object.values(readPlayers());
    const demoEntries: LeaderboardEntry[] = leaderboardPlayers.map((player) => ({
      playerId: player.id,
      id: player.id,
      name: player.name,
      displayName: player.name,
      city: player.city,
      rating: player.rating,
      games: player.games,
      wins: player.wins,
      losses: Math.max(0, player.games - player.wins - Math.floor(player.games * 0.12)),
      draws: Math.floor(player.games * 0.12),
      reviews: player.reviews,
      coachScore: player.coachScore,
      lastPlayedAt: null,
      badges: demoBadges(player.coachScore, player.games, player.reviews),
      rank: 0,
      isDemo: true,
      isPro: player.isPro,
      streak: player.streak
    }));
    const localEntries: LeaderboardEntry[] = localPlayers.map((player) => ({
      ...player,
      id: player.playerId,
      name: player.displayName,
      rank: 0,
      isCurrentPlayer: current?.playerId === player.playerId,
      streak: Math.min(9, Math.max(1, player.reviews))
    }));

    return rankEntries([...demoEntries, ...localEntries]);
  }

  getRecentReviews(limit = 6) {
    return readReviews()
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
      .slice(0, limit);
  }

  recordAnalyzedGame(input: { gameId: string; analysis: AnalysisResult; result?: Game["result"] }) {
    const current = this.getCurrentPlayer();
    if (!current) return null;

    const reviews = readReviews();
    const existing = reviews.find((review) => review.gameId === input.gameId && review.playerId === current.playerId);
    const entries = this.getEntries();
    const currentRank = rankFor(entries, current.playerId, current.city);

    if (existing) {
      return {
        alreadyCounted: true,
        player: current,
        previous: current,
        record: existing,
        ratingChange: 0,
        coachScoreChange: 0,
        cityRank: currentRank
      };
    }

    const previous = { ...current };
    const result = input.result ?? "*";
    const ratingChange = ratingDelta(result);
    const coachScore = nextCoachScore(current.coachScore, input.analysis);
    const coachScoreChange = coachScore - current.coachScore;
    const player: PlayerProfile = {
      ...current,
      rating: Math.max(100, current.rating + ratingChange),
      games: current.games + 1,
      wins: current.wins + (result === "1-0" ? 1 : 0),
      losses: current.losses + (result === "0-1" ? 1 : 0),
      draws: current.draws + (result === "1/2-1/2" ? 1 : 0),
      reviews: current.reviews + 1,
      coachScore,
      lastPlayedAt: new Date().toISOString()
    };
    player.badges = badgesFor(player, input.analysis);

    const record: GameReviewRecord = {
      gameId: input.gameId,
      playerId: player.playerId,
      displayName: player.displayName,
      city: player.city,
      result,
      accuracy: input.analysis.accuracy,
      blunders: input.analysis.blunders,
      mistakes: input.analysis.mistakes,
      ratingChange,
      coachScoreChange,
      reviewedAt: player.lastPlayedAt ?? new Date().toISOString(),
      summary: input.analysis.summary
    };

    writePlayers({ ...readPlayers(), [player.playerId]: player });
    writeReviews([record, ...reviews].slice(0, 40));

    return {
      alreadyCounted: false,
      player,
      previous,
      record,
      ratingChange,
      coachScoreChange,
      cityRank: rankFor(this.getEntries(), player.playerId, player.city)
    };
  }
}

export class SupabaseLeaderboardAdapter implements LeaderboardAdapter {
  private readonly fallback = new LocalLeaderboardAdapter();

  getCurrentPlayer() {
    return this.fallback.getCurrentPlayer();
  }

  getEntries() {
    return this.fallback.getEntries();
  }

  getRecentReviews(limit?: number) {
    return this.fallback.getRecentReviews(limit);
  }

  recordAnalyzedGame(input: { gameId: string; analysis: AnalysisResult; result?: Game["result"] }) {
    return this.fallback.recordAnalyzedGame(input);
  }
}

export function createLeaderboardAdapter(): LeaderboardAdapter {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new SupabaseLeaderboardAdapter();
  }

  return new LocalLeaderboardAdapter();
}

export function getLeaderboardMode() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Supabase rankings" : "Local demo rankings";
}

function readPlayers(): Record<string, PlayerProfile> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(playersKey);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, PlayerProfile>;
  } catch {
    return {};
  }
}

function writePlayers(players: Record<string, PlayerProfile>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(playersKey, JSON.stringify(players));
}

function readReviews(): GameReviewRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(reviewsKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as GameReviewRecord[];
  } catch {
    return [];
  }
}

function writeReviews(reviews: GameReviewRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(reviewsKey, JSON.stringify(reviews));
}

function createPlayerProfile(playerId: string, displayName: string, city: City): PlayerProfile {
  return {
    playerId: playerId || getOrCreateLocalPlayerId(),
    displayName,
    city,
    rating: 1200,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    reviews: 0,
    coachScore: 50,
    lastPlayedAt: null,
    badges: []
  };
}

function rankEntries(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore || b.reviews - a.reviews)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function rankFor(entries: LeaderboardEntry[], playerId: string, city: City) {
  const cityEntries = entries.filter((entry) => entry.city === city).sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore);
  return Math.max(1, cityEntries.findIndex((entry) => entry.playerId === playerId) + 1);
}

function ratingDelta(result: Game["result"]) {
  if (result === "1-0") return 18;
  if (result === "0-1") return -12;
  if (result === "1/2-1/2") return 3;
  return 0;
}

function nextCoachScore(current: number, analysis: AnalysisResult) {
  const reviewBonus = 5;
  const accuracyLift = Math.round((analysis.accuracy - 70) / 4);
  const penalty = analysis.blunders * 3 + analysis.mistakes;
  return clamp(current + reviewBonus + accuracyLift - penalty, 0, 100);
}

function badgesFor(player: PlayerProfile, analysis: AnalysisResult): Badge[] {
  const badges = new Set<Badge>(player.badges);
  if (player.games >= 3 || player.rating >= 1236) badges.add("City Climber");
  if (player.reviews >= 1) badges.add("Coach Reviewed");
  if (analysis.blunders === 0) badges.add("No Blunders");
  if (player.rating >= 1218 && player.games <= 5) badges.add("Rising Star");
  return [...badges];
}

function demoBadges(coachScore: number, games: number, reviews: number): Badge[] {
  return [
    ...(games >= 35 ? ["City Climber" as const] : []),
    ...(reviews > 0 ? ["Coach Reviewed" as const] : []),
    ...(coachScore >= 88 ? ["No Blunders" as const] : [])
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
