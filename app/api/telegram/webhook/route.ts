/**
 * Telegram Webhook Handler
 * Receives messages from Telegram and responds with AI-powered answers
 * Uses full Perpetual Core intelligence: RAG, memory, contacts, etc.
 */

import { NextRequest } from "next/server";
import {
  TelegramUpdate,
  processIncomingMessage,
  handleCallbackQuery,
  sendTelegramMessage,
} from "@/lib/integrations/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // Telegram expects response within 30s

// Verify webhook secret (optional but recommended)
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Verify webhook secret header
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
        console.error("Invalid webhook secret");
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const update: TelegramUpdate = await req.json();
    console.log("Telegram update received:", JSON.stringify(update, null, 2));

    // Handle message
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;

      // Ignore non-text messages for now (could handle voice, photos later)
      if (!message.text) {
        await sendTelegramMessage(
          chatId,
          "I can currently only process text messages. Voice and image support coming soon! 🎤📷"
        );
        return Response.json({ ok: true });
      }

      // Handle commands
      if (message.text.startsWith("/")) {
        const response = await handleCommand(message.text, chatId, message.from);
        await sendTelegramMessage(chatId, response);
        return Response.json({ ok: true });
      }

      // Process regular message
      const response = await processIncomingMessage(message);
      await sendTelegramMessage(chatId, response);

      return Response.json({ ok: true });
    }

    // Handle callback queries (button presses)
    if (update.callback_query) {
      const response = await handleCallbackQuery(update.callback_query);
      if (response) {
        await sendTelegramMessage(update.callback_query.message.chat.id, response);
      }

      // Acknowledge callback
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: update.callback_query.id }),
        }
      );

      return Response.json({ ok: true });
    }

    // Unknown update type
    return Response.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to Telegram to prevent retries
    return Response.json({ ok: false, error: error.message });
  }
}

/**
 * GET /api/telegram/webhook
 * Health check / webhook info
 */
export async function GET(req: NextRequest) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"}/api/telegram/webhook`;

  return Response.json({
    status: "active",
    webhookUrl,
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
    instructions: `
To set up the webhook, call POST /api/telegram/setup with:
{
  "action": "set_webhook"
}

Or use the Telegram API directly:
https://api.telegram.org/bot<TOKEN>/setWebhook?url=${webhookUrl}
    `.trim(),
  });
}

/**
 * Handle bot commands
 */
async function handleCommand(
  text: string,
  chatId: number,
  from: { id: number; first_name: string; username?: string }
): Promise<string> {
  const command = text.split(" ")[0].toLowerCase();
  const args = text.substring(command.length).trim();

  switch (command) {
    case "/start":
      return `👋 Hey ${from.first_name}! I'm your Perpetual Core AI assistant.

I can help you with:
• 📝 Tasks & reminders
• 📧 Drafting emails & messages
• 🔍 Searching your documents
• 👥 Looking up contacts
• 📅 Calendar & scheduling
• 💡 Answering questions from your knowledge base
• 🧠 Remembering our past conversations

Just send me a message and I'll help!

**Quick commands:**
/tasks - View your pending tasks
/contacts - Search contacts
/help - Show all commands

Chat ID: \`${chatId}\` (save this for setup)`;

    case "/help":
      return `**Available Commands:**

/start - Get started
/tasks - View pending tasks
/contacts [name] - Search contacts
/remind [text] - Create a reminder
/note [text] - Save a quick note
/status - Check system status
/link [email] - Link your account
/settings - Notification settings

Or just chat naturally! I understand context and can help with almost anything. 🤖`;

    case "/tasks":
      return await getTasksSummary(chatId);

    case "/contacts":
      if (args) {
        return await searchContacts(chatId, args);
      }
      return "Usage: `/contacts [name]`\n\nExample: `/contacts John`";

    case "/remind":
      if (args) {
        return await createReminder(chatId, args);
      }
      return "Usage: `/remind [text]`\n\nExample: `/remind Call mom tomorrow`";

    case "/note":
      if (args) {
        return await saveQuickNote(chatId, args);
      }
      return "Usage: `/note [text]`\n\nExample: `/note Great idea for the project...`";

    case "/status":
      return `✅ **System Status**

Bot: Online
AI: ${process.env.ANTHROPIC_API_KEY ? "Claude" : process.env.OPENAI_API_KEY ? "GPT-4" : "Not configured"}
RAG: ${process.env.OPENAI_API_KEY ? "Active" : "Needs OpenAI key"}
Memory: Active

Your Chat ID: \`${chatId}\``;

    case "/link":
      if (args && args.includes("@")) {
        return await linkAccountByEmail(chatId, args, from);
      }
      return "Usage: `/link [your-email@example.com]`\n\nThis links your Telegram to your Perpetual Core account.";

    case "/settings":
      return `**Notification Settings**

To change settings, reply with a number:
1. Nudge frequency: Balanced
2. Quiet hours: 10PM - 7AM
3. Proactive nudges: Enabled

Or go to perpetualcore.com/settings/notifications`;

    default:
      return `Unknown command: ${command}\n\nType /help for available commands.`;
  }
}

