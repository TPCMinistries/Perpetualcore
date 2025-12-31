import { NextRequest, NextResponse } from "next/server";
import { processPendingDeliveries } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 second timeout

/**
 * Webhook Processing Cron Job
 * GET /api/cron/process-webhooks
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external scheduler)
 * to process pending webhook deliveries.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-webhooks",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (if configured)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("[Webhooks Cron] Starting webhook delivery processing...");

  try {
    const startTime = Date.now();
    const result = await processPendingDeliveries(100); // Process up to 100 deliveries

    const duration = Date.now() - startTime;

    console.log(
      `[Webhooks Cron] Completed in ${duration}ms: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Webhooks Cron] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
