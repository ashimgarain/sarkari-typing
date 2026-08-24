import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .select("full_name,total_xp,best_net_wpm,current_streak,public_slug,share_enabled,is_premium,total_tests")
      .gt("total_tests", 0)
      .order("total_xp", { ascending: false })
      .order("best_net_wpm", { ascending: false })
      .limit(25);

    if (error) {
      console.error("LEADERBOARD QUERY ERROR:", error);
      return NextResponse.json({ success: false, error: "Leaderboard could not be loaded." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leaderboard: (data || []).map((row, index) => ({
        rank: index + 1,
        name: row.full_name || "SarkariType Learner",
        totalXp: row.total_xp || 0,
        bestNetWpm: row.best_net_wpm || 0,
        streak: row.current_streak || 0,
        publicSlug: row.share_enabled ? row.public_slug : null,
        premium: row.is_premium === true,
        totalTests: row.total_tests || 0,
      })),
    });
  } catch (error) {
    console.error("LEADERBOARD API ERROR:", error);
    return NextResponse.json({ success: false, error: "Leaderboard could not be loaded." }, { status: 500 });
  }
}
