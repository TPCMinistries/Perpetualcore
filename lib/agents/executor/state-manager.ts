/**
 * Agent Plan State Manager
 *
 * CRUD operations for the agent_plans table.
 * Uses admin client (service role) since plans execute in background contexts.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  AgentPlan,
  PlanStep,
  PlanStatus,
  StepResult,
  ORPHAN_TIMEOUT_MS,
} from "./types";

/**
 * Create a new agent plan.
 */
export async function createPlan(
  userId: string,
  goal: string,
  context?: Record<string, any>
): Promise<AgentPlan> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_plans")
    .insert({
      user_id: userId,
      goal,
      status: "planning",
      context: context || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create plan: ${error.message}`);
  return mapRowToPlan(data);
}

/**
 * Get a plan by ID.
 */
export async function getPlan(planId: string): Promise<AgentPlan | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error || !data) return null;
  return mapRowToPlan(data);
}

/**
 * List plans for a user, optionally filtered by status.
 */
export async function listPlans(
  userId: string,
  statusFilter?: PlanStatus | PlanStatus[]
): Promise<AgentPlan[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("agent_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (statusFilter) {
    if (Array.isArray(statusFilter)) {
      query = query.in("status", statusFilter);
    } else {
      query = query.eq("status", statusFilter);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list plans: ${error.message}`);
  return (data || []).map(mapRowToPlan);
}

/**
 * Update plan status.
 */
export async function updatePlanStatus(
  planId: string,
  status: PlanStatus,
  errorMessage?: string
): Promise<void> {
  const supabase = createAdminClient();

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage !== undefined) {
    updates.error_message = errorMessage;
  }

  if (status === "completed" || status === "failed" || status === "cancelled") {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("agent_plans")
    .update(updates)
    .eq("id", planId);

  if (error) throw new Error(`Failed to update plan status: ${error.message}`);
}

/**
 * Save the decomposed steps to a plan and mark it as running.
 */
export async function savePlanSteps(
  planId: string,
  steps: PlanStep[]
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("agent_plans")
    .update({
      steps: JSON.parse(JSON.stringify(steps)),
      status: "running",
      current_step_index: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) throw new Error(`Failed to save plan steps: ${error.message}`);
}

/**
 * Record the result of a step execution and advance the step index.
 */
export async function recordStepResult(
  planId: string,
  stepId: string,
  result: StepResult,
  updatedSteps: PlanStep[],
  nextStepIndex: number,
  costIncrement: number
): Promise<void> {
  const supabase = createAdminClient();

  // Get current plan to merge step_results
  const plan = await getPlan(planId);
  if (!plan) throw new Error(`Plan ${planId} not found`);

  const stepResults = { ...plan.step_results, [stepId]: result };

  const { error } = await supabase
    .from("agent_plans")
    .update({
      steps: JSON.parse(JSON.stringify(updatedSteps)),
      step_results: JSON.parse(JSON.stringify(stepResults)),
      current_step_index: nextStepIndex,
      total_cost: plan.total_cost + costIncrement,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) throw new Error(`Failed to record step result: ${error.message}`);
}

/**
 * Find orphaned plans (stuck in 'running' status beyond timeout).
 */
export async function findOrphanedPlans(): Promise<AgentPlan[]> {
  const supabase = createAdminClient();

  const cutoff = new Date(Date.now() - ORPHAN_TIMEOUT_MS).toISOString();

  const { data, error } = await supabase
    .from("agent_plans")
    .select("*")
    .eq("status", "running")
    .lt("updated_at", cutoff);

  if (error) {
    console.error("[StateMgr] Failed to find orphaned plans:", error);
    return [];
  }

  return (data || []).map(mapRowToPlan);
}

/**
 * Get recent completed plans for action memory injection.
 */
export async function getRecentCompletedPlans(
  userId: string,
  limit: number = 5
): Promise<AgentPlan[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_plans")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "running", "paused"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[StateMgr] Failed to get recent plans:", error);
    return [];
  }

  return (data || []).map(mapRowToPlan);
}

/** Map a DB row to the AgentPlan interface */
function mapRowToPlan(row: any): AgentPlan {
  return {
    id: row.id,
    user_id: row.user_id,
    goal: row.goal,
    status: row.status,
    steps: row.steps || [],
    step_results: row.step_results || {},
    current_step_index: row.current_step_index || 0,
    planning_model: row.planning_model || "claude-sonnet",
    execution_model: row.execution_model || "gpt-4o-mini",
    total_cost: parseFloat(row.total_cost) || 0,
    context: row.context || {},
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
  };
}
