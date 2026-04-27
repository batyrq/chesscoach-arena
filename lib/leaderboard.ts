import { leaderboardPlayers } from "@/lib/demo-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOrCreateLocalPlayerId, loadProfile, type StoredGameReview } from "@/lib/storage";
import type {
  AnalysisResult,
  Badge,
  City,
  Game,
  GameReviewRecord,
  LeaderboardEntry,
  LeaderboardUpdateResult,
  Move,
  PlayerProfile,
} from "@/lib/types";

const playersKey = "chesscoach.leaderboard.players";
const reviewsKey = "chesscoach.leaderboard.reviews";

type AdapterMode = "supabase" | "local";

type RecordReviewInput = {
  gameId: string;
  analysis: AnalysisResult;
  result?: Game["result"];
  review?: StoredGameReview;
};

type SupabasePlayerRow = {
  id: string;
  guest_id: string | null;
  display_name: string;
  city: City;
  rating: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  games: number | null;
  reviews: number | null;
  coach_score: number | null;
  pro_status: string | null;
  updated_at: string | null;
};

type SupabaseLeaderboardRow = {
  id: string;
  player_id: string;
  city: City;
  rating: number | null;
  coach_score: number | null;
  games: number | null;
  wins: number | null;
  reviews: number | null;
  updated_at: string | null;
};

type SupabaseReviewRow = {
  game_id: string;
  player_id: string;
  accuracy: number | null;
  blunders: number | null;
  mistakes: number | null;
  ai_review: { summary?: string; ratingChange?: number; coachScoreChange?: number } | null;
  counted_for_progression: boolean | null;
  created_at: string | null;
};

export interface LeaderboardAdapter {
  mode: AdapterMode;
  getCurrentPlayer(): Promise<PlayerProfile | null>;
  getEntries(): Promise<LeaderboardEntry[]>;
  getRecentReviews(limit?: number): Promise<GameReviewRecord[]>;
  getPlayerRank(playerId: string, city: City): Promise<number | null>;
  getBadges(playerId: string): Promise<Badge[]>;
  recordAnalyzedGame(input: RecordReviewInput): Promise<LeaderboardUpdateResult | null>;
}

export class LocalLeaderboardAdapter implements LeaderboardAdapter {
  mode: AdapterMode = "local";

  async getCurrentPlayer() {
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

  async getEntries() {
    const current = await this.getCurrentPlayer();
    const localPlayers = Object.values(readPlayers());
    const demoEntries = getDemoEntries(current);
    const localEntries: LeaderboardEntry[] = localPlayers.map((player) => ({
      ...player,
      id: player.playerId,
      name: player.displayName,
      rank: 0,
      isCurrentPlayer: current?.playerId === player.playerId,
      streak: Math.min(9, Math.max(1, player.reviews)),
    }));

    return rankEntries([...demoEntries, ...localEntries]);
  }

  async getRecentReviews(limit = 6) {
    return readReviews()
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
      .slice(0, limit);
  }

  async getPlayerRank(playerId: string, city: City) {
    return rankFor(await this.getEntries(), playerId, city);
  }

  async getBadges(playerId: string) {
    return readPlayers()[playerId]?.badges ?? [];
  }

  async recordAnalyzedGame(input: RecordReviewInput) {
    const current = await this.getCurrentPlayer();
    if (!current) return null;

    const reviews = readReviews();
    const existing = reviews.find((review) => review.gameId === input.gameId && review.playerId === current.playerId);
    const currentRank = await this.getPlayerRank(current.playerId, current.city);

    if (existing) {
      return {
        alreadyCounted: true,
        player: current,
        previous: current,
        record: existing,
        ratingChange: 0,
        coachScoreChange: 0,
        cityRank: currentRank ?? 1,
        oldRank: currentRank,
        newRank: currentRank,
        badgesEarned: [],
        adapterMode: this.mode,
      };
    }

    const previous = { ...current };
    const oldRank = await this.getPlayerRank(current.playerId, current.city);
    const result = input.result ?? "*";
    const ratingChange = ratingDelta(result);
    const coachScore = nextCoachScore(input.analysis);
    const coachScoreChange = coachScore - current.coachScore;
    const provisionalPlayer: PlayerProfile = {
      ...current,
      rating: Math.max(100, current.rating + ratingChange),
      games: current.games + 1,
      wins: current.wins + (result === "1-0" ? 1 : 0),
      losses: current.losses + (result === "0-1" ? 1 : 0),
      draws: current.draws + (result === "1/2-1/2" ? 1 : 0),
      reviews: current.reviews + 1,
      coachScore,
      lastPlayedAt: new Date().toISOString(),
    };
    const newRank = rankFor(rankEntries([...await this.getEntries(), toEntry(provisionalPlayer, true)]), current.playerId, current.city);
    const nextBadges = badgesFor(provisionalPlayer, input.analysis, oldRank, newRank);
    const badgesEarned = nextBadges.filter((badge) => !current.badges.includes(badge));
    const player = { ...provisionalPlayer, badges: nextBadges };

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
      summary: input.analysis.summary,
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
      cityRank: newRank ?? 1,
      oldRank,
      newRank,
      badgesEarned,
      adapterMode: this.mode,
    };
  }
}

