import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/refresh-funnel
 *
 * Refreshes the funnel_daily_summary materialized view.
 * Runs every hour via Vercel cron.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.rpc("refresh_funnel_summary");

    if (error) {
      console.error("[Cron] Failed to refresh funnel summary:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      refreshed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
