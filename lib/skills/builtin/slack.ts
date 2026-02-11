/**
 * Slack Skill
 *
 * Manage Slack channels, messages, and notifications.
 * Wraps existing Slack OAuth integration from lib/integrations/config.ts
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveCredential } from "../credentials";

async function getSlackToken(userId: string, organizationId: string): Promise<string | null> {
  // Try BYOK credential cascade (user → org → env)
  const cred = await resolveCredential("slack", userId, organizationId);
  if (cred?.key) return cred.key;

  // Fall back to OAuth token from integrations table
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integrations")
    .select("access_token")
    .eq("organization_id", organizationId)
    .eq("provider", "slack")
    .eq("is_active", true)
    .single();

  return data?.access_token || null;
}

async function slackApi(token: string, method: string, body?: any): Promise<any> {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/**
 * List Slack channels
 */
async function listChannels(
  params: { limit?: number; types?: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getSlackToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Slack not connected. Please add your Slack token in Settings > Skills." };
  }

  const result = await slackApi(token, "conversations.list", {
    limit: params.limit || 20,
    types: params.types || "public_channel,private_channel",
  });

  if (!result.ok) {
    return { success: false, error: result.error || "Failed to list channels" };
  }

  const channels = (result.channels || []).map((ch: any) => ({
    id: ch.id,
    name: ch.name,
    topic: ch.topic?.value || "",
    memberCount: ch.num_members,
    isPrivate: ch.is_private,
  }));

  return {
    success: true,
    data: { channels },
    display: {
      type: "table",
      content: {
        headers: ["Channel", "Members", "Topic"],
        rows: channels.slice(0, 15).map((ch: any) => [
          `#${ch.name}`,
          ch.memberCount?.toString() || "-",
          ch.topic?.substring(0, 40) || "-",
        ]),
      },
    },
  };
}

/**
 * Send a message to a Slack channel
 */
async function sendMessage(
  params: { channel: string; text: string },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getSlackToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Slack not connected." };
  }

  const result = await slackApi(token, "chat.postMessage", {
    channel: params.channel,
    text: params.text,
  });

  if (!result.ok) {
    return { success: false, error: result.error || "Failed to send message" };
  }

  return {
    success: true,
    data: { ts: result.ts, channel: result.channel },
    display: {
      type: "text",
      content: `Message sent to #${params.channel}`,
    },
  };
}

/**
 * Get recent messages from a channel
 */
async function getMessages(
  params: { channel: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const token = await getSlackToken(context.userId, context.organizationId);
  if (!token) {
    return { success: false, error: "Slack not connected." };
  }

  const result = await slackApi(token, "conversations.history", {
    channel: params.channel,
    limit: params.limit || 10,
  });

  if (!result.ok) {
    return { success: false, error: result.error || "Failed to get messages" };
  }

  const messages = (result.messages || []).map((msg: any) => ({
    user: msg.user,
    text: msg.text?.substring(0, 200),
    ts: msg.ts,
    type: msg.type,
  }));

  return {
    success: true,
    data: { messages },
    display: {
      type: "table",
      content: {
        headers: ["User", "Message"],
        rows: messages.map((m: any) => [
          m.user || "bot",
          m.text?.substring(0, 60) || "-",
        ]),
      },
    },
  };
}

export const slackSkill: Skill = {
  id: "slack",
  name: "Slack",
  description: "Send messages, manage channels, and stay connected with your team on Slack",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "communication",
  tags: ["slack", "messaging", "team", "channels", "notifications"],

  icon: "💬",
  color: "#4A154B",

  tier: "pro",
  isBuiltIn: true,

  requiredEnvVars: [],
  requiredIntegrations: ["slack"],

  configSchema: {
    apiToken: {
      type: "string",
      label: "Slack Bot Token",
      description: "Get your bot token from Slack App settings (xoxb-...)",
      required: true,
      placeholder: "xoxb-...",
    },
  },

  tools: [
    {
      name: "list_channels",
      description: "List Slack channels you have access to",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max channels to return (default: 20)" },
          types: { type: "string", description: "Channel types (default: public_channel,private_channel)" },
        },
      },
      execute: listChannels,
    },
    {
      name: "send_message",
      description: "Send a message to a Slack channel",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID or name" },
          text: { type: "string", description: "Message text" },
        },
        required: ["channel", "text"],
      },
      execute: sendMessage,
    },
    {
      name: "get_messages",
      description: "Get recent messages from a Slack channel",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          limit: { type: "number", description: "Number of messages (default: 10)" },
        },
        required: ["channel"],
      },
      execute: getMessages,
    },
  ],

  systemPrompt: `You have Slack integration available. When users ask about team communication:
- Use "list_channels" to find channels
- Use "send_message" to post messages (always confirm before sending)
- Use "get_messages" to read recent messages from a channel
Always ask for confirmation before sending messages.`,
};
