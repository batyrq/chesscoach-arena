import type { City, Move } from "@/lib/types";

const profileKey = "chesscoach.profile";
const gameKeyPrefix = "chesscoach.game.";
const tabPlayerKey = "chesscoach.tabPlayerId";
const roomPlayerKeyPrefix = "chesscoach.roomPlayerId.";

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

export function getOrCreateTabPlayerId() {
  if (typeof window === "undefined") return "server-player";
  const existing = window.sessionStorage.getItem(tabPlayerKey);
  if (existing) return existing;

  const id = `player-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(tabPlayerKey, id);
  return id;
}

export function saveTabPlayerId(playerId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(tabPlayerKey, playerId);
}

export function getOrCreateRoomPlayerId(roomId: string) {
  if (typeof window === "undefined") return "server-player";
  const key = `${roomPlayerKeyPrefix}${roomId}.${getBrowserTabToken()}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const id = `player-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, id);
  return id;
}

export function saveRoomPlayerId(roomId: string, playerId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${roomPlayerKeyPrefix}${roomId}.${getBrowserTabToken()}`, playerId);
}

export function getBrowserTabToken() {
  if (!window.name.startsWith("chesscoach-tab-")) {
    window.name = `chesscoach-tab-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }

  return window.name;
}
