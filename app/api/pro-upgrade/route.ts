import { NextResponse } from "next/server";
import { getServerSupabaseAdminClient } from "@/lib/supabase/server";
import { cities } from "@/lib/demo-data";
import type { City } from "@/lib/types";

type ProUpgradeBody = {
  guestId?: string;
  displayName?: string;
  city?: City;
  plan?: string;
};

export async function POST(request: Request) {
  const body = await safeJson(request);
  const guestId = normalizeText(body.guestId);
  const displayName = normalizeText(body.displayName) || "Guest Gambiteer";
  const city = cities.includes(body.city as City) ? body.city as City : "Almaty";
  const plan = normalizeText(body.plan) || "founder_demo";

  if (!guestId) {
    return NextResponse.json({ ok: false, provider: "local", error: "missing_guest_id" }, { status: 400 });
  }

  const supabase = getServerSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, provider: "local", status: "active", plan });
  }

  try {
    const token = getBearerToken(request);
    const authUser = token ? (await supabase.auth.getUser(token)).data.user : null;
    const lookup = authUser
      ? await supabase.from("players").select("id,guest_id").eq("auth_user_id", authUser.id).maybeSingle()
      : { data: null, error: null };

    if (lookup.error) throw lookup.error;

    if (lookup.data) {
      const { data: player, error: updateError } = await supabase
        .from("players")
        .update({
          display_name: displayName,
          city,
          guest_id: lookup.data.guest_id ?? guestId,
          pro_status: "pro_demo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lookup.data.id)
        .select("id")
        .single();

      if (updateError) throw updateError;
      await saveSubscription(supabase, player.id, plan);
      return NextResponse.json({ ok: true, provider: "supabase", status: "active", plan });
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .upsert({
        guest_id: guestId,
        auth_user_id: authUser?.id ?? null,
        display_name: displayName,
        city,
        pro_status: "pro_demo",
        updated_at: new Date().toISOString(),
      }, { onConflict: "guest_id" })
      .select("id")
      .single();

    if (playerError) throw playerError;

    await saveSubscription(supabase, player.id, plan);

    return NextResponse.json({ ok: true, provider: "supabase", status: "active", plan });
  } catch {
    return NextResponse.json({ ok: true, provider: "local", status: "active", plan });
  }
}

export function GET() {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}

async function safeJson(request: Request): Promise<ProUpgradeBody> {
  try {
    return await request.json() as ProUpgradeBody;
  } catch {
    return {};
  }
}

function normalizeText(value?: string) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function saveSubscription(supabase: NonNullable<ReturnType<typeof getServerSupabaseAdminClient>>, playerId: string, plan: string) {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("player_id", playerId)
    .eq("provider", "demo")
    .neq("status", "canceled");

  const { error } = await supabase.from("subscriptions").insert({
    player_id: playerId,
    provider: "demo",
    status: "active",
    plan,
    started_at: new Date().toISOString(),
  });

  if (error) throw error;
}
