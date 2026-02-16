/**
 * Agent Inbox - Public API
 *
 * Re-exports the key functions from the inbox system for clean imports.
 */

export { processInbox, processItem, queueItem } from "./processor";
export {
  scheduleAction,
  createRecurringBehavior,
  getUserBehaviors,
  updateBehavior,
  deleteBehavior,
  processScheduledBehaviors,
  calculateNextRun,
} from "./scheduler";
export type {
  AgentInboxItem,
  InboxProcessResult,
  InboxSource,
  InboxPriority,
  InboxStatus,
  ScheduledBehavior,
  BehaviorType,
  QueueItemOptions,
} from "./types";
