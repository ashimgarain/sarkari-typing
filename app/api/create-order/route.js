import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Uses admin rights
);

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accessToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    // Server hardcodes the price to prevent tampering
    const amountPaise = 50 * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rect_${user.id.substring(0,8)}_${Date.now()}`
    });

    // Save order strictly mapping to this user
    await supabaseAdmin.from("payment_orders").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: amountPaise,
      status: "created"
    });

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: "Order Creation Failed" }, { status: 500 });
  }
}