/**
 * Heartbeat Agent Type Definitions
 *
 * Types for the autonomous heartbeat agent that periodically checks
 * email, calendar, tasks, and contacts, then generates actionable insights.
 */

/**
 * Configuration for a user's heartbeat agent.
 * Controls which checks run and how notifications are delivered.
 */
export interface HeartbeatConfig {
  /** The user this heartbeat belongs to */
  userId: string;
  /** Which checks to run */
  checks: {
    email: boolean;
    calendar: boolean;
    tasks: boolean;
    contacts: boolean;
  };
  /** Cron-style schedule (e.g., "0 8 * * *" for daily at 8am) */
  schedule: string;
  /** Preferred channel for delivering heartbeat results */
  notifyChannel: "telegram" | "slack" | "whatsapp" | "email" | "in_app";
}

/**
 * Result from a single check (email, calendar, tasks, or contacts).
 */
export interface CheckResult {
  /** Which checker produced this result */
  type: "email" | "calendar" | "tasks" | "contacts";
  /** Array of actionable items found */
  items: CheckItem[];
  /** Human-readable summary of findings */
  summary: string;
  /** Overall urgency level for this check */
  urgency: "low" | "medium" | "high" | "critical";
}

/**
 * A single actionable item found by a checker.
 */
export interface CheckItem {
  /** Short title */
  title: string;
  /** Longer description */
  description: string;
  /** Urgency of this specific item */
  urgency: "low" | "medium" | "high" | "critical";
  /** Category for grouping (e.g., "unread_email", "overdue_task") */
  category: string;
  /** Arbitrary metadata (email IDs, task IDs, etc.) */
  metadata: Record<string, any>;
}

/**
 * A complete heartbeat run record.
 */
export interface HeartbeatRun {
  /** Unique run identifier */
  id: string;
  /** The user this run belongs to */
  userId: string;
  /** When the run started */
  startedAt: string;
  /** When the run completed (null if still running) */
  completedAt: string | null;
  /** Results from each checker */
  checkResults: CheckResult[];
  /** AI-generated insights from analyzing all results */
  insights: HeartbeatInsight[];
  /** Run status */
  status: "running" | "completed" | "failed";
  /** Error message if the run failed */
  errorMessage?: string;
}

/**
 * An AI-generated insight from analyzing heartbeat check results.
 * Cross-references data across checkers to surface patterns.
 */
export interface HeartbeatInsight {
  /** Category of insight (e.g., "email", "scheduling", "relationship") */
  category: string;
  /** Human-readable insight message */
  message: string;
  /** Urgency level */
  urgency: "low" | "medium" | "high" | "critical";
  /** Suggested action the user can take */
  suggestedAction: string;
  /** IDs or references to related items from the check results */
  relatedItems: string[];
}

/** Default heartbeat configuration */
export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  userId: "",
  checks: {
    email: true,
    calendar: true,
    tasks: true,
    contacts: true,
  },
  schedule: "0 8 * * *", // Daily at 8am
  notifyChannel: "telegram",
};