/**
 * Get tasks summary for user
 */
async function getTasksSummary(chatId: number): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (!profile) {
    return "Please link your account first with `/link your@email.com`";
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority")
    .eq("user_id", profile.id)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(10);

  if (!tasks || tasks.length === 0) {
    return "🎉 No pending tasks! You're all caught up.";
  }

  const taskList = tasks
    .map((t, i) => {
      const dueStr = t.due_date
        ? new Date(t.due_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "No due date";
      const priority = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "⚪";
      return `${i + 1}. ${priority} ${t.title}\n   _Due: ${dueStr}_`;
    })
    .join("\n\n");

  return `**📋 Your Tasks (${tasks.length})**\n\n${taskList}`;
}

/**
 * Search contacts
 */
async function searchContacts(chatId: number, query: string): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (!profile) {
    return "Please link your account first with `/link your@email.com`";
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("first_name, last_name, email, phone, company, job_title")
    .eq("user_id", profile.id)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(5);

  if (!contacts || contacts.length === 0) {
    return `No contacts found matching "${query}"`;
  }

  const contactList = contacts
    .map((c) => {
      const name = `${c.first_name} ${c.last_name || ""}`.trim();
      const role = c.job_title && c.company ? `${c.job_title} @ ${c.company}` : c.company || c.job_title || "";
      return `**${name}**${role ? `\n${role}` : ""}${c.email ? `\n📧 ${c.email}` : ""}${c.phone ? `\n📱 ${c.phone}` : ""}`;
    })
    .join("\n\n");

  return `**👥 Contacts matching "${query}":**\n\n${contactList}`;
}

/**
 * Create a reminder
 */
async function createReminder(chatId: number, text: string): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (!profile) {
    return "Please link your account first with `/link your@email.com`";
  }

  // Simple date parsing
  let dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1); // Default to tomorrow

  if (text.toLowerCase().includes("today")) {
    dueDate = new Date();
  } else if (text.toLowerCase().includes("tomorrow")) {
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (text.toLowerCase().includes("next week")) {
    dueDate.setDate(dueDate.getDate() + 7);
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: profile.id,
    organization_id: profile.organization_id || profile.id,
    title: text,
    status: "pending",
    priority: "medium",
    due_date: dueDate.toISOString(),
    source: "telegram",
  });

  if (error) {
    return "Failed to create reminder. Please try again.";
  }

  return `✅ Reminder created!\n\n"${text}"\n\n_Due: ${dueDate.toLocaleDateString()}_`;
}

/**
 * Save a quick note
 */
async function saveQuickNote(chatId: number, text: string): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", String(chatId))
    .single();

  if (!profile) {
    return "Please link your account first with `/link your@email.com`";
  }

  // Save to AI memory
  const { error } = await supabase.from("user_ai_memory").insert({
    user_id: profile.id,
    memory_type: "note",
    content: text,
    source: "telegram",
    importance: 0.6,
  });

  if (error) {
    return "Failed to save note. Please try again.";
  }

  return `📝 Note saved!\n\n"${text}"`;
}

/**
 * Link account by email
 */
async function linkAccountByEmail(
  chatId: number,
  email: string,
  from: { id: number; first_name: string; username?: string }
): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();

  // Find user by email
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !profile) {
    return `No account found for ${email}.\n\nMake sure you've signed up at perpetualcore.com first.`;
  }

  // Update profile with Telegram info
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      telegram_chat_id: String(chatId),
      telegram_username: from.username,
      notification_preferences: {
        proactive_nudges_enabled: true,
        preferred_channel: "telegram",
        nudge_frequency: "balanced",
        quiet_hours_start: 22,
        quiet_hours_end: 7,
      },
    })
    .eq("id", profile.id);

  if (updateError) {
    return "Failed to link account. Please try again.";
  }

  return `✅ **Account linked!**

Welcome, ${profile.full_name || from.first_name}! 🎉

Your Telegram is now connected to Perpetual Core. I can now:
• Send you proactive reminders
• Access your documents and contacts
• Remember our conversations

Try asking me something!`;
}
