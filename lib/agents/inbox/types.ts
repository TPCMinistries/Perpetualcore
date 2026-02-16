/**
 * Agent Inbox Type Definitions
 *
 * Types for the agent inbox system that enables proactive agent behaviors.
 * Any part of the platform can queue work items for the agent to process,
 * combined with a scheduler for recurring behaviors like morning briefings,
 * email summaries, and follow-up reminders.
 */

/** Where the inbox item originated from */
export type InboxSource =
  | "channel"
  | "cron"
  | "webhook"
  | "schedule"
  | "trigger"
  | "user"
  | "system";

/** Priority levels for inbox items (affects processing order) */
export type InboxPriority = "low" | "normal" | "high" | "urgent";

/** Current status of an inbox item */
export type InboxStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * An item in the agent inbox waiting to be processed.
 * Maps to the `agent_inbox` database table.
 */
export interface AgentInboxItem {
  /** Unique identifier */
  id: string;
  /** The user this item belongs to */
  user_id: string;
  /** Where this item came from */
  source: InboxSource;
  /** Processing priority */
  priority: InboxPriority;
  /** The work payload — type field determines how it's processed */
  payload: Record<string, unknown>;
  /** Current processing status */
  status: InboxStatus;
  /** When this item should be processed (ISO timestamp) */
  scheduled_for: string;
  /** Maximum number of retry attempts on failure */
  max_retries: number;
  /** Current retry count */
  retry_count: number;
  /** Error message from last failed attempt */
  error_message?: string;
  /** When the item was created */
  created_at: string;
  /** When the item was last processed */
  processed_at?: string;
}

/**
 * Result from processing a single inbox item.
 */
export interface InboxProcessResult {
  /** The inbox item ID that was processed */
  itemId: string;
  /** Whether processing succeeded */
  success: boolean;
  /** The result data from processing */
  result?: unknown;
  /** Error message if processing failed */
  error?: string;
}

/** Available behavior types for scheduled proactive behaviors */
export type BehaviorType =
  | "morning_briefing"
  | "email_summary"
  | "follow_up_reminder"
  | "custom_check"
  | "daily_digest"
  | "weekly_report";

/**
 * A scheduled recurring behavior that queues inbox items on a cron schedule.
 * Maps to the `proactive_behaviors` database table.
 */
export interface ScheduledBehavior {
  /** Unique identifier */
  id: string;
  /** The user who owns this behavior */
  user_id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this behavior does */
  description?: string;
  /** Type of behavior (determines processing logic) */
  behavior_type: BehaviorType;
  /** Cron expression for scheduling (e.g., "0 8 * * 1-5") */
  schedule: string;
  /** Type-specific configuration */
  config: Record<string, unknown>;
  /** Whether this behavior is currently active */
  is_active: boolean;
  /** When this behavior last ran */
  last_run_at?: string;
  /** When this behavior is next scheduled to run */
  next_run_at?: string;
  /** When this behavior was created */
  created_at: string;
  /** When this behavior was last updated */
  updated_at: string;
}

/** Options for queuing a new inbox item */
export interface QueueItemOptions {
  /** Processing priority (default: "normal") */
  priority?: InboxPriority;
  /** When to process (default: now) */
  scheduledFor?: Date;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/** Priority ordering for sorting (higher number = processed first) */
export const PRIORITY_ORDER: Record<InboxPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};