export class SupabaseLeaderboardAdapter implements LeaderboardAdapter {
  mode: AdapterMode = "supabase";
  private readonly fallback = new LocalLeaderboardAdapter();

  async getCurrentPlayer() {
    return this.withFallback((client) => this.upsertCurrentPlayer(client), () => this.fallback.getCurrentPlayer());
  }

  async getEntries() {
    return this.withFallback(async (client) => {
      const current = await this.upsertCurrentPlayer(client);
      const { data, error } = await client
        .from("leaderboard_entries")
        .select("id,player_id,city,rating,coach_score,games,wins,reviews,updated_at")
        .order("rating", { ascending: false })
        .order("coach_score", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as SupabaseLeaderboardRow[];
      if (!rows.length) {
        return rankEntries([
          ...getDemoEntries(current).map((entry) => ({ ...entry, isDemo: true })),
          ...(current ? [toEntry(current, true)] : []),
        ]);
      }

      const playerIds = rows.map((row) => row.player_id);
      const [profiles, badges] = await Promise.all([
        this.fetchPlayers(client, playerIds),
        this.fetchBadges(client, playerIds),
      ]);
      const profileById = new Map(profiles.map((player) => [player.id, player]));
      const badgesByPlayer = groupBadges(badges);
      const entries = rows.map((row) => {
        const profile = profileById.get(row.player_id);
        const wins = row.wins ?? profile?.wins ?? 0;
        const games = row.games ?? profile?.games ?? 0;
        const losses = profile?.losses ?? Math.max(0, games - wins);
        const draws = profile?.draws ?? 0;
        return {
          playerId: row.player_id,
          id: row.id,
          name: profile?.display_name ?? "Guest Gambiteer",
          displayName: profile?.display_name ?? "Guest Gambiteer",
          city: row.city,
          rating: row.rating ?? profile?.rating ?? 1200,
          games,
          wins,
          losses,
          draws,
          reviews: row.reviews ?? profile?.reviews ?? 0,
          coachScore: row.coach_score ?? profile?.coach_score ?? 50,
          lastPlayedAt: row.updated_at,
          badges: badgesByPlayer.get(row.player_id) ?? [],
          rank: 0,
          isCurrentPlayer: current?.playerId === row.player_id,
          isDemo: false,
          isPro: profile?.pro_status === "pro",
          streak: Math.min(9, Math.max(1, row.reviews ?? 0)),
        } satisfies LeaderboardEntry;
      });

      return rankEntries(entries);
    }, () => this.fallback.getEntries());
  }

  async getRecentReviews(limit = 6) {
    return this.withFallback(async (client) => {
      const { data, error } = await client
        .from("reviews")
        .select("game_id,player_id,accuracy,blunders,mistakes,ai_review,counted_for_progression,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rows = (data ?? []) as SupabaseReviewRow[];
      const playerIds = [...new Set(rows.map((row) => row.player_id))];
      const players = await this.fetchPlayers(client, playerIds);
      const playerById = new Map(players.map((player) => [player.id, player]));

      return rows.map((row) => {
        const player = playerById.get(row.player_id);
        return {
          gameId: row.game_id,
          playerId: row.player_id,
          displayName: player?.display_name ?? "Guest Gambiteer",
          city: player?.city ?? "Almaty",
          result: "*",
          accuracy: row.accuracy ?? 0,
          blunders: row.blunders ?? 0,
          mistakes: row.mistakes ?? 0,
          ratingChange: row.ai_review?.ratingChange ?? 0,
          coachScoreChange: row.ai_review?.coachScoreChange ?? 0,
          reviewedAt: row.created_at ?? new Date().toISOString(),
          summary: row.ai_review?.summary ?? "AI Coach review saved.",
        };
      });
    }, () => this.fallback.getRecentReviews(limit));
  }

  async getPlayerRank(playerId: string, city: City) {
    return rankFor(await this.getEntries(), playerId, city);
  }

  async getBadges(playerId: string) {
    return this.withFallback(async (client) => {
      const badges = await this.fetchBadges(client, [playerId]);
      return badges.map((row) => row.badge as Badge);
    }, () => this.fallback.getBadges(playerId));
  }

  async recordAnalyzedGame(input: RecordReviewInput) {
    return this.withFallback(async (client) => {
      const current = await this.upsertCurrentPlayer(client);
      if (!current) return null;

      const { data: existingReview, error: existingReviewError } = await client
        .from("reviews")
        .select("game_id,player_id,accuracy,blunders,mistakes,ai_review,counted_for_progression,created_at")
        .eq("game_id", input.gameId)
        .eq("player_id", current.playerId)
        .maybeSingle();

      if (existingReviewError) throw existingReviewError;

      const result = input.result ?? input.review?.result ?? "*";
      const oldRank = await this.getPlayerRank(current.playerId, current.city);
      const savedRecord = toReviewRecord(existingReview as SupabaseReviewRow | null, current, result, input.analysis);

      if (existingReview?.counted_for_progression) {
        return {
          alreadyCounted: true,
          player: current,
          previous: current,
          record: savedRecord,
          ratingChange: 0,
          coachScoreChange: 0,
          cityRank: oldRank ?? 1,
          oldRank,
          newRank: oldRank,
          badgesEarned: [],
          adapterMode: this.mode,
        };
      }

      await this.saveGame(client, input, result, current.playerId);

      const previous = { ...current };
      const ratingChange = existingReview?.ai_review?.ratingChange ?? ratingDelta(result);
      const coachScore = nextCoachScore(input.analysis);
      const coachScoreChange = existingReview?.ai_review?.coachScoreChange ?? coachScore - current.coachScore;
      const nextPlayer: PlayerProfile = {
        ...current,
        rating: Math.max(100, current.rating + ratingChange),
        games: current.games + 1,
        wins: current.wins + (result === "1-0" ? 1 : 0),
        losses: current.losses + (result === "0-1" ? 1 : 0),
        draws: current.draws + (result === "1/2-1/2" ? 1 : 0),
        reviews: current.reviews + 1,
        coachScore,
        lastPlayedAt: new Date().toISOString(),
      };

      await this.savePlayerProgress(client, nextPlayer);
      const provisionalRank = rankFor(rankEntries([...await this.getEntries(), toEntry(nextPlayer, true)]), nextPlayer.playerId, nextPlayer.city);
      const nextBadges = badgesFor(nextPlayer, input.analysis, oldRank, provisionalRank);
      const badgesEarned = nextBadges.filter((badge) => !current.badges.includes(badge));
      await this.saveBadges(client, nextPlayer.playerId, nextPlayer.city, badgesEarned);

      const record: GameReviewRecord = {
        gameId: input.gameId,
        playerId: nextPlayer.playerId,
        displayName: nextPlayer.displayName,
        city: nextPlayer.city,
        result,
        accuracy: input.analysis.accuracy,
        blunders: input.analysis.blunders,
        mistakes: input.analysis.mistakes,
        ratingChange,
        coachScoreChange,
        reviewedAt: nextPlayer.lastPlayedAt ?? new Date().toISOString(),
        summary: input.analysis.summary,
      };
      await this.saveReview(client, input, result, nextPlayer.playerId, true, ratingChange, coachScoreChange);

      const player = { ...nextPlayer, badges: nextBadges };
      const newRank = await this.getPlayerRank(player.playerId, player.city);

      return {
        alreadyCounted: false,
        player,
        previous,
        record,
        ratingChange,
        coachScoreChange,
        cityRank: newRank ?? provisionalRank ?? 1,
        oldRank,
        newRank: newRank ?? provisionalRank,
        badgesEarned,
        adapterMode: this.mode,
      };
    }, () => this.fallback.recordAnalyzedGame(input));
  }

  private async upsertCurrentPlayer(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>) {
    const profile = loadProfile();
    if (!profile) return null;

    const fallbackProfile = createPlayerProfile(profile.playerId, profile.name, profile.city);
    const { data, error } = await client
      .from("players")
      .upsert({
        guest_id: profile.playerId,
        display_name: profile.name.trim() || "Guest Gambiteer",
        city: profile.city,
      }, { onConflict: "guest_id" })
      .select("id,guest_id,display_name,city,rating,wins,losses,draws,games,reviews,coach_score,pro_status,updated_at")
      .single();

    if (error) throw error;

    const player = rowToPlayerProfile(data as SupabasePlayerRow, fallbackProfile.badges);
    const badges = await this.getBadgesForClient(client, player.playerId);
    const hydrated = { ...player, badges };
    await this.saveLeaderboardEntry(client, hydrated);
    return hydrated;
  }

  private async saveGame(
    client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>,
    input: RecordReviewInput,
    result: Game["result"],
    playerId: string,
  ) {
    const review = input.review;
    const roomId = input.gameId;
    const { error: roomError } = await client.from("rooms").upsert({
      id: roomId,
      status: "ended",
      fen: review?.fen ?? "",
      pgn: review?.pgn ?? "",
      current_turn: "w",
      move_count: review?.moves.length ?? input.analysis.evaluations.length,
      updated_at: new Date().toISOString(),
    });

    if (roomError) throw roomError;

    const { error } = await client.from("games").upsert({
      id: input.gameId,
      room_id: roomId,
      white_player_id: playerId,
      result,
      pgn: review?.pgn ?? "",
      final_fen: review?.fen ?? "",
      move_count: review?.moves.length ?? input.analysis.evaluations.length,
      completed_at: new Date().toISOString(),
    });

    if (error) throw error;

    if (review?.moves.length) {
      await this.saveMoves(client, roomId, playerId, review.moves);
    }
  }

  private async saveMoves(
    client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>,
    roomId: string,
    playerId: string,
    moves: Move[],
  ) {
    const rows = moves.map((move, index) => ({
      room_id: roomId,
      player_id: playerId,
      move_number: index + 1,
      san: move.san,
      from_square: move.from,
      to_square: move.to,
      fen_before: index === 0 ? null : moves[index - 1]?.fenAfter,
      fen_after: move.fenAfter,
    }));

    const { error } = await client.from("moves").insert(rows);
    if (error && error.code !== "23505") throw error;
  }

  private async saveReview(
    client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>,
    input: RecordReviewInput,
    result: Game["result"],
    playerId: string,
    counted: boolean,
    ratingChange: number,
    coachScoreChange: number,
  ) {
    const { error } = await client.from("reviews").upsert({
      game_id: input.gameId,
      player_id: playerId,
      provider: "engine-lite",
      accuracy: input.analysis.accuracy,
      blunders: input.analysis.blunders,
      mistakes: input.analysis.mistakes,
      inaccuracies: input.analysis.inaccuracies,
      material_swing: input.analysis.materialTimeline,
      critical_moment: input.analysis.criticalMoment ?? {},
      ai_review: {
        summary: input.analysis.summary,
        biggestMistake: input.analysis.biggestMistake,
        betterMove: input.analysis.betterMove,
        whyItWorks: input.analysis.whyItWorks,
        result,
        ratingChange,
        coachScoreChange,
      },
      puzzle: { drill: input.analysis.drill },
      counted_for_progression: counted,
    }, { onConflict: "game_id,player_id" });

    if (error) throw error;
  }

  private async savePlayerProgress(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>, player: PlayerProfile) {
    const { error } = await client
      .from("players")
      .update({
        rating: player.rating,
        games: player.games,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        reviews: player.reviews,
        coach_score: player.coachScore,
        updated_at: player.lastPlayedAt,
      })
      .eq("id", player.playerId);

    if (error) throw error;
    await this.saveLeaderboardEntry(client, player);
  }

  private async saveLeaderboardEntry(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>, player: PlayerProfile) {
    const { error } = await client.from("leaderboard_entries").upsert({
      player_id: player.playerId,
      city: player.city,
      rating: player.rating,
      coach_score: player.coachScore,
      games: player.games,
      wins: player.wins,
      reviews: player.reviews,
      updated_at: player.lastPlayedAt ?? new Date().toISOString(),
    }, { onConflict: "player_id" });

    if (error) throw error;
  }

  private async saveBadges(
    client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>,
    playerId: string,
    city: City,
    badges: Badge[],
  ) {
    if (!badges.length) return;
    const { error } = await client.from("badges").upsert(
      badges.map((badge) => ({ player_id: playerId, badge, city })),
      { onConflict: "player_id,badge" },
    );

    if (error) throw error;
  }

  private async fetchPlayers(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>, playerIds: string[]) {
    if (!playerIds.length) return [];
    const { data, error } = await client
      .from("players")
      .select("id,guest_id,display_name,city,rating,wins,losses,draws,games,reviews,coach_score,pro_status,updated_at")
      .in("id", playerIds);

    if (error) throw error;
    return (data ?? []) as SupabasePlayerRow[];
  }

  private async fetchBadges(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>, playerIds: string[]) {
    if (!playerIds.length) return [];
    const { data, error } = await client.from("badges").select("player_id,badge").in("player_id", playerIds);
    if (error) throw error;
    return (data ?? []) as Array<{ player_id: string; badge: string }>;
  }

  private async getBadgesForClient(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>, playerId: string) {
    const rows = await this.fetchBadges(client, [playerId]);
    return rows.map((row) => row.badge as Badge);
  }

  private async withFallback<T>(
    action: (client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>) => Promise<T>,
    fallback: () => Promise<T>,
  ) {
    const client = getBrowserSupabaseClient();
    if (!client) return fallback();

    try {
      this.mode = "supabase";
      return await action(client);
    } catch (error) {
      console.warn("Supabase leaderboard unavailable; using local fallback.", error instanceof Error ? error.message : "Unknown error");
      this.mode = "local";
      return fallback();
    }
  }
}

export function createLeaderboardAdapter(): LeaderboardAdapter {
  if (typeof window !== "undefined" && getBrowserSupabaseClient()) {
    return new SupabaseLeaderboardAdapter();
  }

  return new LocalLeaderboardAdapter();
}

export function getLeaderboardMode(mode?: AdapterMode) {
  if (mode === "supabase") return "Live Supabase ranking";
  if (mode === "local") return "Local demo rankings";
  return getBrowserSupabaseClient() ? "Live Supabase ranking" : "Local demo rankings";
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
    badges: [],
  };
}

function rowToPlayerProfile(row: SupabasePlayerRow, badges: Badge[] = []): PlayerProfile {
  return {
    playerId: row.id,
    displayName: row.display_name,
    city: row.city,
    rating: row.rating ?? 1200,
    games: row.games ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    reviews: row.reviews ?? 0,
    coachScore: row.coach_score ?? 50,
    lastPlayedAt: row.updated_at,
    badges,
  };
}

function toEntry(player: PlayerProfile, isCurrentPlayer = false): LeaderboardEntry {
  return {
    ...player,
    id: player.playerId,
    name: player.displayName,
    rank: 0,
    isCurrentPlayer,
    streak: Math.min(9, Math.max(1, player.reviews)),
  };
}

function getDemoEntries(current: PlayerProfile | null): LeaderboardEntry[] {
  return leaderboardPlayers.map((player) => ({
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
    isCurrentPlayer: current?.playerId === player.id,
    isDemo: true,
    isPro: player.isPro,
    streak: player.streak,
  }));
}

function rankEntries(entries: LeaderboardEntry[]) {
  const byPlayer = new Map<string, LeaderboardEntry>();
  for (const entry of entries) {
    const existing = byPlayer.get(entry.playerId);
    if (!existing || entry.isCurrentPlayer || (!entry.isDemo && existing.isDemo)) {
      byPlayer.set(entry.playerId, entry);
    }
  }

  return [...byPlayer.values()]
    .sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore || b.reviews - a.reviews)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function rankFor(entries: LeaderboardEntry[], playerId: string, city: City) {
  const cityEntries = entries
    .filter((entry) => entry.city === city)
    .sort((a, b) => b.rating - a.rating || b.coachScore - a.coachScore);
  const rank = cityEntries.findIndex((entry) => entry.playerId === playerId);
  return rank >= 0 ? rank + 1 : null;
}

function ratingDelta(result: Game["result"]) {
  if (result === "1-0") return 18;
  if (result === "0-1") return -12;
  if (result === "1/2-1/2") return 3;
  return 5;
}

function nextCoachScore(analysis: AnalysisResult) {
  const base = analysis.accuracy;
  const score = base - analysis.blunders * 4 - analysis.mistakes * 2 + (analysis.blunders === 0 ? 3 : 0);
  return clamp(score, 0, 100);
}

function badgesFor(player: PlayerProfile, analysis: AnalysisResult, oldRank: number | null, newRank: number | null): Badge[] {
  const badges = new Set<Badge>(player.badges);
  if (player.reviews >= 1) badges.add("Coach Reviewed");
  if (analysis.blunders === 0) badges.add("No Blunders");
  if (player.rating >= 1250 || player.rating > 1200) badges.add("Rising Star");
  if (oldRank === null || (newRank !== null && oldRank !== null && newRank < oldRank)) badges.add("City Climber");
  if (newRank === 1) badges.add("City Champion");
  return [...badges];
}

function demoBadges(coachScore: number, games: number, reviews: number): Badge[] {
  return [
    ...(games >= 35 ? ["City Climber" as const] : []),
    ...(reviews > 0 ? ["Coach Reviewed" as const] : []),
    ...(coachScore >= 88 ? ["No Blunders" as const] : []),
  ];
}

function groupBadges(rows: Array<{ player_id: string; badge: string }>) {
  const grouped = new Map<string, Badge[]>();
  for (const row of rows) {
    const badges = grouped.get(row.player_id) ?? [];
    badges.push(row.badge as Badge);
    grouped.set(row.player_id, badges);
  }
  return grouped;
}

function toReviewRecord(
  row: SupabaseReviewRow | null,
  current: PlayerProfile,
  result: Game["result"],
  analysis: AnalysisResult,
): GameReviewRecord | null {
  if (!row) return null;
  return {
    gameId: row.game_id,
    playerId: row.player_id,
    displayName: current.displayName,
    city: current.city,
    result,
    accuracy: row.accuracy ?? analysis.accuracy,
    blunders: row.blunders ?? analysis.blunders,
    mistakes: row.mistakes ?? analysis.mistakes,
    ratingChange: row.ai_review?.ratingChange ?? 0,
    coachScoreChange: row.ai_review?.coachScoreChange ?? 0,
    reviewedAt: row.created_at ?? new Date().toISOString(),
    summary: row.ai_review?.summary ?? analysis.summary,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
