import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "../../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body?.code || "").trim().toUpperCase().slice(0, 40);
    if (!code) {
      return NextResponse.json({ success: false, error: "Referral code is missing." }, { status: 400 });
    }

    const { data: buyer, error: buyerError } = await admin
      .from("profiles")
      .select("id,is_premium,referred_by,referral_discount_used")
      .eq("id", user.id)
      .maybeSingle();

    if (buyerError || !buyer) {
      return NextResponse.json({ success: false, error: "Your profile could not be loaded." }, { status: 500 });
    }

    if (buyer.is_premium) {
      return NextResponse.json({ success: true, attached: false, reason: "already_premium", discountPercent: 0 });
    }

    if (buyer.referred_by) {
      return NextResponse.json({
        success: true,
        attached: true,
        alreadyAttached: true,
        discountPercent: buyer.referral_discount_used ? 0 : 20,
      });
    }

    const { data: referrer, error: referrerError } = await admin
      .from("profiles")
      .select("id,full_name,referral_code")
      .eq("referral_code", code)
      .maybeSingle();

    if (referrerError || !referrer) {
      return NextResponse.json({ success: false, error: "Referral code is invalid." }, { status: 404 });
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ success: false, error: "You cannot refer yourself." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", user.id)
      .is("referred_by", null)
      .eq("is_premium", false)
      .select("id,referred_by,referral_discount_used")
      .maybeSingle();

    if (updateError) {
      console.error("REFERRAL ATTACH ERROR:", updateError);
      return NextResponse.json({ success: false, error: "Referral could not be attached." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attached: Boolean(updated?.referred_by),
      referrerName: referrer.full_name || "a SarkariType learner",
      discountPercent: updated?.referred_by ? 20 : 0,
    });
  } catch (error) {
    console.error("REFERRAL ATTACH API ERROR:", error);
    return NextResponse.json({ success: false, error: "Referral could not be attached." }, { status: 500 });
  }
}
