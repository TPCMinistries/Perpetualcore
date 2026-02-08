/**
 * Heartbeat Cron Endpoint
 *
 * POST /api/cron/heartbeat
 *
 * Called by Vercel Cron (or external scheduler) to run heartbeat checks
 * for all users who have heartbeat enabled.
 *
 * Auth: CRON_SECRET bearer token
 * Max: 20 users per cron run to stay within execution limits
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runHeartbeat } from "@/lib/agents/heartbeat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Maximum number of users to process per cron run */
const MAX_USERS_PER_RUN = 20;

/**
 * POST: Run heartbeat checks for users with heartbeat enabled.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createAdminClient();

  try {
    // Find users with heartbeat enabled
    // Users opt in via notification_preferences.heartbeat_enabled = true
    const { data: profiles, error: queryError } = await supabase
      .from("profiles")
      .select("id, full_name, notification_preferences")
      .not("notification_preferences", "is", null)
      .limit(MAX_USERS_PER_RUN);

    if (queryError) {
      console.error("[HeartbeatCron] Error querying profiles:", queryError);
      return NextResponse.json(
        { error: "Failed to query users", details: queryError.message },
        { status: 500 }
      );
    }

    // Filter to users who have heartbeat enabled in their preferences
    const eligibleUsers = (profiles || []).filter((p) => {
      const prefs = p.notification_preferences;
      return prefs && (prefs.heartbeat_enabled === true || prefs.proactive_nudges_enabled === true);
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: "No users with heartbeat enabled",
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(
      `[HeartbeatCron] Processing ${eligibleUsers.length} user(s)`
    );

    // Run heartbeat for each eligible user
    const results: Array<{
      userId: string;
      userName: string;
      status: string;
      insightCount: number;
      totalItems: number;
      error?: string;
    }> = [];

    for (const profile of eligibleUsers) {
      try {
        const result = await runHeartbeat(profile.id);

        results.push({
          userId: profile.id,
          userName: profile.full_name || "Unknown",
          status: result.status,
          insightCount: result.insights.length,
          totalItems: result.checkResults.reduce(
            (sum, r) => sum + r.items.length,
            0
          ),
        });

        console.log(
          `[HeartbeatCron] Completed for ${profile.full_name || profile.id}: ${result.status}`
        );
      } catch (error: any) {
        console.error(
          `[HeartbeatCron] Error for user ${profile.id}:`,
          error
        );
        results.push({
          userId: profile.id,
          userName: profile.full_name || "Unknown",
          status: "failed",
          insightCount: 0,
          totalItems: 0,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === "completed").length;
    const failCount = results.filter((r) => r.status === "failed").length;

    console.log(
      `[HeartbeatCron] Completed: ${successCount} success, ${failCount} failed, ${duration}ms`
    );

    return NextResponse.json({
      message: "Heartbeat cron completed",
      processed: results.length,
      success: successCount,
      failed: failCount,
      duration,
      results,
    });
  } catch (error: any) {
    console.error("[HeartbeatCron] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Heartbeat cron failed",
        message: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
