import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase-server.mjs";
import { PASSAGES } from "../../../lib/passages.mjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("passages")
      .select("id,title,body,difficulty,category,exam_tags,skill_tags,is_premium,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(500);

    if (!error && data?.length) {
      return NextResponse.json({
        success: true,
        source: "cms",
        passages: data.map((item) => ({
          id: item.id,
          title: item.title,
          text: item.body,
          difficulty: item.difficulty,
          category: item.category,
          examTags: item.exam_tags || [],
          skillTags: item.skill_tags || [],
          isPremium: item.is_premium !== false,
        })),
      });
    }

    if (error) console.error("PASSAGE CMS READ ERROR; USING FALLBACK:", error);
    return NextResponse.json({ success: true, source: "static-fallback", passages: PASSAGES });
  } catch (error) {
    console.error("PASSAGE API ERROR; USING FALLBACK:", error);
    return NextResponse.json({ success: true, source: "static-fallback", passages: PASSAGES });
  }
}
