/**
 * n8n Integration Client
 * Provides methods to interact with the n8n API for workflow management
 */

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; name: string }[];
  nodes?: N8nNode[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, any>;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status: "success" | "error" | "waiting" | "running" | "unknown";
  data?: {
    resultData?: {
      error?: {
        message: string;
        node?: string;
      };
    };
  };
}

export interface N8nWorkflowListItem {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; name: string }[];
}

export interface N8nExecutionListResponse {
  data: N8nExecution[];
  nextCursor?: string;
  hasMore?: boolean;
}

/**
 * Transform n8n workflow to automation hub format
 */
export function transformWorkflowToAutomation(workflow: N8nWorkflowListItem): {
  id: string;
  name: string;
  type: "n8n";
  status: "active" | "inactive";
  description: string;
  lastRun: string | null;
  runCount: number;
  triggerType: string;
  tags: string[];
} {
  return {
    id: `n8n-${workflow.id}`,
    name: workflow.name,
    type: "n8n",
    status: workflow.active ? "active" : "inactive",
    description: `n8n workflow: ${workflow.name}`,
    lastRun: workflow.updatedAt,
    runCount: 0, // Will be updated with execution count
    triggerType: "n8n",
    tags: workflow.tags?.map(t => t.name) || [],
  };
}

/**
 * Transform n8n execution to activity format
 */
export function transformExecutionToActivity(execution: N8nExecution): {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error" | "running" | "waiting";
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
} {
  const startedAt = new Date(execution.startedAt);
  const stoppedAt = execution.stoppedAt ? new Date(execution.stoppedAt) : null;
  const duration = stoppedAt ? stoppedAt.getTime() - startedAt.getTime() : null;

  return {
    id: execution.id,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName || `Workflow ${execution.workflowId}`,
    status: execution.status === "unknown" ? "error" : execution.status,
    startedAt: execution.startedAt,
    completedAt: execution.stoppedAt || null,
    duration,
    error: execution.data?.resultData?.error?.message || null,
  };
}

/**
 * Get workflow statistics from executions
 */
export function calculateWorkflowStats(executions: N8nExecution[]): {
  total: number;
  success: number;
  error: number;
  running: number;
  avgDuration: number | null;
} {
  const completed = executions.filter(e => e.finished);
  const success = completed.filter(e => e.status === "success").length;
  const error = completed.filter(e => e.status === "error").length;
  const running = executions.filter(e => !e.finished).length;

  // Calculate average duration for successful executions
  const durations = completed
    .filter(e => e.status === "success" && e.stoppedAt)
    .map(e => {
      const start = new Date(e.startedAt).getTime();
      const stop = new Date(e.stoppedAt!).getTime();
      return stop - start;
    });

  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null;

  return {
    total: executions.length,
    success,
    error,
    running,
    avgDuration,
  };
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "running":
      return "text-blue-500";
    case "waiting":
      return "text-yellow-500";
    case "active":
      return "text-green-500";
    case "inactive":
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
    case "active":
      return "default";
    case "error":
      return "destructive";
    case "running":
    case "waiting":
      return "secondary";
    default:
      return "outline";
  }
}
