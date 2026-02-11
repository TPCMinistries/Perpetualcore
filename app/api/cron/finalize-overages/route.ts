import { NextResponse } from "next/server";
import { finalizeOverages } from "@/lib/billing/overage";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint to finalize overage billing
 *
 * Runs daily at 23:00 UTC. On the last day of the billing period,
 * creates Stripe invoice items for any usage overages so they
 * appear on the customer's next invoice.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[Cron] Starting overage finalization");

    const result = await finalizeOverages();

    logger.info("[Cron] Overage finalization complete", { result });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Error in overage finalization", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
