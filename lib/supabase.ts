export {
  getBrowserSupabaseClient,
  isSupabaseConfigured,
} from "./supabase/client";

import { getBrowserSupabaseClient } from "./supabase/client";

export function getSupabaseClient() {
  return getBrowserSupabaseClient();
}

export const supabaseSchemaNotes = {
  rooms: "id, status, fen, pgn, current_turn, move_count, version, updated_at",
  leaderboard: "id, player_id, city, rating, coach_score, games, wins, reviews, updated_at",
};
