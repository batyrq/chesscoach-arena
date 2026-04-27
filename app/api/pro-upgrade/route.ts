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
    const { data: player, error: playerError } = await supabase
      .from("players")
      .upsert({
        guest_id: guestId,
        display_name: displayName,
        city,
        pro_status: "pro_demo",
        updated_at: new Date().toISOString(),
      }, { onConflict: "guest_id" })
      .select("id")
      .single();

    if (playerError) throw playerError;

    await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("player_id", player.id)
      .eq("provider", "demo")
      .neq("status", "canceled");

    const { error: subscriptionError } = await supabase.from("subscriptions").insert({
      player_id: player.id,
      provider: "demo",
      status: "active",
      plan,
      started_at: new Date().toISOString(),
    });

    if (subscriptionError) throw subscriptionError;

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
