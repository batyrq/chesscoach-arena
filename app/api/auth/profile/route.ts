import { NextResponse } from "next/server";
import { cities } from "@/lib/demo-data";
import { getServerSupabaseAdminClient } from "@/lib/supabase/server";
import type { City } from "@/lib/types";

type AuthProfileBody = {
  guestId?: string;
  displayName?: string;
  city?: City;
  proActive?: boolean;
};

export async function POST(request: Request) {
  const supabase = getServerSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, mode: "guest", error: "supabase_unavailable" }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_session" }, { status: 401 });
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResult.user) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const body = await safeJson(request);
  const guestId = normalizeText(body.guestId);
  const displayName = normalizeText(body.displayName) || userResult.user.email?.split("@")[0] || "Guest Gambiteer";
  const city = cities.includes(body.city as City) ? body.city as City : "Almaty";
  const now = new Date().toISOString();

  try {
    const { data: existingByAuth, error: authLookupError } = await supabase
      .from("players")
      .select("id,guest_id,pro_status")
      .eq("auth_user_id", userResult.user.id)
      .maybeSingle();

    if (authLookupError) throw authLookupError;

    const proStatus = body.proActive ? "pro_demo" : undefined;

    if (existingByAuth) {
      const { data, error } = await supabase
        .from("players")
        .update({
          display_name: displayName,
          city,
          guest_id: existingByAuth.guest_id ?? (guestId || null),
          pro_status: proStatus ?? existingByAuth.pro_status ?? "free",
          updated_at: now,
        })
        .eq("id", existingByAuth.id)
        .select("id,display_name,city,pro_status")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, player: toResponsePlayer(data) });
    }

    const { data: upserted, error: upsertError } = await supabase
      .from("players")
      .upsert({
        guest_id: guestId || userResult.user.id,
        auth_user_id: userResult.user.id,
        display_name: displayName,
        city,
        pro_status: proStatus ?? "free",
        updated_at: now,
      }, { onConflict: "guest_id" })
      .select("id,display_name,city,pro_status")
      .single();

    if (upsertError) throw upsertError;

    if (body.proActive) {
      await supabase.from("subscriptions").insert({
        player_id: upserted.id,
        provider: "demo",
        status: "active",
        plan: "founder_demo",
        started_at: now,
      });
    }

    return NextResponse.json({ ok: true, player: toResponsePlayer(upserted) });
  } catch {
    return NextResponse.json({ ok: false, mode: "guest", error: "profile_link_failed" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function safeJson(request: Request): Promise<AuthProfileBody> {
  try {
    return await request.json() as AuthProfileBody;
  } catch {
    return {};
  }
}

function normalizeText(value?: string) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

function toResponsePlayer(row: { id: string; display_name: string; city: City; pro_status: string | null }) {
  return {
    playerId: row.id,
    displayName: row.display_name,
    city: row.city,
    isPro: row.pro_status === "pro_demo" || row.pro_status === "pro" || row.pro_status === "active",
  };
}
