import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accessToken = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 1. Mark Order Paid
    await supabaseAdmin.from("payment_orders").update({
      status: "paid",
      razorpay_payment_id,
      razorpay_signature
    }).eq("razorpay_order_id", razorpay_order_id);

    // 2. Grant Lifetime Premium
    await supabaseAdmin.from("profiles").update({ is_premium: true }).eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Verification Failed" }, { status: 500 });
  }
}