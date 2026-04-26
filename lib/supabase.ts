import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export const supabaseSchemaNotes = {
  rooms: "id, room_code, fen, pgn, white_player, black_player, city, status, updated_at",
  leaderboard: "id, display_name, city, rating, wins, reviews, streak, is_pro"
};
