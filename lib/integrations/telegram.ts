/**
 * Telegram Bot Integration
 * Full-featured bot that connects to Perpetual Core's AI
 * Replaces n8n bot with smarter, context-aware responses
 */

import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { searchDocuments, buildRAGContext } from "@/lib/documents/rag";
import { buildMemoryContext } from "@/lib/ai/memory";
import { extractCommitmentsFromConversation } from "@/lib/ai/commitment-extractor";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  voice?: {
    file_id: string;
    duration: number;
  };
  photo?: Array<{
    file_id: string;
    width: number;
    height: number;
  }>;
  document?: {
    file_id: string;
    file_name: string;
    mime_type: string;
  };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramMessage["from"];
    message: TelegramMessage;
    data: string;
  };
}

/**
 * Send a message via Telegram
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: {
    parseMode?: "Markdown" | "HTML";
    replyToMessageId?: number;
    replyMarkup?: any;
  }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: options?.parseMode || "Markdown",
        reply_to_message_id: options?.replyToMessageId,
        reply_markup: options?.replyMarkup,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram send error:", result);
      // If Markdown fails, retry without it
      if (result.description?.includes("can't parse")) {
        return sendTelegramMessage(chatId, text, {
          ...options,
          parseMode: undefined,
        });
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingAction(chatId: number | string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        action: "typing",
      }),
    });
  } catch (error) {
    // Ignore typing errors
  }
}

/**
 * Get user from Telegram chat ID
 */
export async function getUserFromTelegramChatId(
  chatId: number | string
): Promise<{ userId: string; organizationId: string; profile: any } | null> {
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email, notification_preferences")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (error) {
    console.error("Telegram user lookup error:", {
      chatId: String(chatId),
      error: error.message,
      code: error.code,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    return null;
  }

  if (!profile) {
    console.log("No profile found for telegram_chat_id:", String(chatId));
    return null;
  }

  return {
    userId: profile.id,
    organizationId: profile.organization_id || profile.id,
    profile,
  };
}

/**
 * Link Telegram account to user profile
 */
export async function linkTelegramAccount(
  userId: string,
  chatId: number | string,
  telegramUser: TelegramMessage["from"]
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      telegram_chat_id: String(chatId),
      telegram_username: telegramUser.username,
      notification_preferences: {
        proactive_nudges_enabled: true,
        preferred_channel: "telegram",
        nudge_frequency: "balanced",
        quiet_hours_start: 22,
        quiet_hours_end: 7,
      },
    })
    .eq("id", userId);

  return !error;
}

/**
 * Build system prompt for Telegram conversations
 */
function buildTelegramSystemPrompt(
  userName: string,
  memoryContext: string | null,
  ragContext: string | null
): string {
  let prompt = `You are Lorenzo's personal AI assistant, responding via Telegram.

KEY FACTS:
- You're talking to ${userName}
- Keep responses concise for mobile (under 500 chars when possible)
- Use markdown sparingly (bold for emphasis, not headers)
- Be warm, helpful, and proactive
- You have access to Lorenzo's documents, contacts, calendar, and memory

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
- Offer follow-up actions when relevant
- Use emojis sparingly (1-2 max per message)`;

  if (memoryContext) {
    prompt += `\n\n--- MEMORY CONTEXT ---\n${memoryContext}`;
  }

  if (ragContext) {
    prompt += `\n\n--- RELEVANT DOCUMENTS ---\n${ragContext}`;
  }

  return prompt;
}

/**
 * Process incoming Telegram message and generate response
 */
export async function processIncomingMessage(
  message: TelegramMessage
): Promise<string> {
  const chatId = message.chat.id;
  const userText = message.text || "";
  const telegramUser = message.from;

  // Get linked user
  const userData = await getUserFromTelegramChatId(chatId);

  if (!userData) {
    return `👋 Hi ${telegramUser.first_name}! I don't recognize this Telegram account yet.

To connect me to your Perpetual Core account:
1. Log into perpetualcore.com
2. Go to Settings → Integrations → Telegram
3. Enter this chat ID: \`${chatId}\`

Or send me your account email and I'll help you set it up!`;
  }

  const { userId, organizationId, profile } = userData;
  const userName = profile.full_name || telegramUser.first_name;

  // Send typing indicator
  await sendTypingAction(chatId);

  // Log the interaction
  const supabase = createAdminClient();
  const interactionId = crypto.randomUUID();

  await supabase.from("telegram_interactions").insert({
    id: interactionId,
    user_id: userId,
    chat_id: String(chatId),
    message: userText,
    intent: message.voice ? "voice" : message.photo ? "photo" : "text",
    created_at: new Date().toISOString(),
  });

  try {
    // Build context in parallel
    const [memoryContext, ragResults] = await Promise.all([
      buildMemoryContext(supabase, userId).catch(() => null),
      searchDocuments(userText, organizationId, userId, 5, 0.4).catch(() => []),
    ]);

    const ragContext = ragResults.length > 0 ? buildRAGContext(ragResults) : null;

    // Build system prompt with all context
    const systemPrompt = buildTelegramSystemPrompt(userName, memoryContext, ragContext);

    // Generate response using Claude (preferred) or GPT-4
    let response: string;

    if (process.env.ANTHROPIC_API_KEY) {
      const completion = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }],
      });

      response =
        completion.content[0].type === "text"
          ? completion.content[0].text
          : "I couldn't generate a response.";
    } else if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      });

      response = completion.choices[0]?.message?.content || "I couldn't generate a response.";
    } else {
      response = "No AI provider configured. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY.";
    }

    // Update interaction with response
    await supabase
      .from("telegram_interactions")
      .update({
        response: response,
        response_time_ms: Date.now() - message.date * 1000,
        intent: detectIntent(userText),
      })
      .eq("id", interactionId);

    // Extract commitments from this interaction (async)
    extractCommitmentsFromInteraction(userId, organizationId, userText, response).catch(
      console.error
    );

    return response;
  } catch (error: any) {
    console.error("Error processing Telegram message:", error);

    // Update interaction with error
    await supabase
      .from("telegram_interactions")
      .update({
        response: `Error: ${error.message}`,
      })
      .eq("id", interactionId);

    return `Sorry, I ran into an issue processing your message. Please try again in a moment.

Error: ${error.message?.substring(0, 100)}`;
  }
}

