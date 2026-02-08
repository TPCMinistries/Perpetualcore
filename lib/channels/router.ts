/**
 * Channel Message Router
 *
 * Core routing logic for the unified channel hub. Looks up the user,
 * loads full AI context (intelligence, memory, contacts, RAG),
 * generates an AI response, and persists the conversation.
 *
 * Replicates the context injection pattern from app/api/chat/route.ts
 * so that channel messages get the same rich, context-aware responses
 * as the web chat interface.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { searchDocuments, buildRAGContext } from "@/lib/documents/rag";
import { buildMemoryContext } from "@/lib/ai/memory";
import { ChannelMessage, ChannelAdapter, ChannelResponse, ChannelType } from "./types";
import { trackActivity } from "@/lib/activity-feed/tracker";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Profile fields used for channel user lookup */
const CHANNEL_ID_COLUMNS: Record<ChannelType, string> = {
  telegram: "telegram_chat_id",
  slack: "slack_user_id",
  whatsapp: "whatsapp_number",
  discord: "discord_user_id",
  email: "email",
};

/**
 * Route an incoming channel message through the full AI pipeline.
 *
 * 1. Look up user by their channel-specific ID
 * 2. Load full context (intelligence, memory, contacts, RAG)
 * 3. Generate AI response with Claude
 * 4. Save conversation and messages to DB
 * 5. Track in activity feed
 *
 * @param message - The normalized ChannelMessage
 * @param adapter - The channel adapter for sending responses
 * @returns The AI-generated ChannelResponse
 */
export async function routeMessage(
  message: ChannelMessage,
  adapter: ChannelAdapter
): Promise<ChannelResponse> {
  const supabase = createAdminClient();

  // --- Step 1: Look up user ---
  const columnName = CHANNEL_ID_COLUMNS[message.channelType];
  const lookupValue = message.channelUserId;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email, notification_preferences")
    .eq(columnName, String(lookupValue))
    .single();

  if (profileError || !profile) {
    console.warn(
      `[ChannelRouter] No user found for ${message.channelType}:${lookupValue}`
    );

    return {
      text: buildOnboardingMessage(message.channelType, lookupValue),
    };
  }

  const userId = profile.id;
  const organizationId = profile.organization_id || userId;
  const userName = profile.full_name || "there";

  // --- Step 2: Load full context (parallel) ---
  const [memoryContext, ragResults, intelligenceData, recentConversation] =
    await Promise.all([
      buildMemoryContext(supabase, userId).catch(() => null),
      searchDocuments(message.text, organizationId, userId, 5, 0.4).catch(
        () => []
      ),
      loadIntelligenceContext(supabase, userId).catch(() => null),
      getOrCreateConversation(supabase, userId, organizationId, message.channelType).catch(
        () => null
      ),
    ]);

  const ragContext =
    ragResults.length > 0 ? buildRAGContext(ragResults) : null;

  // --- Step 3: Build system prompt with all context ---
  let systemPrompt = buildChannelSystemPrompt(
    userName,
    message.channelType
  );

  // Inject intelligence context
  if (intelligenceData) {
    systemPrompt += `\n\n## User Intelligence\n${intelligenceData}`;
  }

  // Inject memory context
  if (memoryContext) {
    systemPrompt += `\n\n${memoryContext}`;
  }

  // Inject RAG document context
  if (ragContext) {
    systemPrompt += `\n\n## Relevant Documents\n${ragContext}`;
  }

  // Load recent conversation history for continuity
  let conversationHistory: { role: "user" | "assistant"; content: string }[] =
    [];
  if (recentConversation) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", recentConversation.id)
      .order("created_at", { ascending: true })
      .limit(10);

    if (recentMessages && recentMessages.length > 0) {
      conversationHistory = recentMessages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    }
  }

  // Add the current message
  conversationHistory.push({ role: "user", content: message.text });

  // --- Step 4: Generate AI response ---
  let responseText: string;

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const completion = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversationHistory,
      });

      responseText =
        completion.content[0].type === "text"
          ? completion.content[0].text
          : "I couldn't generate a response.";
    } else {
      responseText =
        "No AI provider configured. Please add ANTHROPIC_API_KEY to your environment.";
    }
  } catch (aiError: any) {
    console.error("[ChannelRouter] AI generation error:", aiError);
    responseText = `Sorry, I ran into an issue processing your message. Please try again in a moment.`;
  }

  // --- Step 5: Save conversation + messages ---
  const conversationId = recentConversation?.id;

  if (conversationId) {
    // Save user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message.text,
    });

    // Save AI response
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: responseText,
    });

    // Update conversation title if it's new
    if (recentConversation?.title === `${message.channelType} conversation`) {
      const titleSnippet =
        message.text.length > 50
          ? message.text.substring(0, 50) + "..."
          : message.text;
      await supabase
        .from("conversations")
        .update({ title: `${message.channelType}: ${titleSnippet}` })
        .eq("id", conversationId);
    }
  }

  // Save to channel_messages table for unified logging
  await supabase.from("channel_messages").insert([
    {
      user_id: userId,
      organization_id: organizationId,
      conversation_id: conversationId || null,
      channel_type: message.channelType,
      channel_user_id: message.channelUserId,
      channel_message_id: message.channelMessageId,
      direction: "inbound",
      content: message.text,
      attachments: message.attachments || [],
      metadata: {
        replyToMessageId: message.replyToMessageId,
        timestamp: message.timestamp.toISOString(),
      },
    },
    {
      user_id: userId,
      organization_id: organizationId,
      conversation_id: conversationId || null,
      channel_type: message.channelType,
      channel_user_id: message.channelUserId,
      direction: "outbound",
      content: responseText,
      metadata: {},
    },
  ]);

  // --- Step 6: Track in activity feed (fire-and-forget) ---
  trackActivity({
    userId,
    eventType: "message_received",
    title: `Message via ${message.channelType}`,
    description: message.text.substring(0, 200),
    channel: message.channelType,
    metadata: {
      channelMessageId: message.channelMessageId,
      conversationId,
      hasAttachments: !!message.attachments?.length,
    },
  }).catch(() => {});

  trackActivity({
    userId,
    eventType: "message_sent",
    title: `Response via ${message.channelType}`,
    description: responseText.substring(0, 200),
    channel: message.channelType,
    metadata: {
      conversationId,
      responseLength: responseText.length,
    },
  }).catch(() => {});

  return { text: responseText };
}

