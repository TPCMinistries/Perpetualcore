/**
 * Google Calendar Skill
 *
 * Manage Google Calendar events with AI-powered scheduling.
 * Leverages existing sync infrastructure in lib/calendar/google.ts
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import {
  syncGoogleCalendarEvents,
  getUpcomingEvents,
} from "@/lib/calendar/google";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Get user's calendar account and set up auth
 */
async function getCalendarClient(userId: string) {
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("calendar_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!account?.refresh_token) {
    return null;
  }

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
    access_token: account.access_token,
  });

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    account,
  };
}

/**
 * List upcoming calendar events
 */
async function listEvents(
  params: { days?: number; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const limit = params.limit || 10;
    const events = await getUpcomingEvents(context.userId, limit);

    if (events.length === 0) {
      return {
        success: true,
        data: { events: [], count: 0 },
        display: {
          type: "text",
          content: "No upcoming events found. Your calendar is clear!",
        },
      };
    }

    // Format events for display
    const formattedEvents = events.map((event: any) => {
      const startTime = new Date(event.start_time);
      const endTime = event.end_time ? new Date(event.end_time) : null;
      const durationMins = endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
        : 60;

      return {
        id: event.id,
        title: event.title,
        start: startTime.toISOString(),
        end: endTime?.toISOString(),
        location: event.location,
        meetingUrl: event.meeting_url,
        attendeeCount: event.attendees?.length || 0,
        duration: durationMins >= 60 ? `${Math.round(durationMins / 60)}h` : `${durationMins}m`,
        isAllDay: event.all_day,
      };
    });

    return {
      success: true,
      data: { events: formattedEvents, count: formattedEvents.length },
      display: {
        type: "table",
        content: {
          headers: ["Date", "Time", "Event", "Duration", "Location"],
          rows: formattedEvents.slice(0, 10).map((e: any) => {
            const date = new Date(e.start);
            return [
              date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
              e.isAllDay ? "All day" : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
              e.title.substring(0, 35) + (e.title.length > 35 ? "..." : ""),
              e.duration,
              e.location?.substring(0, 20) || (e.meetingUrl ? "Virtual" : "-"),
            ];
          }),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new calendar event
 */
async function createEvent(
  params: {
    title: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    location?: string;
    description?: string;
    attendees?: string[];
    addMeet?: boolean;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const client = await getCalendarClient(context.userId);
    if (!client) {
      return {
        success: false,
        error: "Google Calendar not connected. Please connect Google Calendar in settings.",
      };
    }

    const startDate = new Date(params.startTime);
    let endDate: Date;

    if (params.endTime) {
      endDate = new Date(params.endTime);
    } else if (params.duration) {
      endDate = new Date(startDate.getTime() + params.duration * 60 * 1000);
    } else {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
    }

    const eventData: any = {
      summary: params.title,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    if (params.description) {
      eventData.description = params.description;
    }

    if (params.location) {
      eventData.location = params.location;
    }

    if (params.attendees && params.attendees.length > 0) {
      eventData.attendees = params.attendees.map((email) => ({ email }));
    }

    if (params.addMeet) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `pc-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const response = await client.calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
      conferenceDataVersion: params.addMeet ? 1 : 0,
    });

    const event = response.data;

    // Sync to update local cache
    await syncGoogleCalendarEvents(context.userId, context.organizationId).catch(() => {});

    return {
      success: true,
      data: {
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        meetLink: event.hangoutLink,
        htmlLink: event.htmlLink,
      },
      display: {
        type: "card",
        content: {
          title: `Created: ${event.summary}`,
          description: `${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          fields: [
            { label: "Duration", value: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} minutes` },
            ...(event.hangoutLink ? [{ label: "Meet Link", value: event.hangoutLink }] : []),
            ...(params.attendees?.length ? [{ label: "Attendees", value: params.attendees.join(", ") }] : []),
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Find free time slots in the calendar
 */
async function findFreeTime(
  params: {
    date?: string;
    duration?: number;
    startHour?: number;
    endHour?: number;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const targetDate = params.date ? new Date(params.date) : new Date();
    const duration = params.duration || 30; // Default 30 min slots
    const startHour = params.startHour ?? 9;
    const endHour = params.endHour ?? 17;

    const supabase = await createClient();

    // Get events for the target day
    const dayStart = new Date(targetDate);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(endHour, 0, 0, 0);

    const { data: events } = await supabase
      .from("calendar_events")
      .select("start_time, end_time, title")
      .eq("user_id", context.userId)
      .gte("start_time", dayStart.toISOString())
      .lte("end_time", dayEnd.toISOString())
      .order("start_time", { ascending: true });

    // Find free slots
    const freeSlots: Array<{ start: Date; end: Date }> = [];
    let currentTime = dayStart;

    for (const event of events || []) {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      // Gap before this event?
      if (currentTime < eventStart) {
        const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
        if (gapMinutes >= duration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: eventStart,
          });
        }
      }

      // Move current time to end of this event
      if (eventEnd > currentTime) {
        currentTime = eventEnd;
      }
    }

    // Gap after last event?
    if (currentTime < dayEnd) {
      const gapMinutes = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (gapMinutes >= duration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: dayEnd,
        });
      }
    }

    if (freeSlots.length === 0) {
      return {
        success: true,
        data: { freeSlots: [], date: targetDate.toISOString() },
        display: {
          type: "text",
          content: `No free slots of ${duration}+ minutes found on ${targetDate.toLocaleDateString()} between ${startHour}:00 and ${endHour}:00.`,
        },
      };
    }

    const formattedSlots = freeSlots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      duration: Math.round((slot.end.getTime() - slot.start.getTime()) / (1000 * 60)),
    }));

    return {
      success: true,
      data: { freeSlots: formattedSlots, date: targetDate.toISOString() },
      display: {
        type: "table",
        content: {
          headers: ["Start", "End", "Duration"],
          rows: formattedSlots.map((slot) => [
            new Date(slot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            new Date(slot.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            `${slot.duration} min`,
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Smart meeting scheduler - finds best time and creates event
 */
async function scheduleMeeting(
  params: {
    title: string;
    duration: number;
    preferredDate?: string;
    attendees?: string[];
    description?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    // First find free time
    const freeTimeResult = await findFreeTime(
      {
        date: params.preferredDate,
        duration: params.duration,
      },
      context
    );

    if (!freeTimeResult.success || !freeTimeResult.data?.freeSlots?.length) {
      return {
        success: false,
        error: "No available time slots found for the requested duration. Try a different date.",
      };
    }

    // Use first available slot
    const slot = freeTimeResult.data.freeSlots[0];

    // Create the event
    return await createEvent(
      {
        title: params.title,
        startTime: slot.start,
        duration: params.duration,
        attendees: params.attendees,
        description: params.description,
        addMeet: true, // Auto-add Google Meet for meetings
      },
      context
    );
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync calendar events from Google
 */
async function syncCalendar(params: {}, context: ToolContext): Promise<ToolResult> {
  try {
    const result = await syncGoogleCalendarEvents(context.userId, context.organizationId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to sync calendar",
      };
    }

    return {
      success: true,
      data: { eventsCount: result.eventsCount },
      display: {
        type: "text",
        content: `Synced ${result.eventsCount} events from Google Calendar.`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get today's schedule summary
 */
async function getTodaySchedule(params: {}, context: ToolContext): Promise<ToolResult> {
  try {
    const supabase = await createClient();

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: events } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", context.userId)
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time", { ascending: true });

    const now = new Date();
    const upcoming = (events || []).filter((e) => new Date(e.start_time) > now);
    const next = upcoming[0];

    const summary = {
      total: events?.length || 0,
      remaining: upcoming.length,
      nextEvent: next
        ? {
            title: next.title,
            time: new Date(next.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            minutesUntil: Math.round((new Date(next.start_time).getTime() - now.getTime()) / (1000 * 60)),
          }
        : null,
    };

    let displayText = `Today's schedule: ${summary.total} events total, ${summary.remaining} remaining.`;
    if (summary.nextEvent) {
      displayText += `\n\nNext up: "${summary.nextEvent.title}" at ${summary.nextEvent.time} (in ${summary.nextEvent.minutesUntil} min)`;
    }

    return {
      success: true,
      data: { summary, events: events || [] },
      display: {
        type: "text",
        content: displayText,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const googleCalendarSkill: Skill = {
  id: "google-calendar",
  name: "Google Calendar",
  description: "Manage your Google Calendar - view events, schedule meetings, find free time",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "productivity",
  tags: ["calendar", "google", "scheduling", "events", "meetings"],

  icon: "📅",
  color: "#4285F4",

  tier: "free",
  isBuiltIn: true,

  requiredIntegrations: ["google_calendar"],

  tools: [
    {
      name: "list_events",
      description: "List upcoming calendar events",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of days to look ahead (default: 7)",
          },
          limit: {
            type: "number",
            description: "Maximum number of events to return (default: 10)",
          },
        },
      },
      execute: listEvents,
    },
    {
      name: "create_event",
      description: "Create a new calendar event",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title/name",
          },
          startTime: {
            type: "string",
            description: "Start time in ISO format or natural language (e.g., '2024-01-15T10:00:00' or 'tomorrow at 2pm')",
          },
          endTime: {
            type: "string",
            description: "End time in ISO format (optional, use duration instead)",
          },
          duration: {
            type: "number",
            description: "Duration in minutes (default: 60)",
          },
          location: {
            type: "string",
            description: "Event location (optional)",
          },
          description: {
            type: "string",
            description: "Event description (optional)",
          },
          attendees: {
            type: "array",
            description: "Email addresses of attendees (optional)",
          },
          addMeet: {
            type: "boolean",
            description: "Add Google Meet video call (default: false)",
          },
        },
        required: ["title", "startTime"],
      },
      execute: createEvent,
    },
    {
      name: "find_free_time",
      description: "Find available time slots in your calendar",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date to check (ISO format, default: today)",
          },
          duration: {
            type: "number",
            description: "Minimum slot duration in minutes (default: 30)",
          },
          startHour: {
            type: "number",
            description: "Start of working hours (default: 9)",
          },
          endHour: {
            type: "number",
            description: "End of working hours (default: 17)",
          },
        },
      },
      execute: findFreeTime,
    },
    {
      name: "schedule_meeting",
      description: "Smart meeting scheduler - finds the next available slot and creates a meeting with Google Meet",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Meeting title",
          },
          duration: {
            type: "number",
            description: "Meeting duration in minutes",
          },
          preferredDate: {
            type: "string",
            description: "Preferred date (ISO format, default: today)",
          },
          attendees: {
            type: "array",
            description: "Email addresses of attendees",
          },
          description: {
            type: "string",
            description: "Meeting description",
          },
        },
        required: ["title", "duration"],
      },
      execute: scheduleMeeting,
    },
    {
      name: "sync",
      description: "Sync Google Calendar events to Perpetual Core",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: syncCalendar,
    },
    {
      name: "today",
      description: "Get a summary of today's schedule",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: getTodaySchedule,
    },
  ],

  systemPrompt: `You have access to Google Calendar. When users ask about their schedule:
- Use "today" to get a quick summary of today's events
- Use "list_events" to see upcoming events
- Use "find_free_time" to find available slots before scheduling
- Use "create_event" or "schedule_meeting" to add events (schedule_meeting auto-adds Google Meet)
- Use "sync" to refresh calendar data if events seem stale

For meetings with others, always suggest "schedule_meeting" as it automatically finds free time and adds video conferencing.
When creating events, confirm the time zone matches the user's expectation.`,
};
