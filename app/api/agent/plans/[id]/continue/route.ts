/**
 * Plan Continue Endpoint (Self-Chaining)
 *
 * POST - Execute the next step of a running plan.
 * Called by the orchestrator after each step completes (fire-and-forget).
 * Also called by the cron sweeper for orphaned plans.
 *
 * Auth: CRON_SECRET bearer token (background execution, no user session).
 */

import { NextRequest, NextResponse } from "next/server";
import { orchestratePlan } from "@/lib/agents/executor";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth: CRON_SECRET for background execution
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;

    const plan = await orchestratePlan(planId);

    return NextResponse.json({
      planId: plan.id,
      status: plan.status,
      currentStep: plan.current_step_index,
      totalSteps: plan.steps.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to continue plan";
    console.error(`[Continue] Plan execution error:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
