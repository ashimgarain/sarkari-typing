import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSupabaseAdmin, getUserFromRequest } from "../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) {
      return NextResponse.json({ success: false, error: "Payment service is not configured." }, { status: 500 });
    }

    const admin = getSupabaseAdmin();
    const { user, error: authError } = await getUserFromRequest(req, admin);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id,is_premium")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_premium === true) {
      // Heal a referral reward if Premium was activated but the reward RPC
      // was interrupted after a captured discounted payment.
      const { data: discountedPaid } = await admin
        .from("payment_orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .eq("amount", 4000)
        .limit(1);

      if (discountedPaid?.length) {
        const { error: rewardError } = await admin.rpc("reward_referrer_for_purchase", {
          p_buyer_id: user.id,
        });
        if (rewardError) console.error("RESTORE EXISTING PREMIUM REFERRAL REWARD ERROR:", rewardError);
      }

      return NextResponse.json({ success: true, premium: true, alreadyActive: true });
    }

    const { data: orders, error: ordersError } = await admin
      .from("payment_orders")
      .select("id,razorpay_order_id,razorpay_payment_id,amount,status,created_at")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .not("razorpay_payment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error("RESTORE ORDER QUERY ERROR:", ordersError);
      return NextResponse.json({ success: false, error: "Purchase history could not be checked." }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });

    for (const order of orders || []) {
      try {
        const payment = await razorpay.payments.fetch(order.razorpay_payment_id);
        const valid =
          payment?.status === "captured" &&
          payment?.order_id === order.razorpay_order_id &&
          Number(payment?.amount) === Number(order.amount) &&
          [4000, 5000].includes(Number(order.amount));

        if (!valid) continue;

        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "SarkariType User";

        const { data: restored, error: restoreError } = await admin
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

        if (restoreError || restored?.is_premium !== true) {
          console.error("RESTORE PROFILE ERROR:", restoreError);
          continue;
        }

        if (Number(order.amount) === 4000) {
          const { error: rewardError } = await admin.rpc("reward_referrer_for_purchase", {
            p_buyer_id: user.id,
          });
          if (rewardError) console.error("RESTORE REFERRAL REWARD ERROR:", rewardError);
        }

        return NextResponse.json({ success: true, premium: true, restored: true, profile: restored });
      } catch (paymentError) {
        console.error("RESTORE PAYMENT FETCH ERROR:", paymentError);
      }
    }

    return NextResponse.json(
      { success: false, premium: false, error: "No captured SarkariType Premium purchase was found for this account." },
      { status: 404 }
    );
  } catch (error) {
    console.error("RESTORE PURCHASE ERROR:", error);
    return NextResponse.json({ success: false, error: "Purchase restore failed." }, { status: 500 });
  }
}