/**
 * Build the system prompt for channel conversations.
 * Keeps responses concise and mobile-friendly.
 */
function buildChannelSystemPrompt(
  userName: string,
  channelType: ChannelType
): string {
  const channelHints: Record<ChannelType, string> = {
    telegram: "Keep responses concise for mobile (under 500 chars when possible). Use markdown sparingly.",
    slack: "Use Slack mrkdwn format. You can use rich formatting. Keep responses professional but friendly.",
    whatsapp: "Keep responses very concise (under 300 chars when possible). Use plain text. No complex formatting.",
    discord: "You can use standard Markdown. Keep responses focused and helpful.",
    email: "You can be more verbose. Use proper formatting with headers and lists.",
  };

  return `You are an advanced AI assistant with persistent memory and intelligent capabilities, responding via ${channelType}.

KEY FACTS:
- You're talking to ${userName}
- ${channelHints[channelType]}
- Be warm, helpful, and proactive
- You have access to documents, contacts, calendar, and memory

CAPABILITIES:
- Answer questions using knowledge base and documents
- Create tasks and reminders
- Draft emails and messages
- Look up contacts and relationships
- Provide insights from past conversations
- Remember context across conversations

RESPONSE STYLE:
- Be conversational, not robotic
- Get to the point quickly
- Offer follow-up actions when relevant`;
}

/**
 * Build an onboarding message for unrecognized users.
 */
function buildOnboardingMessage(
  channelType: ChannelType,
  channelUserId: string
): string {
  return `Hi there! I don't recognize this ${channelType} account yet.

To connect me to your Perpetual Core account:
1. Log into perpetualcore.com
2. Go to Settings > Integrations > ${channelType.charAt(0).toUpperCase() + channelType.slice(1)}
3. Enter this ID: ${channelUserId}

Once connected, I'll be your AI assistant right here in ${channelType}!`;
}

/**
 * Load user intelligence context (preferences, patterns) from the database.
 */
async function loadIntelligenceContext(
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data: intelligence } = await supabase
    .from("user_intelligence")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!intelligence) return null;

  const parts: string[] = [];

  if (intelligence.communication_style) {
    parts.push(`Communication style: ${intelligence.communication_style}`);
  }
  if (intelligence.interests) {
    parts.push(
      `Key interests: ${Array.isArray(intelligence.interests) ? intelligence.interests.join(", ") : intelligence.interests}`
    );
  }
  if (intelligence.work_patterns) {
    parts.push(`Work patterns: ${JSON.stringify(intelligence.work_patterns)}`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Get or create a conversation for a channel session.
 * Groups messages into conversations by channel type, reusing recent ones.
 */
async function getOrCreateConversation(
  supabase: any,
  userId: string,
  organizationId: string,
  channelType: ChannelType
): Promise<{ id: string; title: string } | null> {
  // Look for a recent conversation on this channel (within the last 4 hours)
  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("user_id", userId)
    .eq("model", channelType)
    .gte("updated_at", fourHoursAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Touch the conversation to keep it active
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  // Create a new conversation
  const { data: newConv } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      title: `${channelType} conversation`,
      model: channelType,
    })
    .select("id, title")
    .single();

  return newConv || null;
}
