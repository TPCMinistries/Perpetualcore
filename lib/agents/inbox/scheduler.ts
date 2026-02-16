/**
 * Agent Inbox Scheduler
 *
 * Manages recurring and one-time scheduled agent actions.
 * Provides CRUD for proactive behaviors and a processor that
 * converts due behaviors into inbox items.
 *
 * All operations use createAdminClient() since this runs in cron/background context.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { ScheduledBehavior, BehaviorType } from "./types";
import { queueItem } from "./processor";

// ---------------------------------------------------------------------------
// One-Time Scheduling
// ---------------------------------------------------------------------------

/**
 * Schedule a one-time action for future processing.
 *
 * @param userId - The user this action belongs to
 * @param scheduledFor - When to process this action
 * @param payload - The work payload (must include a `type` field)
 * @param options - Optional priority and retry config
 * @returns The created inbox item ID
 */
export async function scheduleAction(
  userId: string,
  scheduledFor: Date,
  payload: Record<string, unknown>,
  options?: { priority?: "low" | "normal" | "high" | "urgent"; maxRetries?: number }
): Promise<string> {
  return queueItem(userId, "schedule", payload, {
    priority: options?.priority || "normal",
    scheduledFor,
    maxRetries: options?.maxRetries ?? 3,
  });
}

// ---------------------------------------------------------------------------
// Recurring Behaviors CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new recurring proactive behavior for a user.
 */
export async function createRecurringBehavior(
  userId: string,
  behavior: {
    name: string;
    description?: string;
    behavior_type: BehaviorType;
    schedule: string;
    config: Record<string, unknown>;
    is_active?: boolean;
  }
): Promise<ScheduledBehavior> {
  const supabase = createAdminClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Calculate the first next_run_at based on the cron schedule
  const nextRunAt = calculateNextRun(behavior.schedule);

  const record = {
    id,
    user_id: userId,
    name: behavior.name,
    description: behavior.description || null,
    behavior_type: behavior.behavior_type,
    schedule: behavior.schedule,
    config: behavior.config,
    is_active: behavior.is_active ?? true,
    last_run_at: null,
    next_run_at: nextRunAt?.toISOString() || null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from("proactive_behaviors").insert(record);

  if (error) {
    console.error("[Scheduler] Error creating behavior:", error);
    throw new Error(`Failed to create behavior: ${error.message}`);
  }

  console.log(
    `[Scheduler] Created behavior "${behavior.name}" for user ${userId} (next run: ${nextRunAt?.toISOString() || "none"})`
  );

  return record as ScheduledBehavior;
}

/**
 * Get all proactive behaviors for a user.
 */
export async function getUserBehaviors(
  userId: string
): Promise<ScheduledBehavior[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("proactive_behaviors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Scheduler] Error fetching behaviors:", error);
    throw new Error(`Failed to fetch behaviors: ${error.message}`);
  }

  return (data || []) as ScheduledBehavior[];
}

/**
 * Update an existing proactive behavior.
 */
export async function updateBehavior(
  id: string,
  updates: Partial<
    Pick<
      ScheduledBehavior,
      "name" | "description" | "schedule" | "config" | "is_active"
    >
  >
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Recalculate next_run_at if schedule changed
  if (updates.schedule) {
    const nextRun = calculateNextRun(updates.schedule);
    updateData.next_run_at = nextRun?.toISOString() || null;
  }

  const { error } = await supabase
    .from("proactive_behaviors")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("[Scheduler] Error updating behavior:", error);
    throw new Error(`Failed to update behavior: ${error.message}`);
  }
}

/**
 * Delete a proactive behavior.
 */
export async function deleteBehavior(id: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("proactive_behaviors")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Scheduler] Error deleting behavior:", error);
    throw new Error(`Failed to delete behavior: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Scheduled Behavior Processing (called by cron)
// ---------------------------------------------------------------------------

/**
 * Process all scheduled behaviors that are due to run.
 *
 * Called by the proactive-nudges cron job. For each due behavior:
 * 1. Queue an inbox item with the appropriate payload
 * 2. Update last_run_at and calculate next_run_at
 *
 * @returns Number of behaviors processed
 */
export async function processScheduledBehaviors(): Promise<{ processed: number; queued: number }> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find behaviors that are active and due to run
  const { data: dueBehaviors, error } = await supabase
    .from("proactive_behaviors")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", now)
    .not("next_run_at", "is", null)
    .limit(50);

  if (error) {
    console.error("[Scheduler] Error fetching due behaviors:", error);
    return { processed: 0, queued: 0 };
  }

  if (!dueBehaviors || dueBehaviors.length === 0) {
    return { processed: 0, queued: 0 };
  }

  console.log(
    `[Scheduler] Processing ${dueBehaviors.length} due behaviors`
  );

  let queued = 0;

  for (const behavior of dueBehaviors as ScheduledBehavior[]) {
    try {
      // Build the inbox payload based on behavior type
      const payload = buildBehaviorPayload(behavior);

      // Queue the inbox item
      await queueItem(behavior.user_id, "schedule", payload, {
        priority: "normal",
      });

      queued++;

      // Calculate next run time and update the behavior
      const nextRun = calculateNextRun(behavior.schedule);

      await supabase
        .from("proactive_behaviors")
        .update({
          last_run_at: now,
          next_run_at: nextRun?.toISOString() || null,
          updated_at: now,
        })
        .eq("id", behavior.id);

      console.log(
        `[Scheduler] Queued "${behavior.name}" for user ${behavior.user_id} (next: ${nextRun?.toISOString() || "none"})`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[Scheduler] Error processing behavior ${behavior.id}:`,
        message
      );
    }
  }

  return { processed: dueBehaviors.length, queued };
}

