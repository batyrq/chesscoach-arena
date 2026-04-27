"use client";

import type { City, PlayerProfile } from "@/lib/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOrCreateLocalPlayerId, loadProfile, saveProfile } from "@/lib/storage";

const proStatusKey = "chesscoach.proStatus";

export type ProStatus = {
  isPro: boolean;
  status: "free" | "active";
  plan: "free" | "founder_demo";
  provider: "local" | "supabase";
  upgradedAt?: string;
};

export type ProUpgradeInput = {
  name?: string;
  city?: City;
};

export function loadProStatus(): ProStatus {
  if (typeof window === "undefined") {
    return { isPro: false, status: "free", plan: "free", provider: "local" };
  }

  const raw = window.localStorage.getItem(proStatusKey);
  if (!raw) return { isPro: false, status: "free", plan: "free", provider: "local" };

  try {
    const parsed = JSON.parse(raw) as Partial<ProStatus>;
    if (!parsed.isPro) return { isPro: false, status: "free", plan: "free", provider: "local" };
    return {
      isPro: true,
      status: "active",
      plan: "founder_demo",
      provider: parsed.provider === "supabase" ? "supabase" : "local",
      upgradedAt: parsed.upgradedAt,
    };
  } catch {
    return { isPro: false, status: "free", plan: "free", provider: "local" };
  }
}

export function saveLocalProStatus(status: ProStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(proStatusKey, JSON.stringify(status));
}

export async function activateDemoPro(input: ProUpgradeInput = {}) {
  const profile = ensureProfile(input);
  const upgradedAt = new Date().toISOString();
  const localStatus: ProStatus = {
    isPro: true,
    status: "active",
    plan: "founder_demo",
    provider: "local",
    upgradedAt,
  };

  saveLocalProStatus(localStatus);

  try {
    const supabase = getBrowserSupabaseClient();
    const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const response = await fetch("/api/pro-upgrade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
      },
      body: JSON.stringify({
        guestId: profile.playerId,
        displayName: profile.name,
        city: profile.city,
        plan: "founder_demo",
      }),
    });

    if (!response.ok) return localStatus;
    const payload = await response.json() as { ok?: boolean; provider?: "supabase" | "local" };
    if (!payload.ok || payload.provider !== "supabase") return localStatus;

    const supabaseStatus: ProStatus = { ...localStatus, provider: "supabase" };
    saveLocalProStatus(supabaseStatus);
    window.dispatchEvent(new CustomEvent("chesscoach:pro-updated", { detail: supabaseStatus }));
    return supabaseStatus;
  } catch {
    window.dispatchEvent(new CustomEvent("chesscoach:pro-updated", { detail: localStatus }));
    return localStatus;
  }
}

export function isProStatus(status?: string | null) {
  return status === "pro" || status === "pro_demo" || status === "active";
}

export function mergeProStatus<T extends PlayerProfile>(player: T): T {
  return { ...player, isPro: player.isPro || loadProStatus().isPro };
}

function ensureProfile(input: ProUpgradeInput) {
  const existing = loadProfile();
  if (existing) return existing;

  const profile = {
    playerId: getOrCreateLocalPlayerId(),
    name: input.name?.trim() || "Guest Gambiteer",
    city: input.city ?? "Almaty" as City,
  };
  saveProfile(profile);
  return profile;
}
