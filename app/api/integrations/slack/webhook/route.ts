/**
 * Slack Events Webhook
 * Receives events from Slack (messages, mentions, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySlackSignature, sendSlackMessage, getSlackCredentials } from "@/lib/slack/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Slack sends URL verification challenge on setup
interface SlackUrlVerification {
  type: "url_verification";
  challenge: string;
  token: string;
}

// Slack event callback
interface SlackEventCallback {
  type: "event_callback";
  token: string;
  team_id: string;
  event: {
    type: string;
    user?: string;
    text?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
    bot_id?: string;
  };
}

type SlackWebhookPayload = SlackUrlVerification | SlackEventCallback;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload: SlackWebhookPayload = JSON.parse(rawBody);

    // Verify request signature (skip in development if no signing secret)
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (signingSecret) {
      const signature = request.headers.get("x-slack-signature") || "";
      const timestamp = request.headers.get("x-slack-request-timestamp") || "";

      if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
        console.error("Invalid Slack signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Handle URL verification challenge (sent when setting up webhook)
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle event callbacks
    if (payload.type === "event_callback") {
      const event = payload.event;
      const teamId = payload.team_id;

      // Ignore bot messages to prevent loops
      if (event.bot_id) {
        return NextResponse.json({ ok: true });
      }

      // Handle message events
      if (event.type === "message" || event.type === "app_mention") {
        await handleSlackMessage(teamId, event);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Handle incoming Slack messages
 */
async function handleSlackMessage(
  teamId: string,
  event: {
    type: string;
    user?: string;
    text?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
  }
) {
  const supabase = createAdminClient();

  // Find the user integration for this team
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("user_id, access_token, metadata")
    .eq("provider", "slack")
    .eq("is_active", true)
    .filter("metadata->team_id", "eq", teamId)
    .single();

  if (!integration) {
    console.log("No integration found for Slack team:", teamId);
    return;
  }

  // Store the message
  await supabase.from("slack_messages").insert({
    user_id: integration.user_id,
    team_id: teamId,
    channel_id: event.channel,
    slack_user_id: event.user,
    message_text: event.text,
    message_ts: event.ts,
    thread_ts: event.thread_ts,
    direction: "inbound",
    created_at: new Date().toISOString(),
  });

  // Check if this is a direct message or mention that needs AI response
  const isDirectMessage = event.channel?.startsWith("D"); // DMs start with D
  const isMention = event.type === "app_mention";

  if (isDirectMessage || isMention) {
    // Generate AI response
    const aiResponse = await generateAIResponse(
      integration.user_id,
      event.text || "",
      event.channel || ""
    );

    if (aiResponse) {
      // Send response
      await sendSlackMessage(integration.access_token, {
        channel: event.channel || "",
        text: aiResponse,
        thread_ts: event.thread_ts || event.ts, // Reply in thread
      });

      // Store outbound message
      await supabase.from("slack_messages").insert({
        user_id: integration.user_id,
        team_id: teamId,
        channel_id: event.channel,
        message_text: aiResponse,
        direction: "outbound",
        is_ai_response: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  console.log(`Processed Slack message from team ${teamId}`);
}

/**
 * Generate AI response for Slack message
 */
async function generateAIResponse(
  userId: string,
  message: string,
  channel: string
): Promise<string | null> {
  try {
    // Use GPT-4o-mini for fast responses
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant integrated with Slack. Keep responses concise and actionable.
You are part of Perpetual Core, an AI operating system. Be professional but friendly.
If the user asks about tasks, calendar, or documents, let them know they can access more details in the Perpetual Core dashboard.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    return "I'm having trouble processing your request right now. Please try again or check the Perpetual Core dashboard.";
  }
}
