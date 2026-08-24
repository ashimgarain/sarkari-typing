import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "../../../../lib/supabase-server.mjs";
import { PASSAGES } from "../../../../lib/passages.mjs";

export const runtime = "nodejs";

function toDb(item, sortOrder = 0) {
  return {
    id: String(item.id),
    title: String(item.title || "Untitled").slice(0, 160),
    body: String(item.text || item.body || ""),
    difficulty: ["Easy", "Moderate", "Hard"].includes(item.difficulty) ? item.difficulty : "Easy",
    category: String(item.category || "General").slice(0, 80),
    exam_tags: Array.isArray(item.examTags) ? item.examTags.map(String).slice(0, 12) : [],
    skill_tags: Array.isArray(item.skillTags) ? item.skillTags.map(String).slice(0, 12) : [],
    is_premium: item.isPremium !== false,
    is_active: item.isActive !== false,
    sort_order: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(req) {
  try {
    const admin = getSupabaseAdmin();
    const gate = await requireAdmin(req, admin);
    if (gate.error) return NextResponse.json({ success: false, error: gate.error }, { status: 403 });

    const { data, error } = await admin
      .from("passages")
      .select("*")
      .order("sort_order", { ascending: true })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ success: true, passages: data || [] });
  } catch (error) {
    console.error("ADMIN PASSAGES GET ERROR:", error);
    return NextResponse.json({ success: false, error: "Passages could not be loaded." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const admin = getSupabaseAdmin();
    const gate = await requireAdmin(req, admin);
    if (gate.error) return NextResponse.json({ success: false, error: gate.error }, { status: 403 });

    const body = await req.json();

    if (body?.action === "seed") {
      const rows = PASSAGES.map((item, index) => toDb(item, index + 1));
      const { error } = await admin.from("passages").upsert(rows, { onConflict: "id" });
      if (error) throw error;
      return NextResponse.json({ success: true, seeded: rows.length, count: rows.length });
    }

    const item = toDb(body?.passage || body, 9999);
    if (!item.id || !item.body) {
      return NextResponse.json({ success: false, error: "Passage ID and text are required." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("passages")
      .upsert(item, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, passage: data });
  } catch (error) {
    console.error("ADMIN PASSAGES POST ERROR:", error);
    return NextResponse.json({ success: false, error: "Passage could not be saved." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = getSupabaseAdmin();
    const gate = await requireAdmin(req, admin);
    if (gate.error) return NextResponse.json({ success: false, error: gate.error }, { status: 403 });

    const body = await req.json();
    const id = String(body?.id || "").slice(0, 80);
    if (!id) return NextResponse.json({ success: false, error: "Passage ID is required." }, { status: 400 });

    const patch = { updated_at: new Date().toISOString() };
    if (typeof body?.title === "string") patch.title = body.title.slice(0, 160);
    if (typeof body?.text === "string") patch.body = body.text;
    else if (typeof body?.body === "string") patch.body = body.body;
    if (["Easy", "Moderate", "Hard"].includes(body?.difficulty)) patch.difficulty = body.difficulty;
    if (typeof body?.category === "string") patch.category = body.category.slice(0, 80);
    if (Array.isArray(body?.examTags)) patch.exam_tags = body.examTags.map(String).slice(0, 12);
    if (Array.isArray(body?.skillTags)) patch.skill_tags = body.skillTags.map(String).slice(0, 12);
    if (typeof body?.isPremium === "boolean") patch.is_premium = body.isPremium;
    else if (typeof body?.is_premium === "boolean") patch.is_premium = body.is_premium;
    if (typeof body?.isActive === "boolean") patch.is_active = body.isActive;
    else if (typeof body?.is_active === "boolean") patch.is_active = body.is_active;
    if (Number.isFinite(Number(body?.sortOrder))) patch.sort_order = Number(body.sortOrder);
    else if (Number.isFinite(Number(body?.sort_order))) patch.sort_order = Number(body.sort_order);

    const { data, error } = await admin
      .from("passages")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, passage: data });
  } catch (error) {
    console.error("ADMIN PASSAGES PATCH ERROR:", error);
    return NextResponse.json({ success: false, error: "Passage could not be updated." }, { status: 500 });
  }
}
