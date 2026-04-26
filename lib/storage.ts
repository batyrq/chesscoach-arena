import type { City, Move } from "@/lib/types";

const profileKey = "chesscoach.profile";
const gameKeyPrefix = "chesscoach.game.";

export type ArenaProfile = {
  name: string;
  city: City;
};

export function saveProfile(profile: ArenaProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function loadProfile(): ArenaProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(profileKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ArenaProfile;
  } catch {
    return null;
  }
}

export function saveGameReview(gameId: string, payload: { pgn: string; fen: string; moves: Move[] }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${gameKeyPrefix}${gameId}`, JSON.stringify(payload));
}

export function loadGameReview(gameId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${gameKeyPrefix}${gameId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { pgn: string; fen: string; moves: Move[] };
  } catch {
    return null;
  }
}
