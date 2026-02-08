/**
 * Activity Feed Type Definitions
 *
 * Types for the unified agent activity feed that tracks all
 * system actions across channels, agents, and tools.
 */

/** All supported activity event types */
export type ActivityEventType =
  | "message_received"
  | "message_sent"
  | "tool_executed"
  | "heartbeat_completed"
  | "code_executed"
  | "browser_action"
  | "task_created"
  | "memory_stored"
  | "contact_updated"
  | "skill_activated";

/**
 * A single activity event in the feed.
 */
export interface ActivityEvent {
  /** Unique event identifier */
  id: string;
  /** The user this event belongs to */
  userId: string;
  /** The type of event */
  eventType: ActivityEventType;
  /** Short human-readable title */
  title: string;
  /** Optional longer description */
  description?: string;
  /** Arbitrary metadata (stored as JSONB) */
  metadata: Record<string, any>;
  /** Which channel this event occurred on, if applicable */
  channel?: string;
  /** When the event was created */
  createdAt: string;
}
