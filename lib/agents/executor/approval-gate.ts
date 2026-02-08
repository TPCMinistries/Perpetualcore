/**
 * Approval Gate
 *
 * Determines whether a plan step requires user approval before execution.
 * Pauses plans at sensitive steps and provides approval/rejection handling.
 */

import { PlanStep, SENSITIVE_TOOLS } from "./types";
import { trackActivity } from "@/lib/activity-feed/tracker";

/**
 * Check if a step requires user approval.
 * Returns true if the step's tool is in the sensitive tools set
 * or if the step was explicitly marked as requires_approval.
 */
export function needsApproval(step: PlanStep): boolean {
  return step.requires_approval || SENSITIVE_TOOLS.has(step.tool);
}

/**
 * Handle the approval gate for a plan step.
 * Logs a notification to the activity feed so the user can approve/reject.
 *
 * @returns true if the plan should pause for approval
 */
export async function requestApproval(
  userId: string,
  planId: string,
  step: PlanStep
): Promise<boolean> {
  // Log approval request to activity feed
  trackActivity({
    userId,
    eventType: "tool_executed",
    title: `Approval needed: ${step.description}`,
    description: `Plan requires approval to execute "${step.tool}" - ${step.description}. Approve or reject at /dashboard/agent/plans/${planId}`,
    metadata: {
      type: "plan_approval_request",
      planId,
      stepId: step.id,
      tool: step.tool,
      args: step.args,
    },
  });

  return true; // Always pause for approval
}

/**
 * Validate an approval action.
 * Returns the action to take after approval/rejection.
 */
export function validateApprovalAction(
  action: string
): { valid: boolean; action: "approve" | "reject" } {
  const normalized = action.toLowerCase().trim();
  if (normalized === "approve" || normalized === "approved") {
    return { valid: true, action: "approve" };
  }
  if (normalized === "reject" || normalized === "rejected" || normalized === "deny") {
    return { valid: true, action: "reject" };
  }
  return { valid: false, action: "reject" };
}
