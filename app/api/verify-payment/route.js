import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

function safeCompareHex(expected, received) {
  try {
    const a = Buffer.from(String(expected || ""), "hex");
    const b = Buffer.from(String(received || ""), "hex");
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!secret || !keyId) {
      return NextResponse.json(
        { success: false, error: "Payment service is not configured correctly." },
        { status: 500 }
      );
    }

    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const razorpayOrderId = String(body?.razorpay_order_id || "");
    const razorpayPaymentId = String(body?.razorpay_payment_id || "");
    const razorpaySignature = String(body?.razorpay_signature || "");

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Incomplete Razorpay payment response." },
        { status: 400 }
      );
    }

    const { data: paymentOrder, error: orderError } = await admin
      .from("payment_orders")
      .select("id,user_id,razorpay_order_id,razorpay_payment_id,amount,status")
      .eq("razorpay_order_id", razorpayOrderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !paymentOrder) {
      console.error("ORDER LOOKUP ERROR:", orderError);
      return NextResponse.json(
        { success: false, error: "Payment order was not found for this account." },
        { status: 404 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${paymentOrder.razorpay_order_id}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeCompareHex(expectedSignature, razorpaySignature)) {
      return NextResponse.json(
        { success: false, error: "Invalid Razorpay signature." },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.order_id !== paymentOrder.razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Razorpay order/payment mismatch." },
        { status: 400 }
      );
    }

    if (Number(payment.amount) !== Number(paymentOrder.amount)) {
      return NextResponse.json(
        { success: false, error: "Payment amount mismatch." },
        { status: 400 }
      );
    }

    if (![4000, 5000].includes(Number(paymentOrder.amount))) {
      return NextResponse.json(
        { success: false, error: "Unexpected SarkariType Premium amount." },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment is ${payment.status}, not captured yet.`,
          paymentStatus: payment.status,
        },
        { status: 409 }
      );
    }

    const { error: paymentUpdateError } = await admin
      .from("payment_orders")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentOrder.id);

    if (paymentUpdateError) {
      console.error("PAYMENT ORDER UPDATE ERROR:", paymentUpdateError);
      return NextResponse.json(
        { success: false, error: "Payment was verified but could not be recorded." },
        { status: 500 }
      );
    }

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "SarkariType User";

    const { data: premiumProfile, error: premiumError } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          full_name: fullName,
          is_premium: true,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (premiumError || premiumProfile?.is_premium !== true) {
      console.error("PREMIUM PROFILE UPSERT ERROR:", premiumError);
      return NextResponse.json(
        { success: false, error: "Payment was verified, but Premium activation failed." },
        { status: 500 }
      );
    }

    let referralRewarded = false;
    if (Number(paymentOrder.amount) === 4000) {
      const { data: rewardedReferrer, error: rewardError } = await admin.rpc(
        "reward_referrer_for_purchase",
        { p_buyer_id: user.id }
      );
      if (rewardError) {
        console.error("REFERRAL REWARD ERROR:", rewardError);
      } else {
        referralRewarded = Boolean(rewardedReferrer);
      }
    }

    return NextResponse.json({
      success: true,
      premium: true,
      referralRewarded,
      profile: premiumProfile,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
