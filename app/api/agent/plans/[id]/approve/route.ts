/**
 * Plan Approval Endpoint
 *
 * POST - Approve or reject a paused plan step.
 * Auth: User session (cookie-based) — the plan owner must approve.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resumePlanAfterApproval,
  rejectPlanStep,
} from "@/lib/agents/executor";
import { getPlan } from "@/lib/agents/executor/state-manager";
import { validateApprovalAction } from "@/lib/agents/executor/approval-gate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required (approve/reject)" },
        { status: 400 }
      );
    }

    // Validate the action
    const validation = validateApprovalAction(action);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    // Verify the plan belongs to this user
    const plan = await getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (plan.status !== "paused") {
      return NextResponse.json(
        { error: `Plan is not paused (current status: ${plan.status})` },
        { status: 409 }
      );
    }

    if (validation.action === "approve") {
      await resumePlanAfterApproval(planId);
      return NextResponse.json({
        message: "Step approved. Plan resuming.",
        planId,
        status: "running",
      });
    } else {
      await rejectPlanStep(planId);
      return NextResponse.json({
        message: "Step rejected. Plan cancelled.",
        planId,
        status: "cancelled",
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process approval";
    console.error(`[Approve] Error:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
