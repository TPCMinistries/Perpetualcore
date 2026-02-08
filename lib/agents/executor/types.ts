/**
 * Agent Executor Type Definitions
 *
 * Types for the autonomous agent plan executor that decomposes goals
 * into multi-step plans, executes them in the background, and handles
 * approval gates for sensitive operations.
 */

/** Status of an agent plan */
export type PlanStatus =
  | "planning"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/** Status of a single step within a plan */
export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "awaiting_approval";

/** A single step in an agent plan */
export interface PlanStep {
  /** Unique step identifier (e.g., "step_1") */
  id: string;
  /** The tool to call (must exist in registry) */
  tool: string;
  /** Arguments to pass to the tool */
  args: Record<string, any>;
  /** Human-readable description of what this step does */
  description: string;
  /** Current status of this step */
  status: StepStatus;
  /** Step IDs this step depends on (must complete before this runs) */
  depends_on: string[];
  /** Whether this step requires user approval before execution */
  requires_approval: boolean;
}

/** Result from executing a single step */
export interface StepResult {
  /** The output from the tool execution */
  output: string;
  /** Exit code (0 = success) */
  exitCode: number;
  /** Execution timing in milliseconds */
  timing: number;
  /** Error message if step failed */
  error?: string;
}

/** A complete agent plan stored in the database */
export interface AgentPlan {
  /** Unique plan identifier */
  id: string;
  /** The user who owns this plan */
  user_id: string;
  /** The high-level goal to accomplish */
  goal: string;
  /** Current plan status */
  status: PlanStatus;
  /** Ordered array of plan steps */
  steps: PlanStep[];
  /** Map of step_id to its execution result */
  step_results: Record<string, StepResult>;
  /** Index of the current/next step to execute */
  current_step_index: number;
  /** Model used for planning phase */
  planning_model: string;
  /** Model used for step execution reasoning */
  execution_model: string;
  /** Total cost accrued so far */
  total_cost: number;
  /** Additional context (conversationId, trigger message, etc.) */
  context: Record<string, any>;
  /** Error message if plan failed */
  error_message: string | null;
  /** Timestamps */
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** Input for creating a new plan via delegate_to_agent */
export interface CreatePlanInput {
  goal: string;
  steps_hint?: string[];
  urgency?: "low" | "normal" | "high";
}

/** Tools that require user approval before execution */
export const SENSITIVE_TOOLS = new Set([
  "gmail_send_email",
  "gmail_draft_email",
  "google_calendar_create_event",
  "google_calendar_update_event",
  "google_calendar_delete_event",
  "linear_create_issue",
  "linear_update_issue",
  "asana_create_task",
  "todoist_create_task",
  "slack_send_message",
]);

/** Tools that are auto-approved (read-only or sandboxed) */
export const AUTO_APPROVED_TOOLS = new Set([
  "web_search",
  "browse_web",
  "execute_code",
  "search_documents",
  "search_conversations",
  "search_contacts",
  "create_task",
]);

/** Maximum steps allowed per plan */
export const MAX_PLAN_STEPS = 15;

/** Maximum time (ms) a plan can be in 'running' status before being considered orphaned */
export const ORPHAN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
