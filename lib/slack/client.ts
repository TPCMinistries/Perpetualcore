/**
 * Slack Client Service
 * Handles sending messages and interacting with Slack API
 */

import { WebClient } from "@slack/web-api";
import { createAdminClient } from "@/lib/supabase/server";

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  thread_ts?: string;
}

export interface SlackUser {
  userId: string;
  accessToken: string;
  teamId?: string;
  teamName?: string;
}

/**
 * Get Slack credentials for a user
 */
export async function getSlackCredentials(userId: string): Promise<SlackUser | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_integrations")
    .select("access_token, metadata")
    .eq("user_id", userId)
    .eq("provider", "slack")
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Failed to get Slack credentials:", error);
    return null;
  }

  return {
    userId,
    accessToken: data.access_token,
    teamId: data.metadata?.team_id,
    teamName: data.metadata?.team_name,
  };
}

/**
 * Create a Slack WebClient for a user
 */
export function createSlackClient(accessToken: string): WebClient {
  return new WebClient(accessToken);
}

/**
 * Send a message to a Slack channel or DM
 */
export async function sendSlackMessage(
  accessToken: string,
  message: SlackMessage
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  try {
    const client = createSlackClient(accessToken);

    const result = await client.chat.postMessage({
      channel: message.channel,
      text: message.text,
      blocks: message.blocks,
      thread_ts: message.thread_ts,
    });

    return {
      ok: result.ok || false,
      ts: result.ts,
    };
  } catch (error: any) {
    console.error("Failed to send Slack message:", error);
    return {
      ok: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * List channels the bot has access to
 */
export async function listSlackChannels(
  accessToken: string
): Promise<{ id: string; name: string; is_member: boolean }[]> {
  try {
    const client = createSlackClient(accessToken);

    const result = await client.conversations.list({
      types: "public_channel,private_channel",
      limit: 100,
    });

    if (!result.ok || !result.channels) {
      return [];
    }

    return result.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      is_member: channel.is_member || false,
    }));
  } catch (error) {
    console.error("Failed to list Slack channels:", error);
    return [];
  }
}

/**
 * Get Slack user info
 */
export async function getSlackUserInfo(
  accessToken: string,
  slackUserId: string
): Promise<any | null> {
  try {
    const client = createSlackClient(accessToken);

    const result = await client.users.info({
      user: slackUserId,
    });

    if (!result.ok || !result.user) {
      return null;
    }

    return result.user;
  } catch (error) {
    console.error("Failed to get Slack user info:", error);
    return null;
  }
}

/**
 * Open a DM channel with a user
 */
export async function openSlackDM(
  accessToken: string,
  slackUserId: string
): Promise<string | null> {
  try {
    const client = createSlackClient(accessToken);

    const result = await client.conversations.open({
      users: slackUserId,
    });

    if (!result.ok || !result.channel) {
      return null;
    }

    return result.channel.id;
  } catch (error) {
    console.error("Failed to open Slack DM:", error);
    return null;
  }
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const crypto = require("crypto");

  // Check timestamp (prevent replay attacks - 5 minute window)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = "v0=" + crypto
    .createHmac("sha256", signingSecret)
    .update(sigBasestring)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

/**
 * Format a briefing message for Slack
 */
export function formatBriefingForSlack(briefing: {
  summary: string;
  tasks: { title: string; priority: string; due?: string }[];
  events: { title: string; time: string }[];
  highlights: string[];
}): any[] {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Good morning! Here's your daily briefing",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: briefing.summary,
      },
    },
    {
      type: "divider",
    },
  ];

  // Add tasks
  if (briefing.tasks.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Tasks for Today*\n" + briefing.tasks
          .slice(0, 5)
          .map(t => `• ${t.priority === 'high' ? ':red_circle:' : ':large_blue_circle:'} ${t.title}${t.due ? ` (due ${t.due})` : ''}`)
          .join("\n"),
      },
    });
  }

  // Add events
  if (briefing.events.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Today's Schedule*\n" + briefing.events
          .slice(0, 5)
          .map(e => `• :calendar: ${e.time} - ${e.title}`)
          .join("\n"),
      },
    });
  }

  // Add highlights
  if (briefing.highlights.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Key Highlights*\n" + briefing.highlights
          .map(h => `• ${h}`)
          .join("\n"),
      },
    });
  }

  return blocks;
}
