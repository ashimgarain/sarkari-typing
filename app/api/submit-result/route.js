import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";
import { PASSAGES, getDailyChallenge } from "../../../lib/passages.mjs";
import { calculateStats, calculateXp, getTodayIstDateString } from "../../../lib/scoring.mjs";
import { SITE_CONFIG } from "../../../lib/site-config.mjs";

export const runtime = "nodejs";

async function findPassage(admin, passageId) {
  const { data, error } = await admin
    .from("passages")
    .select("id,title,body,difficulty,category,exam_tags,skill_tags,is_premium,is_active,sort_order")
    .eq("id", passageId)
    .eq("is_active", true)
    .maybeSingle();

  if (!error && data) {
    return {
      id: data.id,
      title: data.title,
      text: data.body,
      difficulty: data.difficulty,
      category: data.category,
      examTags: data.exam_tags || [],
      skillTags: data.skill_tags || [],
      isPremium: data.is_premium !== false,
    };
  }

  return PASSAGES.find((item) => String(item.id) === String(passageId)) || null;
}

async function unlockAchievements(admin, userId, stats, difficulty, profile) {
  const ids = ["FIRST_TEST"];
  if (stats.netWpm >= 30) ids.push("WPM_30");
  if (stats.netWpm >= 40) ids.push("WPM_40");
  if (stats.netWpm >= 50) ids.push("WPM_50");
  if (stats.accuracy >= 95) ids.push("ACC_95");
  if (stats.accuracy === 100 && stats.typedChars >= 20) ids.push("PERFECT");
  if ((profile?.current_streak || 0) >= 7) ids.push("STREAK_7");
  if ((profile?.total_tests || 0) >= 50) ids.push("TESTS_50");
  if ((profile?.total_tests || 0) >= 100) ids.push("TESTS_100");
  if (difficulty === "Hard" && stats.accuracy >= 95) ids.push("HARD_MASTER");

  const rows = [...new Set(ids)].map((achievementId) => ({
    user_id: userId,
    achievement_id: achievementId,
  }));

  if (rows.length) {
    const { error } = await admin
      .from("user_achievements")
      .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
    if (error) console.error("ACHIEVEMENT UPSERT ERROR:", error);
  }
}

export async function POST(req) {
  try {
    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const passageId = String(body?.passageId || "").slice(0, 80);
    const typedText = String(body?.typedText || "");
    const examMode = String(body?.examMode || "practice").slice(0, 40);
    const durationSeconds = Math.max(1, Math.min(3600, Math.round(Number(body?.durationSeconds) || 1)));
    const dailyChallengeRequested = body?.dailyChallenge === true;

    const passage = await findPassage(admin, passageId);
    if (!passage) {
      return NextResponse.json({ success: false, error: "Unknown typing passage." }, { status: 400 });
    }

    // Server-side access enforcement. The browser UI is never trusted for Premium gates.
    const { data: accessProfile, error: accessError } = await admin
      .from("profiles")
      .select("is_premium,free_tests_used")
      .eq("id", user.id)
      .maybeSingle();

    if (accessError || !accessProfile) {
      return NextResponse.json({ success: false, error: "Profile could not be verified." }, { status: 500 });
    }

    if (!accessProfile.is_premium) {
      if (Number(accessProfile.free_tests_used || 0) >= SITE_CONFIG.freeTrialsAllowed) {
        return NextResponse.json({ success: false, error: "Your two free saved tests are complete. Upgrade to Pro for unlimited practice." }, { status: 403 });
      }
      if (passage.isPremium !== false) {
        return NextResponse.json({ success: false, error: "This passage is a Premium feature." }, { status: 403 });
      }
      if (examMode !== "practice") {
        return NextResponse.json({ success: false, error: "Full exam presets are a Premium feature." }, { status: 403 });
      }
      if (dailyChallengeRequested) {
        return NextResponse.json({ success: false, error: "Daily Challenge rewards are a Premium feature." }, { status: 403 });
      }
    }

    const stats = calculateStats(passage.text, typedText, durationSeconds);
    if (stats.grossWpm > 250 || stats.netWpm > 250) {
      return NextResponse.json({ success: false, error: "Result was outside the accepted typing range." }, { status: 400 });
    }

    let xpEarned = calculateXp(stats, durationSeconds, passage.difficulty);
    const today = getTodayIstDateString();
    const dailyPassage = getDailyChallenge(PASSAGES, today);
    const qualifiesForDaily = dailyChallengeRequested && String(dailyPassage?.id) === String(passage.id);

    const { data: rpcData, error: rpcError } = await admin.rpc("record_typing_result", {
      p_user_id: user.id,
      p_net_wpm: stats.netWpm,
      p_gross_wpm: stats.grossWpm,
      p_accuracy: stats.accuracy,
      p_typed_chars: stats.typedChars,
      p_correct_chars: stats.correctChars,
      p_incorrect_chars: stats.incorrectChars,
      p_duration_seconds: durationSeconds,
      p_passage_id: String(passage.id),
      p_passage_title: passage.title || `Passage ${passage.id}`,
      p_difficulty: passage.difficulty || "Unknown",
      p_exam_mode: examMode,
      p_mistake_map: stats.mistakeMap,
      p_xp_earned: xpEarned,
    });

    if (rpcError) {
      console.error("RECORD RESULT RPC ERROR:", rpcError);
      return NextResponse.json({ success: false, error: "Your result could not be saved." }, { status: 500 });
    }

    let profile = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    let dailyBonusXp = 0;

    if (qualifiesForDaily) {
      const { error: challengeError } = await admin
        .from("daily_challenge_results")
        .insert({
          user_id: user.id,
          challenge_date: today,
          passage_id: String(passage.id),
          net_wpm: stats.netWpm,
          accuracy: stats.accuracy,
        });

      if (!challengeError) {
        dailyBonusXp = SITE_CONFIG.dailyChallengeBonusXp;
        const { error: bonusError } = await admin.rpc("award_profile_xp", {
          p_user_id: user.id,
          p_amount: dailyBonusXp,
        });
        if (bonusError) console.error("DAILY BONUS ERROR:", bonusError);
      } else if (challengeError.code !== "23505") {
        console.error("DAILY CHALLENGE INSERT ERROR:", challengeError);
      }
    }

    const { data: refreshedProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (refreshedProfile) profile = refreshedProfile;

    await unlockAchievements(admin, user.id, stats, passage.difficulty, profile);

    return NextResponse.json({
      success: true,
      stats,
      xpEarned,
      dailyBonusXp,
      profile: profile || null,
    });
  } catch (error) {
    console.error("SUBMIT RESULT ERROR:", error);
    return NextResponse.json({ success: false, error: "Result submission failed." }, { status: 500 });
  }
}
