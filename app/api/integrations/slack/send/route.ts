/**
 * Send Slack Message API
 * Allows sending messages to Slack channels or DMs
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSlackCredentials, sendSlackMessage, openSlackDM } from "@/lib/slack/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channel, text, blocks, thread_ts, user_id: targetUserId } = body;

    if (!text && !blocks) {
      return NextResponse.json(
        { error: "Either text or blocks is required" },
        { status: 400 }
      );
    }

    // Get user's Slack credentials
    const credentials = await getSlackCredentials(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: "Slack not connected. Please connect Slack in integrations." },
        { status: 400 }
      );
    }

    // If targeting a user, open DM channel first
    let targetChannel = channel;
    if (targetUserId && !channel) {
      const dmChannel = await openSlackDM(credentials.accessToken, targetUserId);
      if (!dmChannel) {
        return NextResponse.json(
          { error: "Failed to open DM with user" },
          { status: 400 }
        );
      }
      targetChannel = dmChannel;
    }

    if (!targetChannel) {
      return NextResponse.json(
        { error: "Either channel or user_id is required" },
        { status: 400 }
      );
    }

    // Send the message
    const result = await sendSlackMessage(credentials.accessToken, {
      channel: targetChannel,
      text: text || "Message from Perpetual Core",
      blocks,
      thread_ts,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }

    // Log the message
    const { error: logError } = await supabase.from("slack_messages").insert({
      user_id: user.id,
      team_id: credentials.teamId,
      channel_id: targetChannel,
      message_text: text,
      message_ts: result.ts,
      direction: "outbound",
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error("Failed to log Slack message:", logError);
      // Don't fail the request, message was sent
    }

    return NextResponse.json({
      ok: true,
      ts: result.ts,
      channel: targetChannel,
    });
  } catch (error) {
    console.error("Send Slack message error:", error);
    return NextResponse.json(
      { error: "Failed to send Slack message" },
      { status: 500 }
    );
  }
}
