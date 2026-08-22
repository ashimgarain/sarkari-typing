import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    /* =====================================================
       1. CHECK SERVER ENVIRONMENT VARIABLES
    ===================================================== */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const razorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        "CREATE ORDER: Missing server environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured correctly.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       2. CREATE SERVER-SIDE CLIENTS
    ===================================================== */

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    /* =====================================================
       3. AUTHENTICATE USER
    ===================================================== */

    const authHeader =
      req.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authHeader.slice(7);

    const {
      data: { user },
      error: authError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (authError || !user) {
      console.error(
        "CREATE ORDER AUTH ERROR:",
        authError
      );

      return NextResponse.json(
        {
          error:
            "Invalid or expired login session.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       4. DO NOT CHARGE AN EXISTING PREMIUM USER
    ===================================================== */

    const {
      data: existingProfile,
      error: profileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "CREATE ORDER PROFILE CHECK ERROR:",
        profileError
      );
    }

    if (
      existingProfile?.is_premium === true
    ) {
      return NextResponse.json(
        {
          error:
            "Lifetime Premium is already active on this account.",
          premium: true,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       5. CREATE ₹50 RAZORPAY ORDER
    ===================================================== */

    const amountPaise = 50 * 100;

    const order =
      await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",

        receipt:
          `st_${user.id.slice(
            0,
            8
          )}_${Date.now()}`,

        notes: {
          product:
            "SarkariType Pro Lifetime",
          user_id:
            user.id,
        },
      });

    if (!order?.id) {
      console.error(
        "CREATE ORDER: Razorpay returned no order ID."
      );

      return NextResponse.json(
        {
          error:
            "Razorpay order could not be created.",
        },
        { status: 502 }
      );
    }

    /* =====================================================
       6. SAVE ORDER IN SUPABASE

       Your actual payment_orders schema:
       id
       user_id
       razorpay_order_id
       razorpay_payment_id
       razorpay_signature
       amount
       status

       We deliberately DO NOT use currency,
       created_at, paid_at or updated_at.
    ===================================================== */

    const {
      error: orderInsertError,
    } =
      await supabaseAdmin
        .from("payment_orders")
        .insert({
          user_id: user.id,
          razorpay_order_id:
            order.id,
          amount:
            amountPaise,
          status:
            "created",
        });

    if (orderInsertError) {
      console.error(
        "PAYMENT ORDER INSERT ERROR:",
        orderInsertError
      );

      return NextResponse.json(
        {
          error:
            "Payment order was created but could not be saved. Please try again.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       7. RETURN SAFE ORDER DATA TO FRONTEND
    ===================================================== */

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency:
        order.currency || "INR",
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Order creation failed.",
      },
      { status: 500 }
    );
  }
}