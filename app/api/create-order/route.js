import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";
import { SITE_CONFIG } from "../../../lib/site-config.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { error: "Payment service is not configured correctly." },
        { status: 500 }
      );
    }

    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);

    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,is_premium,referred_by,referral_discount_used")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("CREATE ORDER PROFILE ERROR:", profileError);
      return NextResponse.json(
        { error: "Your profile could not be loaded." },
        { status: 500 }
      );
    }

    if (profile.is_premium === true) {
      return NextResponse.json(
        { error: "Lifetime Premium is already active on this account.", premium: true },
        { status: 409 }
      );
    }

    const hasReferralDiscount = Boolean(profile.referred_by) && profile.referral_discount_used !== true;
    const amountINR = hasReferralDiscount
      ? SITE_CONFIG.pricing.referralINR
      : SITE_CONFIG.pricing.regularINR;
    const amountPaise = amountINR * 100;

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `st_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        source: "sarkaritype",
        product: "sarkaritype_lifetime",
        user_id: user.id,
        referral_discount: hasReferralDiscount ? "20" : "0",
      },
    });

    if (!order?.id) {
      return NextResponse.json(
        { error: "Razorpay order could not be created." },
        { status: 502 }
      );
    }

    const { error: insertError } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amountPaise,
        status: "created",
      });

    if (insertError) {
      console.error("PAYMENT ORDER INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: "Payment order was created but could not be saved. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      amountINR,
      discountPercent: hasReferralDiscount ? SITE_CONFIG.pricing.referralDiscountPercent : 0,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Order creation failed." },
      { status: 500 }
    );
  }
}
