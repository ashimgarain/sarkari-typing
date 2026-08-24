import { NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "../../../../lib/supabase-server.mjs";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const admin = getSupabaseAdmin();
    const gate = await requireAdmin(req, admin);
    if (gate.error) {
      return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
    }

    const [usersRes, premiumRes, testsRes, paidRes, errorsRes, eventsRes] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      admin.from("test_results").select("*", { count: "exact", head: true }),
      admin.from("payment_orders").select("amount").eq("status", "paid"),
      admin.from("app_errors").select("context,message,created_at").order("created_at", { ascending: false }).limit(12),
      admin.from("analytics_events").select("event_name,created_at").order("created_at", { ascending: false }).limit(20),
    ]);

    const revenuePaise = (paidRes.data || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      summary: {
        users: usersRes.count || 0,
        premiumUsers: premiumRes.count || 0,
        totalTests: testsRes.count || 0,
        paidOrders: (paidRes.data || []).length,
        revenueINR: Math.round(revenuePaise / 100),
      },
      recentErrors: errorsRes.data || [],
      recentEvents: eventsRes.data || [],
    });
  } catch (error) {
    console.error("ADMIN SUMMARY ERROR:", error);
    return NextResponse.json({ success: false, error: "Admin summary could not be loaded." }, { status: 500 });
  }
}
