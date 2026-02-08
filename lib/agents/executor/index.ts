/**
 * Agent Plan Orchestrator
 *
 * Main entry point for autonomous plan execution. Coordinates:
 * 1. Goal decomposition (planner)
 * 2. Sequential step execution (step-runner)
 * 3. Approval gates for sensitive operations
 * 4. Self-chaining via POST to /api/agent/plans/[id]/continue
 * 5. Result reporting to activity feed
 *
 * Each step runs in its own serverless invocation to avoid Vercel's 5-min timeout.
 */

import { ToolExecutionContext } from "@/lib/ai/tools/schema";
import { getAvailableToolsForUser } from "@/lib/ai/tools/registry";
import { decomposeGoal } from "./planner";
import { runStep } from "./step-runner";
import { needsApproval, requestApproval } from "./approval-gate";
import { buildStepContext } from "./context-loader";
import {
  createPlan,
  getPlan,
  savePlanSteps,
  recordStepResult,
  updatePlanStatus,
} from "./state-manager";
import { reportPlanCompletion, reportPlanFailure } from "./reporter";
import { AgentPlan, CreatePlanInput, PlanStep } from "./types";

/**
 * Create and start a new agent plan from a goal.
 * Called when the AI invokes `delegate_to_agent`.
 *
 * @returns The created plan with steps populated
 */
export async function createAndStartPlan(
  input: CreatePlanInput,
  context: ToolExecutionContext
): Promise<AgentPlan> {
  // 1. Create plan record in DB
  const plan = await createPlan(context.userId, input.goal, {
    conversationId: context.conversationId,
    urgency: input.urgency || "normal",
  });

  try {
    // 2. Get available tools for this user
    const { tools, skillMap } = await getAvailableToolsForUser(
      context.userId,
      context.organizationId
    );
    const toolNames = tools.map((t) => t.name);

    // 3. Decompose goal into steps
    const { steps } = await decomposeGoal(
      input.goal,
      input.steps_hint,
      toolNames
    );

    // 4. Save steps and mark plan as running
    await savePlanSteps(plan.id, steps);

    // 5. Fire-and-forget: trigger first step execution
    triggerContinue(plan.id);

    // Return the plan with steps
    return { ...plan, steps, status: "running" };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Planning failed";
    await updatePlanStatus(plan.id, "failed", message);
    throw error;
  }
}

/**
 * Execute the next pending step of a plan.
 * Called by the /api/agent/plans/[id]/continue endpoint.
 * Self-chains to the next step on completion.
 *
 * @returns Updated plan state
 */
export async function orchestratePlan(planId: string): Promise<AgentPlan> {
  const plan = await getPlan(planId);
  if (!plan) throw new Error(`Plan ${planId} not found`);

  // Guard: only run plans that are in 'running' status
  if (plan.status !== "running") {
    return plan;
  }

  // Find the current step
  const stepIndex = plan.current_step_index;
  if (stepIndex >= plan.steps.length) {
    // All steps completed
    await updatePlanStatus(planId, "completed");
    const completedPlan = await getPlan(planId);
    if (completedPlan) await reportPlanCompletion(completedPlan);
    return completedPlan || plan;
  }

  const step = plan.steps[stepIndex];

  // Check if this step needs approval
  if (needsApproval(step) && step.status !== "completed") {
    // Mark step as awaiting approval
    const updatedSteps = [...plan.steps];
    updatedSteps[stepIndex] = { ...step, status: "awaiting_approval" };

    await recordStepResult(
      planId,
      step.id,
      { output: "Awaiting approval", exitCode: -1, timing: 0 },
      updatedSteps,
      stepIndex, // Don't advance index
      0
    );

    // Pause the plan and notify user
    await updatePlanStatus(planId, "paused");
    await requestApproval(plan.user_id, planId, step);

    return { ...plan, steps: updatedSteps, status: "paused" };
  }

  // Execute the step
  const { priorResults } = buildStepContext(plan);

  // Build execution context
  const execContext: ToolExecutionContext = {
    userId: plan.user_id,
    organizationId: plan.context.organizationId || plan.user_id,
    conversationId: plan.context.conversationId,
  };

  // Get skill map for the user
  let skillMap: Record<string, string> | undefined;
  try {
    const userTools = await getAvailableToolsForUser(
      plan.user_id,
      execContext.organizationId
    );
    skillMap = userTools.skillMap;
  } catch {
    // Continue without skill map
  }

  // Mark step as running
  const updatedSteps = [...plan.steps];
  updatedSteps[stepIndex] = { ...step, status: "running" };

  // Execute the step
  const result = await runStep(step, execContext, priorResults, skillMap);

  // Update step status based on result
  if (result.exitCode === 0) {
    updatedSteps[stepIndex] = { ...step, status: "completed" };
  } else {
    updatedSteps[stepIndex] = { ...step, status: "failed" };
  }

  const nextIndex = stepIndex + 1;

  // Record result and advance
  await recordStepResult(
    planId,
    step.id,
    result,
    updatedSteps,
    nextIndex,
    0.0004 // ~cost per step
  );

  // Handle failure
  if (result.exitCode !== 0) {
    await updatePlanStatus(planId, "failed", result.error);
    const failedPlan = await getPlan(planId);
    if (failedPlan) await reportPlanFailure(failedPlan);
    return failedPlan || plan;
  }

  // Check if all steps are done
  if (nextIndex >= plan.steps.length) {
    await updatePlanStatus(planId, "completed");
    const completedPlan = await getPlan(planId);
    if (completedPlan) await reportPlanCompletion(completedPlan);
    return completedPlan || plan;
  }

  // Self-chain: trigger next step execution
  triggerContinue(planId);

  return { ...plan, steps: updatedSteps, current_step_index: nextIndex };
}

