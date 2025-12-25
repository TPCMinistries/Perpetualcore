// Command Center Types
// Exception-based management system - "Manage exceptions, not tasks"

export type ExceptionSeverity = "low" | "medium" | "high" | "critical";
export type ExceptionStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "dismissed";
export type ExceptionSource = "agent" | "workflow" | "integration" | "webhook" | "work_item" | "system";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type HealthArea = "agents" | "workflows" | "integrations" | "webhooks" | "database" | "api";

export interface Exception {
  id: string;
  organization_id: string;

  // Source
  source_type: ExceptionSource;
  source_id?: string;
  source_name?: string;

  // Details
  title: string;
  description?: string;
  error_message?: string;
  error_code?: string;
  stack_trace?: string;

  // Status
  severity: ExceptionSeverity;
  status: ExceptionStatus;

  // Assignment
  assigned_to?: string;
  assigned_user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };

  // AI
  ai_suggested_resolution?: string;
  ai_confidence_score?: number;

  // Resolution
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;

  // Retry
  can_retry: boolean;
  retry_count: number;
  max_retries: number;
  last_retry_at?: string;
  retry_payload?: Record<string, unknown>;

  // Meta
  metadata: Record<string, unknown>;
  tags: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
}

export interface ExceptionEvent {
  id: string;
  exception_id: string;
  event_type: string;
  from_status?: string;
  to_status?: string;
  comment?: string;
  performed_by?: string;
  performed_by_system: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemHealth {
  id: string;
  organization_id: string;
  area: HealthArea;
  status: HealthStatus;
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  pending_operations: number;
  details: Record<string, unknown>;
  last_error?: string;
  last_success_at?: string;
  last_failure_at?: string;
  recorded_at: string;
}

export interface SystemHealthSummary {
  area: HealthArea;
  status: HealthStatus;
  total_operations: number;
  failed_operations: number;
  success_rate: number;
  last_failure_at?: string;
}

export interface ExceptionCounts {
  status: ExceptionStatus;
  count: number;
  critical_count: number;
}

// API Request/Response types
export interface CreateExceptionRequest {
  source_type: ExceptionSource;
  source_id?: string;
  source_name?: string;
  title: string;
  description?: string;
  error_message?: string;
  error_code?: string;
  severity?: ExceptionSeverity;
  can_retry?: boolean;
  retry_payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateExceptionRequest {
  status?: ExceptionStatus;
  severity?: ExceptionSeverity;
  assigned_to?: string | null;
  resolution_notes?: string;
  tags?: string[];
}

export interface RecordHealthRequest {
  area: HealthArea;
  status: HealthStatus;
  total_operations?: number;
  successful_operations?: number;
  failed_operations?: number;
  pending_operations?: number;
  details?: Record<string, unknown>;
  last_error?: string;
}

// UI Helper functions
export function getSeverityColor(severity: ExceptionSeverity): string {
  switch (severity) {
    case "critical":
      return "text-red-600 bg-red-100";
    case "high":
      return "text-orange-600 bg-orange-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-slate-600 bg-slate-100";
  }
}

export function getStatusColor(status: ExceptionStatus): string {
  switch (status) {
    case "open":
      return "text-red-600 bg-red-100";
    case "acknowledged":
      return "text-blue-600 bg-blue-100";
    case "in_progress":
      return "text-yellow-600 bg-yellow-100";
    case "resolved":
      return "text-green-600 bg-green-100";
    case "dismissed":
      return "text-slate-600 bg-slate-100";
  }
}

export function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "text-green-600 bg-green-100";
    case "degraded":
      return "text-yellow-600 bg-yellow-100";
    case "unhealthy":
      return "text-red-600 bg-red-100";
  }
}

export function getHealthIcon(status: HealthStatus): "check" | "warning" | "error" {
  switch (status) {
    case "healthy":
      return "check";
    case "degraded":
      return "warning";
    case "unhealthy":
      return "error";
  }
}

export function getSourceLabel(source: ExceptionSource): string {
  switch (source) {
    case "agent":
      return "AI Agent";
    case "workflow":
      return "Workflow";
    case "integration":
      return "Integration";
    case "webhook":
      return "Webhook";
    case "work_item":
      return "Work Item";
    case "system":
      return "System";
  }
}

export function getAreaLabel(area: HealthArea): string {
  switch (area) {
    case "agents":
      return "AI Agents";
    case "workflows":
      return "Workflows";
    case "integrations":
      return "Integrations";
    case "webhooks":
      return "Webhooks";
    case "database":
      return "Database";
    case "api":
      return "API";
  }
}

// Overall system status calculation
export function calculateOverallStatus(healthItems: SystemHealthSummary[]): HealthStatus {
  if (healthItems.some((h) => h.status === "unhealthy")) {
    return "unhealthy";
  }
  if (healthItems.some((h) => h.status === "degraded")) {
    return "degraded";
  }
  return "healthy";
}
