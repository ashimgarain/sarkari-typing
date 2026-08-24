import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase-server.mjs";
import { calculateReadiness } from "../../../../lib/scoring.mjs";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  try {
    const { slug } = await params;
    const safeSlug = String(slug || "").slice(0, 120);
    if (!safeSlug) {
      return NextResponse.json({ success: false, error: "Profile link is invalid." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,full_name,is_premium,total_xp,referral_code,public_slug,share_enabled,total_tests,total_practice_seconds,best_net_wpm,best_gross_wpm,best_accuracy,current_streak,longest_streak")
      .eq("public_slug", safeSlug)
      .eq("share_enabled", true)
      .eq("is_premium", true)
      .maybeSingle();

    if (profileError) {
      console.error("PUBLIC PROFILE QUERY ERROR:", profileError);
      return NextResponse.json({ success: false, error: "Progress report could not be loaded." }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ success: false, error: "This progress report is private or unavailable." }, { status: 404 });
    }

    const { data: recentResults } = await admin
      .from("test_results")
      .select("net_wpm,gross_wpm,accuracy,duration_seconds,passage_title,difficulty,exam_mode,completed_at,xp_earned")
      .eq("user_id", profile.id)
      .order("completed_at", { ascending: false })
      .limit(14);

    const readiness = calculateReadiness(recentResults || [], 35, 95);

    return NextResponse.json({
      success: true,
      profile: {
        fullName: profile.full_name || "SarkariType Learner",
        premium: profile.is_premium === true,
        totalXp: profile.total_xp || 0,
        referralCode: profile.referral_code,
        publicSlug: profile.public_slug,
        totalTests: profile.total_tests || 0,
        totalPracticeSeconds: profile.total_practice_seconds || 0,
        bestNetWpm: profile.best_net_wpm || 0,
        bestGrossWpm: profile.best_gross_wpm || 0,
        bestAccuracy: profile.best_accuracy || 0,
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        readiness,
      },
      recentResults: recentResults || [],
    });
  } catch (error) {
    console.error("PUBLIC PROFILE API ERROR:", error);
    return NextResponse.json({ success: false, error: "Progress report could not be loaded." }, { status: 500 });
  }
}
