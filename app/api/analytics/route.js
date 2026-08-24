import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "signup",
  "login",
  "logout",
  "test_started",
  "test_completed",
  "paywall_opened",
  "checkout_started",
  "premium_activated",
  "referral_attached",
  "progress_shared",
  "daily_challenge_started",
]);

function boundedMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    const text = JSON.stringify(value);
    if (text.length <= 2500) return value;
    return { truncated: true, preview: text.slice(0, 2200) };
  } catch {
    return {};
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const eventName = String(body?.eventName || "").slice(0, 80);
    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ success: false, error: "Unsupported analytics event." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { user } = await getUserFromRequest(req, admin);

    // Do not let an unauthenticated public endpoint become a database-spam sink.
    // Guest events are intentionally ignored and never affect the product flow.
    if (!user) return NextResponse.json({ success: true, ignored: true });

    const { error } = await admin.from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
      metadata: boundedMetadata(body?.metadata),
    });

    if (error) console.error("ANALYTICS INSERT ERROR:", error);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