/**
 * Resume a paused plan after approval.
 * Marks the paused step as pending and triggers execution.
 */
export async function resumePlanAfterApproval(planId: string): Promise<void> {
  const plan = await getPlan(planId);
  if (!plan || plan.status !== "paused") {
    throw new Error(`Plan ${planId} is not paused`);
  }

  // Find the step awaiting approval
  const stepIndex = plan.current_step_index;
  const step = plan.steps[stepIndex];

  if (!step || step.status !== "awaiting_approval") {
    throw new Error(`No step awaiting approval at index ${stepIndex}`);
  }

  // Reset step to pending and mark plan as running
  const updatedSteps = [...plan.steps];
  updatedSteps[stepIndex] = {
    ...step,
    status: "pending",
    requires_approval: false, // Already approved
  };

  await recordStepResult(
    planId,
    step.id,
    { output: "Approved by user", exitCode: 0, timing: 0 },
    updatedSteps,
    stepIndex,
    0
  );

  await updatePlanStatus(planId, "running");

  // Trigger execution
  triggerContinue(planId);
}

/**
 * Reject a paused plan step. Cancels the plan.
 */
export async function rejectPlanStep(planId: string): Promise<void> {
  const plan = await getPlan(planId);
  if (!plan || plan.status !== "paused") {
    throw new Error(`Plan ${planId} is not paused`);
  }

  const stepIndex = plan.current_step_index;
  const updatedSteps = [...plan.steps];
  updatedSteps[stepIndex] = {
    ...plan.steps[stepIndex],
    status: "skipped",
  };

  // Skip remaining steps too
  for (let i = stepIndex + 1; i < updatedSteps.length; i++) {
    updatedSteps[i] = { ...updatedSteps[i], status: "skipped" };
  }

  await recordStepResult(
    planId,
    plan.steps[stepIndex].id,
    { output: "Rejected by user", exitCode: -1, timing: 0 },
    updatedSteps,
    plan.steps.length, // Move to end
    0
  );

  await updatePlanStatus(planId, "cancelled", "Step rejected by user");
}

/**
 * Fire-and-forget POST to the continue endpoint.
 * This enables self-chaining across serverless invocations.
 */
function triggerContinue(planId: string): void {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    console.warn("[Executor] No base URL configured for self-chaining");
    return;
  }

  const url = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/agent/plans/${planId}/continue`;

  // Fire-and-forget — don't await
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  }).catch((err) => {
    console.error("[Executor] Failed to trigger continue:", err);
  });
}

// Re-export types for convenience
export type { AgentPlan, PlanStep, CreatePlanInput } from "./types";
