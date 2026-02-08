/**
 * Calendar Checker
 *
 * Checks upcoming calendar events for the next 24 hours.
 * Flags events starting soon, scheduling conflicts, and preparation needs.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { CheckResult, CheckItem } from "../types";

/**
 * Check upcoming calendar events for actionable items.
 *
 * @param userId - The Perpetual Core user ID
 * @returns CheckResult with categorized calendar items
 */
export async function checkCalendar(userId: string): Promise<CheckResult> {
  const supabase = createAdminClient();
  const items: CheckItem[] = [];

  try {
    // Check if user has Google Calendar credentials
    const { data: credentials } = await supabase
      .from("user_integrations")
      .select("access_token, refresh_token, metadata")
      .eq("user_id", userId)
      .eq("provider", "google_calendar")
      .eq("is_active", true)
      .single();

    if (!credentials) {
      return {
        type: "calendar",
        items: [],
        summary: "Google Calendar not connected. Connect in Settings > Integrations to enable calendar monitoring.",
        urgency: "low",
      };
    }

    // Fetch events for the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await fetchUpcomingEvents(
      credentials.access_token,
      now,
      tomorrow
    );

    if (events.length === 0) {
      return {
        type: "calendar",
        items: [],
        summary: "No upcoming events in the next 24 hours.",
        urgency: "low",
      };
    }

    // Analyze each event
    for (const event of events) {
      const minutesUntil = Math.floor(
        (new Date(event.start).getTime() - now.getTime()) / (1000 * 60)
      );

      let urgency: CheckItem["urgency"] = "low";
      let category = "upcoming_event";

      // Flag events starting within the next hour
      if (minutesUntil <= 60 && minutesUntil > 0) {
        urgency = "high";
        category = "event_soon";
      } else if (minutesUntil <= 15 && minutesUntil > 0) {
        urgency = "critical";
        category = "event_imminent";
      } else if (minutesUntil <= 180) {
        urgency = "medium";
        category = "event_approaching";
      }

      const timeLabel = minutesUntil <= 0
        ? "happening now"
        : minutesUntil < 60
          ? `in ${minutesUntil} minutes`
          : `in ${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`;

      items.push({
        title: `${event.summary} (${timeLabel})`,
        description: buildEventDescription(event),
        urgency,
        category,
        metadata: {
          eventId: event.id,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          location: event.location,
          hangoutLink: event.hangoutLink,
          minutesUntil,
        },
      });
    }

    // Check for scheduling conflicts
    const conflicts = detectConflicts(events);
    for (const conflict of conflicts) {
      items.push({
        title: `Scheduling conflict: ${conflict.event1} overlaps with ${conflict.event2}`,
        description: `${conflict.event1} (${conflict.start1}) and ${conflict.event2} (${conflict.start2}) overlap.`,
        urgency: "high",
        category: "scheduling_conflict",
        metadata: { conflict },
      });
    }

    // Determine overall urgency
    const hasUrgent = items.some(
      (i) => i.urgency === "high" || i.urgency === "critical"
    );
    const overallUrgency = hasUrgent ? "high" : "medium";

    const soonCount = items.filter(
      (i) => i.category === "event_soon" || i.category === "event_imminent"
    ).length;
    const conflictCount = conflicts.length;

    let summary = `${events.length} event(s) in the next 24 hours.`;
    if (soonCount > 0) {
      summary += ` ${soonCount} starting within the hour.`;
    }
    if (conflictCount > 0) {
      summary += ` ${conflictCount} scheduling conflict(s) detected.`;
    }

    return {
      type: "calendar",
      items,
      summary,
      urgency: overallUrgency,
    };
  } catch (error: any) {
    console.error("[CalendarChecker] Error checking calendar:", error);
    return {
      type: "calendar",
      items: [],
      summary: `Error checking calendar: ${error.message}`,
      urgency: "low",
    };
  }
}

/**
 * Fetch upcoming events from Google Calendar API.
 */
async function fetchUpcomingEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<
  Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
    hangoutLink?: string;
    description?: string;
  }>
> {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "20",
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      console.error("[CalendarChecker] Google Calendar API error:", response.status);
      return [];
    }

    const data = await response.json();
    const events = data.items || [];

    return events.map((event: any) => ({
      id: event.id,
      summary: event.summary || "(No title)",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      location: event.location,
      attendees: event.attendees?.map((a: any) => a.email) || [],
      hangoutLink: event.hangoutLink,
      description: event.description,
    }));
  } catch (error) {
    console.error("[CalendarChecker] Error fetching events:", error);
    return [];
  }
}

/**
 * Build a human-readable description of a calendar event.
 */
function buildEventDescription(event: {
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  hangoutLink?: string;
}): string {
  const parts: string[] = [];

  const start = new Date(event.start);
  const end = new Date(event.end);
  const durationMinutes = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60)
  );

  parts.push(
    `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${durationMinutes}min)`
  );

  if (event.location) {
    parts.push(`Location: ${event.location}`);
  }

  if (event.hangoutLink) {
    parts.push(`Meet: ${event.hangoutLink}`);
  }

  if (event.attendees && event.attendees.length > 0) {
    const attendeeList =
      event.attendees.length <= 3
        ? event.attendees.join(", ")
        : `${event.attendees.slice(0, 3).join(", ")} +${event.attendees.length - 3} more`;
    parts.push(`Attendees: ${attendeeList}`);
  }

  return parts.join(" | ");
}

/**
 * Detect scheduling conflicts between events.
 */
function detectConflicts(
  events: Array<{ id: string; summary: string; start: string; end: string }>
): Array<{
  event1: string;
  event2: string;
  start1: string;
  start2: string;
}> {
  const conflicts: Array<{
    event1: string;
    event2: string;
    start1: string;
    start2: string;
  }> = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const start1 = new Date(events[i].start).getTime();
      const end1 = new Date(events[i].end).getTime();
      const start2 = new Date(events[j].start).getTime();
      const end2 = new Date(events[j].end).getTime();

      // Check for overlap
      if (start1 < end2 && start2 < end1) {
        conflicts.push({
          event1: events[i].summary,
          event2: events[j].summary,
          start1: events[i].start,
          start2: events[j].start,
        });
      }
    }
  }

  return conflicts;
}