/**
 * Extract commitments from a Telegram interaction
 */
async function extractCommitmentsFromInteraction(
  userId: string,
  organizationId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  // Only extract if message suggests commitment
  const commitmentIndicators = /\b(i('ll| will)|remind me|follow up|need to|have to|should|must|deadline|by (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week))\b/i;

  if (!commitmentIndicators.test(userMessage)) {
    return;
  }

  const supabase = createAdminClient();

  // Create a pseudo-conversation for this interaction
  const { data: conv } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      title: `Telegram: ${userMessage.substring(0, 50)}...`,
      model: "telegram",
    })
    .select()
    .single();

  if (!conv) return;

  // Add messages
  await supabase.from("messages").insert([
    { conversation_id: conv.id, role: "user", content: userMessage },
    { conversation_id: conv.id, role: "assistant", content: aiResponse },
  ]);

  // Extract commitments
  await extractCommitmentsFromConversation(conv.id, userId, organizationId);
}

/**
 * Simple intent detection
 */
function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  if (lower.match(/\b(remind|reminder|don't forget)\b/)) return "reminder";
  if (lower.match(/\b(task|todo|to-do|to do)\b/)) return "task";
  if (lower.match(/\b(email|send|draft|write)\b/)) return "compose";
  if (lower.match(/\b(search|find|look up|what is|who is)\b/)) return "search";
  if (lower.match(/\b(schedule|meeting|calendar|appointment)\b/)) return "calendar";
  if (lower.match(/\b(contact|call|reach out|phone)\b/)) return "contact";
  if (lower.match(/\?(^|\s)/)) return "question";
  if (lower.match(/\b(hi|hello|hey|good morning|good evening)\b/)) return "greeting";

  return "general";
}

/**
 * Handle callback queries (button presses)
 */
export async function handleCallbackQuery(
  callbackQuery: TelegramUpdate["callback_query"]
): Promise<string | null> {
  if (!callbackQuery) return null;

  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userData = await getUserFromTelegramChatId(chatId);

  if (!userData) return "Please link your account first.";

  // Parse callback data
  const [action, ...params] = data.split(":");

  switch (action) {
    case "complete_task":
      return await handleCompleteTask(params[0], userData.userId);
    case "snooze_task":
      return await handleSnoozeTask(params[0], params[1], userData.userId);
    case "draft_message":
      return await handleDraftMessage(params[0], userData.userId);
    default:
      return "Unknown action.";
  }
}

async function handleCompleteTask(taskId: string, userId: string): Promise<string> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return "Failed to complete task.";
  return "✅ Task marked complete!";
}

async function handleSnoozeTask(
  taskId: string,
  days: string,
  userId: string
): Promise<string> {
  const supabase = createAdminClient();
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + parseInt(days));

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: newDate.toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return "Failed to snooze task.";
  return `⏰ Snoozed for ${days} day(s)!`;
}

async function handleDraftMessage(contactId: string, userId: string): Promise<string> {
  // This would trigger a draft workflow
  return "📝 I'll draft that message for you. What would you like to say?";
}

/**
 * Set webhook URL for Telegram bot
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    });

    const result = await response.json();
    console.log("Webhook set result:", result);
    return result.ok;
  } catch (error) {
    console.error("Error setting webhook:", error);
    return false;
  }
}

/**
 * Get webhook info
 */
export async function getTelegramWebhookInfo(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) return null;

  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    return await response.json();
  } catch (error) {
    console.error("Error getting webhook info:", error);
    return null;
  }
}

/**
 * Delete webhook (for switching to polling)
 */
export async function deleteTelegramWebhook(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`);
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return false;
  }
}
