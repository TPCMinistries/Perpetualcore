/**
 * Notification Preferences API
 * GET - Get user's notification/briefing preferences
 * PUT - Update preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSlackChannels, getSlackCredentials } from "@/lib/slack/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface NotificationPreferences {
  // Delivery channel
  preferred_channel: "slack" | "telegram" | "whatsapp" | "email" | "in_app";

  // Briefing settings
  briefing_enabled: boolean;
  briefing_time: string; // HH:mm format
  briefing_style: "concise" | "detailed" | "bullets";

  // Content settings
  include_weather: boolean;
  include_quote: boolean;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: number; // 0-23
  quiet_hours_end: number; // 0-23

  // Nudge settings
  nudge_frequency: "aggressive" | "balanced" | "minimal";

  // Timezone
  timezone: string;
}

/**
 * GET /api/user/notification-preferences
 * Returns user's current notification preferences and connected channels
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select(`
        notification_preferences,
        telegram_chat_id,
        whatsapp_number,
        slack_channel_id,
        email
      `)
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const prefs = (profile.notification_preferences as NotificationPreferences) || {};

    // Check connected channels
    const connectedChannels: Record<string, boolean> = {
      telegram: !!profile.telegram_chat_id,
      whatsapp: !!profile.whatsapp_number,
      slack: !!profile.slack_channel_id,
      email: !!profile.email,
      in_app: true, // Always available
    };

    // Get Slack channels if connected
    let slackChannels: { id: string; name: string }[] = [];
    if (connectedChannels.slack) {
      const credentials = await getSlackCredentials(user.id);
      if (credentials) {
        const channels = await listSlackChannels(credentials.accessToken);
        slackChannels = channels.map(c => ({ id: c.id, name: c.name }));
      }
    }

    // Default preferences
    const defaultPrefs: NotificationPreferences = {
      preferred_channel: "in_app",
      briefing_enabled: true,
      briefing_time: "08:00",
      briefing_style: "concise",
      include_weather: true,
      include_quote: true,
      quiet_hours_enabled: true,
      quiet_hours_start: 22,
      quiet_hours_end: 7,
      nudge_frequency: "balanced",
      timezone: "America/New_York",
    };

    return NextResponse.json({
      preferences: { ...defaultPrefs, ...prefs },
      connectedChannels,
      slackChannels,
      currentSettings: {
        telegram_chat_id: profile.telegram_chat_id,
        whatsapp_number: profile.whatsapp_number,
        slack_channel_id: profile.slack_channel_id,
        email: profile.email,
      },
    });
  } catch (error: any) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/notification-preferences
 * Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      preferences,
      slack_channel_id,
      telegram_chat_id,
      whatsapp_number,
    } = body;

    // Build update object
    const updates: Record<string, any> = {};

    // Update notification_preferences JSONB
    if (preferences) {
      // Validate preferences
      const validChannels = ["slack", "telegram", "whatsapp", "email", "in_app"];
      if (preferences.preferred_channel && !validChannels.includes(preferences.preferred_channel)) {
        return NextResponse.json(
          { error: "Invalid preferred_channel" },
          { status: 400 }
        );
      }

      // Validate briefing_time format
      if (preferences.briefing_time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(preferences.briefing_time)) {
          return NextResponse.json(
            { error: "Invalid briefing_time format. Use HH:mm" },
            { status: 400 }
          );
        }
      }

      // Get existing preferences and merge
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single();

      const currentPrefs = (currentProfile?.notification_preferences as Record<string, any>) || {};
      updates.notification_preferences = { ...currentPrefs, ...preferences };
    }

    // Update channel-specific IDs
    if (slack_channel_id !== undefined) {
      updates.slack_channel_id = slack_channel_id;
    }
    if (telegram_chat_id !== undefined) {
      updates.telegram_chat_id = telegram_chat_id;
    }
    if (whatsapp_number !== undefined) {
      updates.whatsapp_number = whatsapp_number;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update preferences" },
          { status: 500 }
        );
      }
    }

    // Return updated preferences
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select(`
        notification_preferences,
        telegram_chat_id,
        whatsapp_number,
        slack_channel_id
      `)
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      preferences: updatedProfile?.notification_preferences || {},
      currentSettings: {
        telegram_chat_id: updatedProfile?.telegram_chat_id,
        whatsapp_number: updatedProfile?.whatsapp_number,
        slack_channel_id: updatedProfile?.slack_channel_id,
      },
    });
  } catch (error: any) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences: " + error.message },
      { status: 500 }
    );
  }
}
