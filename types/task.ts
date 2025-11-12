// Task type definitions for enhanced execution system

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskExecutionType = "manual" | "semi_automated" | "fully_automated";
export type TaskExecutionStatus =
  | "pending"
  | "queued"
  | "in_progress"
  | "paused"
  | "blocked"
  | "completed"
  | "failed";
export type TaskAssigneeType = "user" | "agent" | "workflow";
export type TaskSourceType = "manual" | "chat" | "email" | "calendar" | "automated";

export interface ExecutionLogEntry {
  event: string;
  timestamp: string;
  executor_id?: string;
  executor_type?: string;
  result?: Record<string, any>;
  error?: string;
  reason?: string;
  subtask_id?: string;
  subtask_title?: string;
  retry_count?: number;
}

export interface AutomationRule {
  trigger_type: "time_based" | "event_based" | "dependency_based";
  conditions?: Record<string, any>;
  actions: string[];
}

export interface Task {
  // Core fields
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;

  // Status and priority
  status: TaskStatus;
  priority: TaskPriority;
  execution_status: TaskExecutionStatus;
  execution_type: TaskExecutionType;

  // Dates
  due_date?: string;
  created_at: string;
  completed_at?: string;
  started_at?: string;
  blocked_at?: string;
  failed_at?: string;

  // Assignment
  assigned_to_type?: TaskAssigneeType;
  assigned_to_id?: string;
  assigned_by?: string;

  // Execution tracking
  workflow_id?: string;
  agent_id?: string;
  execution_log: ExecutionLogEntry[];
  automation_rules?: AutomationRule[];

  // Task metadata
  project_name?: string;
  tags: string[];
  source_type: TaskSourceType;

  // AI extraction
  ai_extracted?: boolean;
  ai_confidence?: number;
  ai_context?: string;

  // Task relationships
  parent_task_id?: string;

  // Failure handling
  blocked_reason?: string;
  failure_reason?: string;
  retry_count: number;
  max_retries: number;

  // Effort estimation
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  execution_type?: TaskExecutionType;
  due_date?: string;
  project_name?: string;
  tags?: string[];
  assigned_to_type?: TaskAssigneeType;
  assigned_to_id?: string;
  workflow_id?: string;
  agent_id?: string;
  automation_rules?: AutomationRule[];
  estimated_duration_minutes?: number;
  parent_task_id?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  execution_status?: TaskExecutionStatus;
  execution_type?: TaskExecutionType;
  due_date?: string;
  project_name?: string;
  tags?: string[];
  assigned_to_type?: TaskAssigneeType;
  assigned_to_id?: string;
  workflow_id?: string;
  agent_id?: string;
  automation_rules?: AutomationRule[];
  estimated_duration_minutes?: number;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  confidence: number;
  context: string;
  execution_type?: TaskExecutionType;
  estimated_duration_minutes?: number;
}
