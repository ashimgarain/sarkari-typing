import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";
import { calculateReadiness, getWeakKeysFromResults, getTodayIstDateString } from "../../../lib/scoring.mjs";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "Profile could not be loaded." }, { status: 500 });
    }

    const { data: recentResults, error: resultsError } = await admin
      .from("test_results")
      .select("net_wpm,gross_wpm,accuracy,typed_chars,correct_chars,incorrect_chars,duration_seconds,passage_id,passage_title,difficulty,exam_mode,mistake_map,xp_earned,completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(30);

    if (resultsError) console.error("PROFILE RESULTS ERROR:", resultsError);

    const { data: achievementRows, error: achievementError } = await admin
      .from("user_achievements")
      .select("achievement_id,unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });

    if (achievementError) console.error("PROFILE ACHIEVEMENTS ERROR:", achievementError);

    let achievements = [];
    const achievementIds = (achievementRows || []).map((item) => item.achievement_id);
    if (achievementIds.length) {
      const { data: definitions } = await admin
        .from("achievements")
        .select("id,name,description,emoji")
        .in("id", achievementIds);
      const map = new Map((definitions || []).map((item) => [item.id, item]));
      achievements = (achievementRows || []).map((row) => ({
        ...(map.get(row.achievement_id) || { id: row.achievement_id, name: row.achievement_id, description: "", emoji: "🏆" }),
        unlocked_at: row.unlocked_at,
      }));
    }

    const { data: payments, error: paymentError } = await admin
      .from("payment_orders")
      .select("razorpay_order_id,razorpay_payment_id,amount,status,created_at,paid_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (paymentError) console.error("PROFILE PAYMENTS ERROR:", paymentError);

    const today = getTodayIstDateString();
    const { data: daily } = await admin
      .from("daily_challenge_results")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .maybeSingle();

    const results = recentResults || [];
    const readiness = calculateReadiness(results, 35, 95);
    const weakKeys = getWeakKeysFromResults(results, 6);
    const progress = results
      .slice(0, 14)
      .reverse()
      .map((item) => ({
        date: item.completed_at,
        netWpm: item.net_wpm,
        accuracy: item.accuracy,
      }));

    return NextResponse.json({
      success: true,
      profile,
      recentResults: results,
      weakKeys,
      readiness,
      progress,
      achievements,
      paymentHistory: payments || [],
      dailyChallengeCompleted: Boolean(daily),
    });
  } catch (error) {
    console.error("PROFILE API ERROR:", error);
    return NextResponse.json({ success: false, error: "Profile could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (typeof body?.shareEnabled === "boolean") {
      const { data: accessProfile, error: accessError } = await admin
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();

      if (accessError || !accessProfile) {
        return NextResponse.json({ success: false, error: "Profile could not be verified." }, { status: 500 });
      }
      if (!accessProfile.is_premium) {
        return NextResponse.json({ success: false, error: "Shareable public progress reports are a Pro feature." }, { status: 403 });
      }
    }

    const patch = {};
    if (typeof body?.shareEnabled === "boolean") patch.share_enabled = body.shareEnabled;
    if (typeof body?.fullName === "string") patch.full_name = body.fullName.trim().slice(0, 80);

    if (!Object.keys(patch).length) {
      return NextResponse.json({ success: false, error: "No supported profile change was supplied." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("PROFILE PATCH ERROR:", error);
      return NextResponse.json({ success: false, error: "Profile could not be updated." }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error("PROFILE PATCH API ERROR:", error);
    return NextResponse.json({ success: false, error: "Profile could not be updated." }, { status: 500 });
  }
}
