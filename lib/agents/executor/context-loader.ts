/**
 * Context Loader
 *
 * Builds execution context for plan steps by loading prior step results
 * and relevant user data. This context is used by the step runner
 * to resolve inter-step references.
 */

import { AgentPlan, StepResult } from "./types";
import { getRecentCompletedPlans } from "./state-manager";

/**
 * Build context for executing the current step of a plan.
 * Includes prior step results and plan metadata.
 */
export function buildStepContext(
  plan: AgentPlan
): {
  priorResults: Record<string, StepResult>;
  planGoal: string;
  currentStepIndex: number;
  totalSteps: number;
} {
  return {
    priorResults: plan.step_results,
    planGoal: plan.goal,
    currentStepIndex: plan.current_step_index,
    totalSteps: plan.steps.length,
  };
}

/**
 * Build action memory string for injection into the chat system prompt.
 * Shows recent plan results so the AI knows what it has done autonomously.
 *
 * @param userId - The user to load action memory for
 * @returns A formatted string for system prompt injection, or null if no recent plans
 */
export async function buildActionMemory(
  userId: string
): Promise<string | null> {
  try {
    const recentPlans = await getRecentCompletedPlans(userId, 5);

    if (recentPlans.length === 0) return null;

    const lines = recentPlans.map((plan) => {
      const age = getTimeAgo(plan.updated_at);
      const stepCount = plan.steps.length;
      const completedSteps = plan.steps.filter(
        (s) => s.status === "completed"
      ).length;

      // Build a brief summary of what was accomplished
      let summary = "";
      if (plan.status === "completed") {
        const lastResult = plan.step_results[`step_${stepCount}`];
        summary = lastResult?.output
          ? truncate(lastResult.output, 100)
          : `${completedSteps}/${stepCount} steps completed`;
      } else if (plan.status === "paused") {
        const pausedStep = plan.steps.find(
          (s) => s.status === "awaiting_approval"
        );
        summary = pausedStep
          ? `Paused: awaiting approval for "${pausedStep.tool}"`
          : `Paused at step ${plan.current_step_index + 1}/${stepCount}`;
      } else if (plan.status === "running") {
        summary = `In progress: step ${plan.current_step_index + 1}/${stepCount}`;
      }

      return `- [${age}] "${truncate(plan.goal, 60)}" (${plan.status}) → ${summary}`;
    });

    return `\n=== RECENT AGENT ACTIONS ===
You have an autonomous agent that can execute multi-step plans in the background.
Recent plans:
${lines.join("\n")}
Use delegate_to_agent when a task needs multiple steps or background execution.
Use get_plan_status to check on running plans.`;
  } catch (error) {
    console.error("[ContextLoader] Failed to build action memory:", error);
    return null;
  }
}

/** Format a timestamp as a human-readable relative time */
function getTimeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Truncate a string to a maximum length */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
