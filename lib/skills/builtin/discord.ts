/**
 * Discord Skill
 *
 * Send messages and interact with Discord servers via bot.
 * Requires Discord bot token.
 */

import { Skill, ToolContext, ToolResult } from "../types";

const DISCORD_API = "https://discord.com/api/v10";

function getDiscordHeaders(): Headers | null {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;

  return new Headers({
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  });
}

async function listServers(
  params: {},
  context: ToolContext
): Promise<ToolResult> {
  const headers = getDiscordHeaders();
  if (!headers) {
    return { success: false, error: "Discord bot not connected. Please add DISCORD_BOT_TOKEN." };
  }

  try {
    const response = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch servers" };
    }

    const guilds = await response.json();

    return {
      success: true,
      data: {
        servers: guilds.map((g: any) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
        })),
      },
      display: {
        type: "table",
        content: {
          headers: ["Server", "ID", "Owner"],
          rows: guilds.slice(0, 10).map((g: any) => [
            g.name,
            g.id,
            g.owner ? "Yes" : "No",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function listChannels(
  params: { serverId: string },
  context: ToolContext
): Promise<ToolResult> {
  const headers = getDiscordHeaders();
  if (!headers) {
    return { success: false, error: "Discord bot not connected" };
  }

  try {
    const response = await fetch(
      `${DISCORD_API}/guilds/${params.serverId}/channels`,
      { headers }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch channels" };
    }

    const channels = await response.json();

    // Filter to text channels only
    const textChannels = channels.filter((c: any) => c.type === 0);

    return {
      success: true,
      data: {
        channels: textChannels.map((c: any) => ({
          id: c.id,
          name: c.name,
          topic: c.topic,
          position: c.position,
        })),
      },
      display: {
        type: "table",
        content: {
          headers: ["Channel", "ID", "Topic"],
          rows: textChannels.slice(0, 15).map((c: any) => [
            `#${c.name}`,
            c.id,
            c.topic?.substring(0, 30) || "-",
          ]),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendMessage(
  params: { channelId: string; content: string; embed?: any },
  context: ToolContext
): Promise<ToolResult> {
  const headers = getDiscordHeaders();
  if (!headers) {
    return { success: false, error: "Discord bot not connected" };
  }

  try {
    const body: any = { content: params.content };

    if (params.embed) {
      body.embeds = [params.embed];
    }

    const response = await fetch(
      `${DISCORD_API}/channels/${params.channelId}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to send message" };
    }

    const message = await response.json();

    return {
      success: true,
      data: {
        messageId: message.id,
        channelId: params.channelId,
        content: params.content,
      },
      display: {
        type: "text",
        content: `Message sent to channel`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getMessages(
  params: { channelId: string; limit?: number },
  context: ToolContext
): Promise<ToolResult> {
  const headers = getDiscordHeaders();
  if (!headers) {
    return { success: false, error: "Discord bot not connected" };
  }

  try {
    const limit = Math.min(params.limit || 10, 50);
    const response = await fetch(
      `${DISCORD_API}/channels/${params.channelId}/messages?limit=${limit}`,
      { headers }
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch messages" };
    }

    const messages = await response.json();

    return {
      success: true,
      data: {
        messages: messages.map((m: any) => ({
          id: m.id,
          author: m.author.username,
          content: m.content,
          timestamp: m.timestamp,
        })),
      },
      display: {
        type: "text",
        content: messages
          .slice(0, 10)
          .map((m: any) => `**${m.author.username}**: ${m.content.substring(0, 100)}`)
          .join("\n"),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const discordSkill: Skill = {
  id: "discord",
  name: "Discord",
  description: "Send messages and interact with Discord servers",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "communication",
  tags: ["discord", "chat", "community", "gaming"],

  icon: "💬",
  color: "#5865F2",

  tier: "free",
  isBuiltIn: true,

  requiredEnvVars: ["DISCORD_BOT_TOKEN"],

  tools: [
    {
      name: "list_servers",
      description: "List Discord servers the bot is in",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: listServers,
    },
    {
      name: "list_channels",
      description: "List text channels in a Discord server",
      parameters: {
        type: "object",
        properties: {
          serverId: {
            type: "string",
            description: "Server/Guild ID",
          },
        },
        required: ["serverId"],
      },
      execute: listChannels,
    },
    {
      name: "send_message",
      description: "Send a message to a Discord channel",
      parameters: {
        type: "object",
        properties: {
          channelId: {
            type: "string",
            description: "Channel ID to send to",
          },
          content: {
            type: "string",
            description: "Message content",
          },
        },
        required: ["channelId", "content"],
      },
      execute: sendMessage,
    },
    {
      name: "get_messages",
      description: "Get recent messages from a Discord channel",
      parameters: {
        type: "object",
        properties: {
          channelId: {
            type: "string",
            description: "Channel ID",
          },
          limit: {
            type: "number",
            description: "Number of messages (max 50)",
          },
        },
        required: ["channelId"],
      },
      execute: getMessages,
    },
  ],

  systemPrompt: `You have access to Discord. When users want to interact with Discord:
- Use list_servers to find server IDs
- Use list_channels to find channel IDs
- Use send_message to post messages
- Use get_messages to read recent messages
Always get server/channel IDs first before sending messages.`,
};
