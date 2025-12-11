/**
 * Google Calendar Integration
 *
 * Provides functions to fetch and interact with Google Calendar using stored OAuth tokens.
 */

import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
  isAllDay: boolean;
  status: "confirmed" | "tentative" | "cancelled";
  attendees: CalendarAttendee[];
  organizer: {
    email: string;
    displayName: string | null;
    self: boolean;
  } | null;
  htmlLink: string | null;
  recurringEventId: string | null;
}

export interface CalendarAttendee {
  email: string;
  displayName: string | null;
  responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
  self: boolean;
}

interface CalendarCredentials {
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
}

/**
 * Get Google Calendar OAuth client for a user
 */
async function getCalendarClient(userId: string) {
  const supabase = await createClient();

  // Get user's Google Calendar integration
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("integration_id", "google_calendar")
    .eq("is_connected", true)
    .single();

  if (error || !integration) {
    logger.warn("Google Calendar not connected for user", { userId });
    return null;
  }

  const credentials = integration as CalendarCredentials;

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });

  // Check if token needs refresh
  const expiresAt = credentials.token_expires_at
    ? new Date(credentials.token_expires_at).getTime()
    : 0;

  if (expiresAt && expiresAt < Date.now() + 5 * 60 * 1000) {
    // Token expires in less than 5 minutes, refresh it
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      await supabase
        .from("user_integrations")
        .update({
          access_token: newCredentials.access_token,
          token_expires_at: newCredentials.expiry_date
            ? new Date(newCredentials.expiry_date).toISOString()
            : null,
        })
        .eq("user_id", userId)
        .eq("integration_id", "google_calendar");

      logger.info("Refreshed Google Calendar token", { userId });
    } catch (refreshError) {
      logger.error("Failed to refresh Google Calendar token", { userId, error: refreshError });
      return null;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Fetch upcoming events from user's calendars
 */
export async function fetchUpcomingEvents(
  userId: string,
  options: {
    maxResults?: number;
    timeMin?: Date;
    timeMax?: Date;
    calendarId?: string;
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    return [];
  }

  const {
    maxResults = 20,
    timeMin = new Date(),
    timeMax,
    calendarId = "primary",
  } = options;

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax?.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const calendarEvents: CalendarEvent[] = events.map((event) => ({
      id: event.id || "",
      calendarId,
      summary: event.summary || "(No title)",
      description: event.description || null,
      location: event.location || null,
      start: parseEventDateTime(event.start),
      end: parseEventDateTime(event.end),
      isAllDay: !!event.start?.date,
      status: (event.status as CalendarEvent["status"]) || "confirmed",
      attendees: (event.attendees || []).map((attendee) => ({
        email: attendee.email || "",
        displayName: attendee.displayName || null,
        responseStatus: (attendee.responseStatus as CalendarAttendee["responseStatus"]) || "needsAction",
        self: attendee.self || false,
      })),
      organizer: event.organizer
        ? {
            email: event.organizer.email || "",
            displayName: event.organizer.displayName || null,
            self: event.organizer.self || false,
          }
        : null,
      htmlLink: event.htmlLink || null,
      recurringEventId: event.recurringEventId || null,
    }));

    logger.info("Fetched calendar events", { userId, count: calendarEvents.length });
    return calendarEvents;
  } catch (error) {
    logger.error("Failed to fetch calendar events", { userId, error });
    return [];
  }
}

/**
 * Parse event date/time from Google Calendar format
 */
function parseEventDateTime(dateTime: { date?: string | null; dateTime?: string | null } | undefined): Date {
  if (!dateTime) {
    return new Date();
  }
  if (dateTime.dateTime) {
    return new Date(dateTime.dateTime);
  }
  if (dateTime.date) {
    return new Date(dateTime.date);
  }
  return new Date();
}

/**
 * Fetch events happening today
 */
export async function fetchTodayEvents(userId: string): Promise<CalendarEvent[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return fetchUpcomingEvents(userId, {
    timeMin: startOfDay,
    timeMax: endOfDay,
    maxResults: 50,
  });
}

/**
 * Fetch events for the next N days
 */
export async function fetchEventsForDays(
  userId: string,
  days: number = 7
): Promise<CalendarEvent[]> {
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + days);

  return fetchUpcomingEvents(userId, {
    timeMax,
    maxResults: 100,
  });
}

/**
 * Get events that need preparation (meetings with attendees)
 */
export async function fetchMeetingsNeedingPrep(
  userId: string,
  hoursAhead: number = 24
): Promise<CalendarEvent[]> {
  const timeMax = new Date();
  timeMax.setTime(timeMax.getTime() + hoursAhead * 60 * 60 * 1000);

  const events = await fetchUpcomingEvents(userId, {
    timeMax,
    maxResults: 50,
  });

  // Filter to meetings with attendees
  return events.filter(
    (event) =>
      event.attendees.length > 0 &&
      event.status === "confirmed"
  );
}

/**
 * Check if Google Calendar is connected for a user
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_integrations")
    .select("is_connected")
    .eq("user_id", userId)
    .eq("integration_id", "google_calendar")
    .single();

  return data?.is_connected === true;
}

/**
 * Get list of user's calendars
 */
export async function fetchCalendarList(
  userId: string
): Promise<{ id: string; summary: string; primary: boolean }[]> {
  const calendar = await getCalendarClient(userId);

  if (!calendar) {
    return [];
  }

  try {
    const response = await calendar.calendarList.list();
    const calendars = response.data.items || [];

    return calendars.map((cal) => ({
      id: cal.id || "",
      summary: cal.summary || "(Unnamed calendar)",
      primary: cal.primary || false,
    }));
  } catch (error) {
    logger.error("Failed to fetch calendar list", { userId, error });
    return [];
  }
}

export default {
  fetchUpcomingEvents,
  fetchTodayEvents,
  fetchEventsForDays,
  fetchMeetingsNeedingPrep,
  isCalendarConnected,
  fetchCalendarList,
};
