/**
 * Activity Feed Tracker
 *
 * Tracks all agent activity events to the agent_activity_feed table.
 * Uses admin client since this runs in background contexts
 * (webhooks, cron jobs, background processing).
 */

import { createAdminClient } from "@/lib/supabase/server";
import { ActivityEvent, ActivityEventType } from "./types";

/**
 * Track a single activity event.
 * Fire-and-forget by default -- callers should NOT await this in critical paths.
 *
 * @param event - The activity event to track (id and createdAt are auto-generated)
 */
export async function trackActivity(
  event: Omit<ActivityEvent, "id" | "createdAt">
): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from("agent_activity_feed").insert({
      user_id: event.userId,
      event_type: event.eventType,
      title: event.title,
      description: event.description || null,
      channel: event.channel || null,
      metadata: event.metadata || {},
    });
  } catch (error) {
    // Log but never throw -- activity tracking should not break primary flows
    console.error("[ActivityTracker] Failed to track event:", error);
  }
}

/**
 * Track multiple activity events in a single batch insert.
 *
 * @param events - Array of activity events to track
 */
export async function trackActivities(
  events: Omit<ActivityEvent, "id" | "createdAt">[]
): Promise<void> {
  if (events.length === 0) return;

  try {
    const supabase = createAdminClient();

    const rows = events.map((event) => ({
      user_id: event.userId,
      event_type: event.eventType,
      title: event.title,
      description: event.description || null,
      channel: event.channel || null,
      metadata: event.metadata || {},
    }));

    await supabase.from("agent_activity_feed").insert(rows);
  } catch (error) {
    console.error("[ActivityTracker] Failed to track batch events:", error);
  }
}

/**
 * Get recent activity events for a user with pagination.
 *
 * @param userId - The user to get activity for
 * @param options - Pagination and filtering options
 * @returns Paginated activity events
 */
export async function getActivity(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    eventType?: ActivityEventType;
  }
): Promise<{
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 20, 100);
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from("agent_activity_feed")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.eventType) {
    query = query.eq("event_type", options.eventType);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[ActivityTracker] Failed to get activity:", error);
    return { events: [], total: 0, page, limit };
  }

  const events: ActivityEvent[] = (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    metadata: row.metadata || {},
    channel: row.channel,
    createdAt: row.created_at,
  }));

  return {
    events,
    total: count || 0,
    page,
    limit,
  };
}
