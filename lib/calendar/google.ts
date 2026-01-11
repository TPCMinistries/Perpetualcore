import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

// Initialize Google Calendar API
const CALENDAR_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
    : "https://perpetualcore.com/api/calendar/google/callback");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  CALENDAR_REDIRECT_URI
);

/**
 * Generate Google OAuth URL for calendar access
 */
export function getGoogleAuthUrl(userId: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: userId, // Pass user ID to link account after OAuth
    prompt: "consent", // Force consent to get refresh token
  });

  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Sync Google Calendar events for a user
 */
export async function syncGoogleCalendarEvents(
  userId: string,
  organizationId: string
): Promise<{ success: boolean; eventsCount: number; error?: string }> {
  try {
    const supabase = await createClient();

    // Get calendar account
    const { data: account } = await supabase
      .from("calendar_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    if (!account || !account.refresh_token) {
      return { success: false, eventsCount: 0, error: "No calendar account found" };
    }

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: account.refresh_token,
      access_token: account.access_token,
    });

    // Initialize Google Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get events from primary calendar for next 30 days
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const events = response.data.items || [];

    // Store events in database
    let syncedCount = 0;
    for (const event of events) {
      if (!event.start || !event.id) continue;

      const eventData = {
        calendar_account_id: account.id,
        organization_id: organizationId,
        user_id: userId,
        provider_event_id: event.id,
        provider: "google",
        calendar_id: "primary",
        title: event.summary || "Untitled Event",
        description: event.description || null,
        location: event.location || null,
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end?.dateTime || event.end?.date,
        all_day: !event.start.dateTime,
        timezone: event.start.timeZone || null,
        organizer_email: event.organizer?.email || null,
        organizer_name: event.organizer?.displayName || null,
        attendees: event.attendees || [],
        meeting_url: event.hangoutLink || extractMeetingLink(event.description),
        conference_data: event.conferenceData || null,
        status: event.status || "confirmed",
        response_status: event.attendees?.find((a) => a.email === account.provider_account_id)
          ?.responseStatus || "accepted",
        is_recurring: !!event.recurringEventId,
        recurrence_rule: event.recurrence?.[0] || null,
        raw_data: event,
      };

      // Upsert event
      const { error } = await supabase
        .from("calendar_events")
        .upsert(eventData, {
          onConflict: "calendar_account_id,provider_event_id",
        });

      if (!error) syncedCount++;
    }

    // Update last sync time
    await supabase
      .from("calendar_accounts")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", account.id);

    return { success: true, eventsCount: syncedCount };
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    return {
      success: false,
      eventsCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get upcoming events for a user
 */
export async function getUpcomingEvents(userId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);

  return events || [];
}

/**
 * Extract meeting links from description text
 */
function extractMeetingLink(description?: string | null): string | null {
  if (!description) return null;

  // Zoom link
  const zoomMatch = description.match(/https:\/\/[a-z0-9.-]*zoom\.us\/[^\s]+/i);
  if (zoomMatch) return zoomMatch[0];

  // Google Meet link
  const meetMatch = description.match(/https:\/\/meet\.google\.com\/[^\s]+/i);
  if (meetMatch) return meetMatch[0];

  // Microsoft Teams link
  const teamsMatch = description.match(/https:\/\/teams\.microsoft\.com\/[^\s]+/i);
  if (teamsMatch) return teamsMatch[0];

  return null;
}
