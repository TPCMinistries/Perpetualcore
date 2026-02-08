/**
 * Plan Reporter
 *
 * Summarizes completed plans and logs results to the activity feed.
 * Generates human-readable summaries of what was accomplished.
 */

import { AgentPlan } from "./types";
import { trackActivity } from "@/lib/activity-feed/tracker";

/**
 * Generate a summary of a completed plan and log it to the activity feed.
 */
export async function reportPlanCompletion(plan: AgentPlan): Promise<string> {
  const summary = generatePlanSummary(plan);

  // Log to activity feed
  trackActivity({
    userId: plan.user_id,
    eventType: "tool_executed",
    title: `Plan completed: ${truncate(plan.goal, 50)}`,
    description: summary,
    metadata: {
      type: "plan_completed",
      planId: plan.id,
      stepCount: plan.steps.length,
      completedSteps: plan.steps.filter((s) => s.status === "completed").length,
      totalCost: plan.total_cost,
      totalTime: plan.completed_at
        ? new Date(plan.completed_at).getTime() -
          new Date(plan.created_at).getTime()
        : 0,
    },
  });

  return summary;
}

/**
 * Report a plan failure to the activity feed.
 */
export async function reportPlanFailure(plan: AgentPlan): Promise<void> {
  const failedStep = plan.steps.find((s) => s.status === "failed");

  trackActivity({
    userId: plan.user_id,
    eventType: "tool_executed",
    title: `Plan failed: ${truncate(plan.goal, 50)}`,
    description: failedStep
      ? `Failed at step ${failedStep.id}: ${failedStep.description} - ${plan.error_message || "Unknown error"}`
      : plan.error_message || "Unknown error",
    metadata: {
      type: "plan_failed",
      planId: plan.id,
      failedStep: failedStep?.id,
      error: plan.error_message,
    },
  });
}

/**
 * Generate a human-readable summary of a plan's execution.
 */
export function generatePlanSummary(plan: AgentPlan): string {
  const completedSteps = plan.steps.filter((s) => s.status === "completed");
  const failedSteps = plan.steps.filter((s) => s.status === "failed");
  const skippedSteps = plan.steps.filter((s) => s.status === "skipped");

  const lines: string[] = [];
  lines.push(`Goal: ${plan.goal}`);
  lines.push(
    `Status: ${plan.status} (${completedSteps.length}/${plan.steps.length} steps completed)`
  );

  if (failedSteps.length > 0) {
    lines.push(`Failed steps: ${failedSteps.map((s) => s.id).join(", ")}`);
  }
  if (skippedSteps.length > 0) {
    lines.push(`Skipped: ${skippedSteps.map((s) => s.id).join(", ")}`);
  }

  // Include brief output from each completed step
  for (const step of completedSteps) {
    const result = plan.step_results[step.id];
    if (result) {
      lines.push(
        `  ${step.id} (${step.tool}): ${truncate(result.output, 80)}`
      );
    }
  }

  if (plan.total_cost > 0) {
    lines.push(`Cost: $${plan.total_cost.toFixed(6)}`);
  }

  return lines.join("\n");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
