import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

function boundedDetails(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    const text = JSON.stringify(value);
    if (text.length <= 4000) return value;
    return { truncated: true, preview: text.slice(0, 3600) };
  } catch {
    return {};
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const context = String(body?.context || "client").slice(0, 120);
    const message = String(body?.message || "Unknown client error").slice(0, 1000);

    const admin = getSupabaseAdmin();
    const { user } = await getUserFromRequest(req, admin);
    if (!user) return NextResponse.json({ success: true, ignored: true });

    const { error } = await admin.from("app_errors").insert({
      user_id: user.id,
      context,
      message,
      details: boundedDetails(body?.details),
    });
    if (error) console.error("ERROR LOG INSERT ERROR:", error);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
