/**
 * Plan Sweeper Cron
 *
 * Runs every 5 minutes. Finds orphaned plans (stuck in 'running' status
 * for more than 10 minutes) and marks them as failed.
 * This catches plans where the self-chaining POST failed silently.
 */

import { NextRequest, NextResponse } from "next/server";
import { findOrphanedPlans, updatePlanStatus } from "@/lib/agents/executor/state-manager";
import { reportPlanFailure } from "@/lib/agents/executor/reporter";
import { getPlan } from "@/lib/agents/executor/state-manager";

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orphanedPlans = await findOrphanedPlans();

    if (orphanedPlans.length === 0) {
      return NextResponse.json({ swept: 0 });
    }

    let swept = 0;
    for (const plan of orphanedPlans) {
      try {
        await updatePlanStatus(
          plan.id,
          "failed",
          "Plan orphaned: no progress for 10+ minutes"
        );
        const failedPlan = await getPlan(plan.id);
        if (failedPlan) await reportPlanFailure(failedPlan);
        swept++;
      } catch (error) {
        console.error(`[Sweeper] Failed to sweep plan ${plan.id}:`, error);
      }
    }

    console.log(`[Sweeper] Swept ${swept} orphaned plans`);
    return NextResponse.json({ swept, total: orphanedPlans.length });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Sweep failed";
    console.error("[Sweeper] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
