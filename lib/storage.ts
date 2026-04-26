import type { City, Game, Move } from "@/lib/types";

const profileKey = "chesscoach.profile";
const gameKeyPrefix = "chesscoach.game.";
const tabPlayerKey = "chesscoach.tabPlayerId";
const roomPlayerKeyPrefix = "chesscoach.roomPlayerId.";
const localPlayerKey = "chesscoach.localPlayerId";

export type ArenaProfile = {
  playerId: string;
  name: string;
  city: City;
};

export type StoredGameReview = {
  pgn: string;
  fen: string;
  moves: Move[];
  result?: Game["result"];
  roomId?: string;
};

export function saveProfile(profile: Omit<ArenaProfile, "playerId"> & { playerId?: string }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileKey, JSON.stringify({ ...profile, playerId: profile.playerId ?? getOrCreateLocalPlayerId() }));
}

export function loadProfile(): ArenaProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(profileKey);
  if (!raw) return null;

  try {
    const profile = JSON.parse(raw) as Partial<ArenaProfile>;
    if (!profile.name || !profile.city) return null;
    const hydrated = { playerId: profile.playerId ?? getOrCreateLocalPlayerId(), name: profile.name, city: profile.city };
    if (!profile.playerId) saveProfile(hydrated);
    return hydrated;
  } catch {
    return null;
  }
}

export function saveGameReview(gameId: string, payload: StoredGameReview) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${gameKeyPrefix}${gameId}`, JSON.stringify(payload));
}

export function loadGameReview(gameId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${gameKeyPrefix}${gameId}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredGameReview;
  } catch {
    return null;
  }
}

export function getOrCreateLocalPlayerId() {
  if (typeof window === "undefined") return "server-local-player";
  const existing = window.localStorage.getItem(localPlayerKey);
  if (existing) return existing;

  const id = `local-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(localPlayerKey, id);
  return id;
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
