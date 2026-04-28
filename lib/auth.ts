"use client";

import type { Session, User } from "@supabase/supabase-js";
import { cities } from "@/lib/demo-data";
import { loadProStatus, saveLocalProStatus } from "@/lib/pro";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { loadProfile, saveProfile } from "@/lib/storage";
import type { City } from "@/lib/types";

export type AuthView = {
  configured: boolean;
  session: Session | null;
  user: User | null;
};

export async function getAuthView(): Promise<AuthView> {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return { configured: false, session: null, user: null };
  const { data } = await supabase.auth.getSession();
  return { configured: true, session: data.session, user: data.session?.user ?? null };
}

export function onAuthChange(callback: (view: AuthView) => void) {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) {
    callback({ configured: false, session: null, user: null });
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({ configured: true, session, user: session?.user ?? null });
  });

  return () => data.subscription.unsubscribe();
}

export async function linkAuthenticatedProfile(options: {
  session: Session;
  displayName?: string;
  city?: City;
}) {
  const localProfile = loadProfile();
  const localPro = loadProStatus();
  const displayName = options.displayName?.trim() || localProfile?.name || options.session.user.email?.split("@")[0] || "Guest Gambiteer";
  const city = cities.includes(options.city as City) ? options.city as City : localProfile?.city ?? "Almaty";

  const response = await fetch("/api/auth/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.session.access_token}`,
    },
    body: JSON.stringify({
      guestId: localProfile?.playerId,
      displayName,
      city,
      proActive: localPro.isPro,
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json() as {
    ok?: boolean;
    player?: { playerId: string; displayName: string; city: City; isPro?: boolean };
  };

  if (!payload.ok || !payload.player) return null;

  saveProfile({
    playerId: payload.player.playerId,
    name: payload.player.displayName,
    city: payload.player.city,
  });

  if (payload.player.isPro || localPro.isPro) {
    saveLocalProStatus({
      isPro: true,
      status: "active",
      plan: "founder_demo",
      provider: payload.player.isPro ? "supabase" : localPro.provider,
      upgradedAt: localPro.upgradedAt ?? new Date().toISOString(),
    });
  }

  return payload.player;
}

export async function signOut() {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function friendlyAuthError(message?: string) {
  const text = (message ?? "").toLowerCase();
  if (text.includes("email address") && text.includes("invalid")) return "Use a real email address for demo signup.";
  if (text.includes("invalid login")) return "Email or password did not match.";
  if (text.includes("password")) return "Use a password with at least six characters.";
  if (text.includes("already registered") || text.includes("already exists")) return "That email already has an account. Try signing in.";
  if (text.includes("rate")) return "Signup email is rate-limited right now. Try again later or ask the project owner to turn off email confirmation for demo mode.";
  return "Auth is unavailable right now. You can continue in guest mode.";
}