// ---------------------------------------------------------------------------
// Payload Builder
// ---------------------------------------------------------------------------

/**
 * Build the inbox item payload for a specific behavior type.
 */
function buildBehaviorPayload(
  behavior: ScheduledBehavior
): Record<string, unknown> {
  const config = behavior.config || {};

  switch (behavior.behavior_type) {
    case "morning_briefing":
      return {
        type: "generate_briefing",
        behavior_id: behavior.id,
        include_calendar: config.include_calendar ?? true,
        include_tasks: config.include_tasks ?? true,
        include_emails: config.include_emails ?? true,
        delivery_channel: config.delivery_channel || "telegram",
      };

    case "email_summary":
      return {
        type: "email_summary",
        behavior_id: behavior.id,
        min_importance: config.min_importance || "medium",
        delivery_channel: config.delivery_channel || "telegram",
      };

    case "follow_up_reminder":
      return {
        type: "follow_up_reminder",
        behavior_id: behavior.id,
        days_overdue: config.days_overdue || 3,
        delivery_channel: config.delivery_channel || "telegram",
      };

    case "daily_digest":
      return {
        type: "generate_briefing",
        behavior_id: behavior.id,
        delivery_channel: config.delivery_channel || "in_app",
      };

    case "weekly_report":
      return {
        type: "generate_briefing",
        behavior_id: behavior.id,
        report_type: "weekly",
        delivery_channel: config.delivery_channel || "email",
      };

    case "custom_check":
      return {
        type: "custom_action",
        behavior_id: behavior.id,
        goal: config.goal || "Run custom check",
        ...(config.steps_hint ? { steps_hint: config.steps_hint } : {}),
      };

    default:
      return {
        type: "proactive_nudge",
        behavior_id: behavior.id,
        ...config,
      };
  }
}

// ---------------------------------------------------------------------------
// Cron Schedule Parser
// ---------------------------------------------------------------------------

// Parse a simple cron expression and calculate the next run time from now.
// Supports standard 5-field format: minute hour day-of-month month day-of-week
// e.g. "0 8 * * 1-5" (weekdays 8am), "30 9 * * *" (daily 9:30am)
export function calculateNextRun(cronExpression: string): Date | null {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      console.warn(`[Scheduler] Invalid cron expression: ${cronExpression}`);
      return null;
    }

    const [minuteField, hourField, , , dowField] = parts;

    // Parse minute
    const minute = parseField(minuteField, 0, 59);

    // Parse hour
    const hour = parseField(hourField, 0, 23);

    // Parse day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const allowedDays = parseDayOfWeek(dowField);

    const now = new Date();

    // Search forward up to 8 days to find the next valid slot
    for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + dayOffset);

      // Check if this day of week is allowed
      if (allowedDays && !allowedDays.includes(candidate.getDay())) {
        continue;
      }

      // Try each valid hour/minute combination
      for (const h of hour) {
        for (const m of minute) {
          candidate.setHours(h, m, 0, 0);

          // Must be in the future
          if (candidate.getTime() > now.getTime()) {
            return candidate;
          }
        }
      }
    }

    // Fallback: schedule for tomorrow at the first valid time
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(hour[0] || 8, minute[0] || 0, 0, 0);
    return fallback;
  } catch (err) {
    console.error(`[Scheduler] Error parsing cron "${cronExpression}":`, err);
    return null;
  }
}

/**
 * Parse a single cron field into an array of valid values.
 *
 * Supports:
 * - "*" -> all values in range
 * - "N" -> specific number
 * - "N,M" -> list
 * - "N-M" -> range
 * - "* /N" -> step (every N)
 */
function parseField(field: string, min: number, max: number): number[] {
  // Wildcard
  if (field === "*") {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  // Step: */N
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    if (isNaN(step) || step <= 0) return [min];
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  }

  // List: N,M,O
  if (field.includes(",")) {
    return field
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= min && n <= max);
  }

  // Range: N-M
  if (field.includes("-")) {
    const [start, end] = field.split("-").map((s) => parseInt(s.trim(), 10));
    if (isNaN(start) || isNaN(end)) return [min];
    const values: number[] = [];
    for (let i = start; i <= end; i++) {
      values.push(i);
    }
    return values;
  }

  // Single value
  const val = parseInt(field, 10);
  if (isNaN(val)) return [min];
  return [val];
}

/**
 * Parse the day-of-week cron field.
 * Returns null for wildcard (any day), or an array of day numbers (0-6, Sunday=0).
 */
function parseDayOfWeek(field: string): number[] | null {
  if (field === "*") return null; // Any day

  // Range: e.g., "1-5" for Mon-Fri
  if (field.includes("-")) {
    const [start, end] = field.split("-").map((s) => parseInt(s.trim(), 10));
    if (isNaN(start) || isNaN(end)) return null;
    const days: number[] = [];
    for (let i = start; i <= end; i++) {
      days.push(i % 7); // Normalize to 0-6
    }
    return days;
  }

  // List: e.g., "1,3,5"
  if (field.includes(",")) {
    return field
      .split(",")
      .map((s) => parseInt(s.trim(), 10) % 7)
      .filter((n) => !isNaN(n));
  }

  // Single day
  const val = parseInt(field, 10);
  if (isNaN(val)) return null;
  return [val % 7];
}
