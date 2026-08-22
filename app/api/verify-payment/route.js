import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function safeCompareHex(expected, received) {
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    /* =====================================================
       1. AUTHENTICATE USER
    ===================================================== */

    const authHeader =
      req.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
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
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or expired login session.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       2. READ RAZORPAY CALLBACK
    ===================================================== */

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Incomplete Razorpay payment response.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       3. FIND OUR OWN ORDER
    ===================================================== */

    const {
      data: paymentOrder,
      error: orderLookupError,
    } =
      await supabaseAdmin
        .from("payment_orders")
        .select(
          `
          id,
          user_id,
          razorpay_order_id,
          razorpay_payment_id,
          amount,
          status
          `
        )
        .eq(
          "razorpay_order_id",
          razorpay_order_id
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (orderLookupError) {
      console.error(
        "ORDER LOOKUP ERROR:",
        orderLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not verify the payment order.",
        },
        { status: 500 }
      );
    }

    if (!paymentOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment order was not found for this user.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       4. VERIFY RAZORPAY SIGNATURE
    ===================================================== */

    const payload =
      `${paymentOrder.razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(payload)
        .digest("hex");

    const signatureValid =
      safeCompareHex(
        expectedSignature,
        razorpay_signature
      );

    if (!signatureValid) {
      console.error(
        "INVALID RAZORPAY SIGNATURE:",
        {
          userId: user.id,
          orderId:
            razorpay_order_id,
          paymentId:
            razorpay_payment_id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Razorpay signature.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       5. VERIFY PAYMENT WITH RAZORPAY
    ===================================================== */

    let payment;

    try {
      payment =
        await razorpay.payments.fetch(
          razorpay_payment_id
        );
    } catch (error) {
      console.error(
        "RAZORPAY FETCH ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not confirm the payment with Razorpay.",
        },
        { status: 502 }
      );
    }

    if (
      payment.order_id !==
      paymentOrder.razorpay_order_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay order/payment mismatch.",
        },
        { status: 400 }
      );
    }

    if (
      Number(payment.amount) !==
      Number(paymentOrder.amount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    if (
      Number(paymentOrder.amount) !== 5000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unexpected SarkariType Premium price.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          success: false,
          error:
            `Payment is ${payment.status}, not captured yet.`,
          paymentStatus:
            payment.status,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       6. RECORD PAYMENT
    ===================================================== */

    const {
      error: paymentUpdateError,
    } =
      await supabaseAdmin
        .from("payment_orders")
        .update({
          status: "paid",
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq(
          "id",
          paymentOrder.id
        );

    if (paymentUpdateError) {
      console.error(
        "PAYMENT ORDER UPDATE ERROR:",
        paymentUpdateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment was verified but could not be recorded.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       7. CREATE/UPDATE PREMIUM PROFILE
    ===================================================== */

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "SarkariType User";

    const {
      data: premiumProfile,
      error: premiumError,
    } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email:
              user.email || null,
            full_name:
              fullName,
            is_premium:
              true,
          },
          {
            onConflict: "id",
          }
        )
        .select(
          `
          id,
          email,
          full_name,
          is_premium,
          total_xp
          `
        )
        .single();

    if (premiumError) {
      console.error(
        "PREMIUM PROFILE UPSERT ERROR:",
        premiumError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Payment was verified, but Premium activation failed.",
        },
        { status: 500 }
      );
    }

    if (
      !premiumProfile ||
      premiumProfile.is_premium !==
        true
    ) {
      console.error(
        "PREMIUM CONFIRMATION FAILED:",
        premiumProfile
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Premium activation could not be confirmed.",
        },
        { status: 500 }
      );
    }

    console.log(
      "SARKARITYPE PREMIUM ACTIVATED:",
      {
        userId:
          user.id,
        orderId:
          razorpay_order_id,
        paymentId:
          razorpay_payment_id,
      }
    );

    /* =====================================================
       8. SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      premium: true,
      profile:
        premiumProfile,
    });
  } catch (error) {
    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}