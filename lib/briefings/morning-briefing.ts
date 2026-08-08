/**
 * Morning Briefing Service
 *
 * Generates and delivers comprehensive daily briefings via user's preferred channel.
 * This is the KILLER FEATURE - proactive AI that starts your day.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { sendSlackMessage, getSlackCredentials } from "@/lib/slack/client";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Channel configs
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

export interface BriefingData {
  user: {
    name: string;
    email: string;
  };
  date: string;
  dayOfWeek: string;
  calendar: {
    totalEvents: number;
    events: Array<{
      title: string;
      time: string;
      duration: string;
      attendees: string[];
      isImportant: boolean;
    }>;
    nextEvent: { title: string; time: string; minutesUntil: number } | null;
  };
  tasks: {
    dueToday: Array<{ id: string; title: string; priority: string }>;
    overdue: Array<{ id: string; title: string; daysPastDue: number }>;
    highPriority: Array<{ id: string; title: string; dueDate: string | null }>;
    completedYesterday: number;
  };
  // External tasks from Todoist, Linear, etc.
  externalTasks: {
    todoist: Array<{ id: string; title: string; priority: number; due?: string }>;
    linear: Array<{ id: string; identifier: string; title: string; status: string }>;
    totalDueToday: number;
  };
  emails: {
    unreadCount: number;
    importantUnread: Array<{ subject: string; from: string; snippet: string }>;
    needsResponse: number;
  };
  weather?: {
    temp: string;
    condition: string;
    high: string;
    low: string;
  };
  insights: string[];
  quote?: string;
}

export interface GeneratedBriefing {
  greeting: string;
  summary: string;
  sections: {
    calendar: string;
    tasks: string;
    emails: string;
    insights: string;
  };
  priorityActions: string[];
  closingMessage: string;
}

export type BriefingChannel = "slack" | "telegram" | "whatsapp" | "email" | "in_app";

export interface UserBriefingPrefs {
  userId: string;
  organizationId: string;
  preferredChannel: BriefingChannel;
  briefingTime: string; // HH:mm
  timezone: string;
  enabled: boolean;
  // Channel-specific
  slackChannelId?: string;
  telegramChatId?: string;
  whatsappNumber?: string;
  email?: string;
  // Content prefs
  includeWeather: boolean;
  includeQuote: boolean;
  briefingStyle: "concise" | "detailed" | "bullets";
}

/**
 * Gather all data needed for the morning briefing
 */
export async function gatherBriefingData(userId: string, organizationId: string): Promise<BriefingData> {
  const supabase = createAdminClient();

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  // Get calendar events for today
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  // Get tasks
  const { data: tasksDueToday } = await supabase
    .from("tasks")
    .select("id, title, priority")
    .eq("user_id", userId)
    .neq("status", "completed")
    .gte("due_date", todayStart.toISOString())
    .lt("due_date", todayEnd.toISOString());

  const { data: tasksOverdue } = await supabase
    .from("tasks")
    .select("id, title, due_date")
    .eq("user_id", userId)
    .neq("status", "completed")
    .lt("due_date", todayStart.toISOString());

  const { data: tasksHighPriority } = await supabase
    .from("tasks")
    .select("id, title, due_date")
    .eq("user_id", userId)
    .eq("priority", "high")
    .neq("status", "completed")
    .limit(5);

  const { count: completedYesterday } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("updated_at", yesterday.toISOString())
    .lt("updated_at", todayStart.toISOString());

  // Get email stats (if available)
  const { count: unreadEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  const { data: importantEmails } = await supabase
    .from("emails")
    .select("subject, from_email, snippet")
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_important", true)
    .limit(3);

  // Get external tasks from Todoist/Linear (external_tasks table)
  const { data: todoistTasks } = await supabase
    .from("external_tasks")
    .select("id, title, priority, due_date")
    .eq("user_id", userId)
    .eq("provider", "todoist")
    .eq("status", "open")
    .lte("due_date", todayEnd.toISOString())
    .order("priority", { ascending: true })
    .limit(10);

  const { data: linearIssues } = await supabase
    .from("external_tasks")
    .select("id, linear_identifier, title, linear_state_name")
    .eq("user_id", userId)
    .eq("provider", "linear")
    .in("status", ["open", "in_progress"])
    .order("priority", { ascending: true })
    .limit(10);

  // Format calendar events
  const formattedEvents = (calendarEvents || []).map(event => {
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;
    const duration = endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      : 60;

    return {
      title: event.title || "Untitled Event",
      time: startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      duration: duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}m`,
      attendees: event.attendees || [],
      isImportant: (event.attendees || []).length > 2,
    };
  });

  // Find next upcoming event
  const now = new Date();
  const upcomingEvents = (calendarEvents || []).filter(e => new Date(e.start_time) > now);
  const nextEvent = upcomingEvents.length > 0 ? {
    title: upcomingEvents[0].title || "Untitled",
    time: new Date(upcomingEvents[0].start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    minutesUntil: Math.round((new Date(upcomingEvents[0].start_time).getTime() - now.getTime()) / (1000 * 60)),
  } : null;

  // Format overdue tasks with days past due
  const formattedOverdue = (tasksOverdue || []).map(task => ({
    id: task.id,
    title: task.title,
    daysPastDue: Math.ceil((todayStart.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  return {
    user: {
      name: profile?.full_name?.split(" ")[0] || "there",
      email: profile?.email || "",
    },
    date: today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    dayOfWeek: dayNames[today.getDay()],
    calendar: {
      totalEvents: formattedEvents.length,
      events: formattedEvents.slice(0, 5),
      nextEvent,
    },
    tasks: {
      dueToday: (tasksDueToday || []).map(t => ({ id: t.id, title: t.title, priority: t.priority || "medium" })),
      overdue: formattedOverdue,
      highPriority: (tasksHighPriority || []).map(t => ({ id: t.id, title: t.title, dueDate: t.due_date })),
      completedYesterday: completedYesterday || 0,
    },
    externalTasks: {
      todoist: (todoistTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due: t.due_date,
      })),
      linear: (linearIssues || []).map(i => ({
        id: i.id,
        identifier: i.linear_identifier || "",
        title: i.title,
        status: i.linear_state_name || "Open",
      })),
      totalDueToday: (todoistTasks?.length || 0) + (linearIssues?.length || 0),
    },
    emails: {
      unreadCount: unreadEmails || 0,
      importantUnread: (importantEmails || []).map(e => ({
        subject: e.subject,
        from: e.from_email,
        snippet: e.snippet?.substring(0, 100) || "",
      })),
      needsResponse: (importantEmails || []).length,
    },
    insights: [],
  };
}

/**
 * Generate AI-powered briefing content
 */
export async function generateBriefingContent(
  data: BriefingData,
  style: "concise" | "detailed" | "bullets" = "concise"
): Promise<GeneratedBriefing> {
  // Build external tasks summary
  const todoistSummary = data.externalTasks?.todoist?.length
    ? `\n- Todoist tasks: ${data.externalTasks.todoist.length}\n  ${data.externalTasks.todoist.slice(0, 5).map(t => `  • ${t.title}`).join("\n")}`
    : "";
  const linearSummary = data.externalTasks?.linear?.length
    ? `\n- Linear issues: ${data.externalTasks.linear.length}\n  ${data.externalTasks.linear.slice(0, 5).map(i => `  • ${i.identifier}: ${i.title} (${i.status})`).join("\n")}`
    : "";

  const prompt = `Generate a morning briefing for ${data.user.name}. Today is ${data.dayOfWeek}, ${data.date}.

DATA:
- Calendar: ${data.calendar.totalEvents} events today
  ${data.calendar.events.map(e => `  • ${e.time}: ${e.title} (${e.duration})`).join("\n")}
  ${data.calendar.nextEvent ? `  Next up: ${data.calendar.nextEvent.title} in ${data.calendar.nextEvent.minutesUntil} minutes` : ""}

- Tasks due today: ${data.tasks.dueToday.length}
  ${data.tasks.dueToday.map(t => `  • [${t.priority.toUpperCase()}] ${t.title}`).join("\n")}

- Overdue tasks: ${data.tasks.overdue.length}
  ${data.tasks.overdue.map(t => `  • ${t.title} (${t.daysPastDue} days overdue)`).join("\n")}
${todoistSummary}${linearSummary}

- Emails: ${data.emails.unreadCount} unread, ${data.emails.needsResponse} need response
  ${data.emails.importantUnread.map(e => `  • ${e.from}: ${e.subject}`).join("\n")}

- Yesterday: Completed ${data.tasks.completedYesterday} tasks

STYLE: ${style}

Generate JSON with:
{
  "greeting": "Warm, personalized morning greeting (mention day of week, be encouraging)",
  "summary": "2-3 sentence overview of the day ahead",
  "sections": {
    "calendar": "Brief calendar summary (what's ahead, any gaps)",
    "tasks": "Task summary with focus areas",
    "emails": "Email summary if relevant",
    "insights": "1-2 proactive observations or suggestions"
  },
  "priorityActions": ["Top 3 things to focus on today"],
  "closingMessage": "Motivating closing line"
}

Be warm but professional. Use ${data.user.name}'s name. Make it feel personal, not robotic.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.error("Failed to generate briefing:", error);

    // Fallback briefing
    return {
      greeting: `Good morning, ${data.user.name}! Happy ${data.dayOfWeek}.`,
      summary: `You have ${data.calendar.totalEvents} events and ${data.tasks.dueToday.length} tasks due today.`,
      sections: {
        calendar: data.calendar.totalEvents > 0
          ? `${data.calendar.totalEvents} events today, starting with ${data.calendar.events[0]?.title || "your first meeting"}.`
          : "Your calendar is clear today.",
        tasks: `${data.tasks.dueToday.length} tasks due today. ${data.tasks.overdue.length > 0 ? `${data.tasks.overdue.length} overdue tasks need attention.` : ""}`,
        emails: data.emails.unreadCount > 0
          ? `${data.emails.unreadCount} unread emails.`
          : "Inbox is manageable.",
        insights: "Focus on high-priority items first.",
      },
      priorityActions: data.tasks.dueToday.slice(0, 3).map(t => t.title),
      closingMessage: "Let's make it a great day!",
    };
  }
}

/**
 * Format briefing for Slack (Block Kit)
 */
function formatForSlack(data: BriefingData, briefing: GeneratedBriefing): any[] {
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `☀️ Good Morning, ${data.user.name}!`, emoji: true },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `*${data.dayOfWeek}, ${data.date}*` }],
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: briefing.summary },
    },
  ];

  // Calendar section
  if (data.calendar.totalEvents > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:calendar: Today's Schedule* (${data.calendar.totalEvents} events)\n${
          data.calendar.events.slice(0, 4).map(e =>
            `• *${e.time}* - ${e.title} _(${e.duration})_`
          ).join("\n")
        }`,
      },
    });
  }

  // Tasks section
  const taskText = [];
  if (data.tasks.dueToday.length > 0) {
    taskText.push(`*Due Today:* ${data.tasks.dueToday.length}`);
  }
  if (data.tasks.overdue.length > 0) {
    taskText.push(`:warning: *Overdue:* ${data.tasks.overdue.length}`);
  }
  if (taskText.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:white_check_mark: Tasks*\n${taskText.join(" | ")}\n${
          data.tasks.dueToday.slice(0, 3).map(t =>
            `• ${t.priority === "high" ? ":red_circle:" : ":large_blue_circle:"} ${t.title}`
          ).join("\n")
        }`,
      },
    });
  }

  // Priority actions
  if (briefing.priorityActions.length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:dart: Focus Today*\n${briefing.priorityActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
      },
    });
  }

  // Closing
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `_${briefing.closingMessage}_ • <${process.env.NEXT_PUBLIC_APP_URL}/dashboard|Open Dashboard>` }],
  });

  return blocks;
}

/**
 * Format briefing for Telegram (Markdown)
 */
function formatForTelegram(data: BriefingData, briefing: GeneratedBriefing): string {
  let message = `☀️ *Good Morning, ${data.user.name}!*\n`;
  message += `_${data.dayOfWeek}, ${data.date}_\n\n`;
  message += `${briefing.summary}\n\n`;

  if (data.calendar.totalEvents > 0) {
    message += `📅 *Schedule* (${data.calendar.totalEvents} events)\n`;
    data.calendar.events.slice(0, 3).forEach(e => {
      message += `• ${e.time} - ${e.title}\n`;
    });
    message += "\n";
  }

  if (data.tasks.dueToday.length > 0 || data.tasks.overdue.length > 0) {
    message += `✅ *Tasks*\n`;
    if (data.tasks.overdue.length > 0) {
      message += `⚠️ ${data.tasks.overdue.length} overdue\n`;
    }
    data.tasks.dueToday.slice(0, 3).forEach(t => {
      message += `• ${t.title}\n`;
    });
    message += "\n";
  }

  message += `🎯 *Focus Today*\n`;
  briefing.priorityActions.forEach((a, i) => {
    message += `${i + 1}. ${a}\n`;
  });

  message += `\n_${briefing.closingMessage}_`;

  return message;
}

/**
 * Format briefing for WhatsApp (plain text)
 */
function formatForWhatsApp(data: BriefingData, briefing: GeneratedBriefing): string {
  let message = `☀️ Good Morning, ${data.user.name}!\n`;
  message += `${data.dayOfWeek}, ${data.date}\n\n`;
  message += `${briefing.summary}\n\n`;

  if (data.calendar.nextEvent) {
    message += `📅 Next up: ${data.calendar.nextEvent.title} at ${data.calendar.nextEvent.time}\n\n`;
  }

  if (data.tasks.dueToday.length > 0) {
    message += `✅ ${data.tasks.dueToday.length} tasks due today\n`;
  }
  if (data.tasks.overdue.length > 0) {
    message += `⚠️ ${data.tasks.overdue.length} overdue\n`;
  }

  message += `\n🎯 Top priorities:\n`;
  briefing.priorityActions.slice(0, 3).forEach((a, i) => {
    message += `${i + 1}. ${a}\n`;
  });

  message += `\n${briefing.closingMessage}`;

  return message;
}

/**
 * Send briefing via Slack
 */
async function sendViaSlack(userId: string, channelId: string, blocks: any[], fallbackText: string): Promise<boolean> {
  try {
    const credentials = await getSlackCredentials(userId);
    if (!credentials) return false;

    const result = await sendSlackMessage(credentials.accessToken, {
      channel: channelId,
      text: fallbackText,
      blocks,
    });

    return result.ok;
  } catch (error) {
    console.error("Failed to send Slack briefing:", error);
    return false;
  }
}

/**
 * Send briefing via Telegram
 */
async function sendViaTelegram(chatId: string, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error("Failed to send Telegram briefing:", error);
    return false;
  }
}

/**
 * Send briefing via WhatsApp
 */
async function sendViaWhatsApp(toNumber: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) return false;

  try {
    const formattedTo = toNumber.startsWith("whatsapp:") ? toNumber : `whatsapp:${toNumber}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: TWILIO_WHATSAPP_FROM,
          Body: message,
        }),
      }
    );

    const result = await response.json();
    return !result.error_code;
  } catch (error) {
    console.error("Failed to send WhatsApp briefing:", error);
    return false;
  }
}

/**
 * Generate and deliver morning briefing to a user
 */
export async function deliverMorningBriefing(prefs: UserBriefingPrefs): Promise<{
  success: boolean;
  channel: BriefingChannel;
  error?: string;
}> {
  try {
    // Gather data
    const data = await gatherBriefingData(prefs.userId, prefs.organizationId);

    // Generate content
    const briefing = await generateBriefingContent(data, "concise");

    // Deliver via preferred channel
    let sent = false;

    switch (prefs.preferredChannel) {
      case "slack":
        if (prefs.slackChannelId) {
          const blocks = formatForSlack(data, briefing);
          sent = await sendViaSlack(prefs.userId, prefs.slackChannelId, blocks, briefing.summary);
        }
        break;

      case "telegram":
        if (prefs.telegramChatId) {
          const telegramMsg = formatForTelegram(data, briefing);
          sent = await sendViaTelegram(prefs.telegramChatId, telegramMsg);
        }
        break;

      case "whatsapp":
        if (prefs.whatsappNumber) {
          const whatsappMsg = formatForWhatsApp(data, briefing);
          sent = await sendViaWhatsApp(prefs.whatsappNumber, whatsappMsg);
        }
        break;

      case "in_app":
        // Store as notification
        const supabase = createAdminClient();
        const { error } = await supabase.from("notifications").insert({
          user_id: prefs.userId,
          type: "morning_briefing",
          title: `Good Morning, ${data.user.name}!`,
          message: briefing.summary,
          data: { briefing, data },
        });
        sent = !error;
        break;
    }

    // Log the briefing
    const supabase = createAdminClient();
    await supabase.from("briefing_history").insert({
      user_id: prefs.userId,
      channel: prefs.preferredChannel,
      briefing_data: data,
      briefing_content: briefing,
      delivered: sent,
      delivered_at: sent ? new Date().toISOString() : null,
    }).catch(() => {}); // Don't fail if logging fails

    return {
      success: sent,
      channel: prefs.preferredChannel,
      error: sent ? undefined : "Failed to deliver via " + prefs.preferredChannel,
    };
  } catch (error: any) {
    console.error("Failed to deliver morning briefing:", error);
    return {
      success: false,
      channel: prefs.preferredChannel,
      error: error.message,
    };
  }
}

/**
 * Get user's briefing preferences
 */
export async function getUserBriefingPrefs(userId: string): Promise<UserBriefingPrefs | null> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      organization_id,
      full_name,
      email,
      telegram_chat_id,
      whatsapp_number,
      slack_channel_id,
      notification_preferences
    `)
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const prefs = (profile.notification_preferences as any) || {};

  return {
    userId: profile.id,
    organizationId: profile.organization_id,
    preferredChannel: prefs.preferred_channel || "in_app",
    briefingTime: prefs.briefing_time || "08:00",
    timezone: prefs.timezone || "America/New_York",
    enabled: prefs.briefing_enabled !== false,
    slackChannelId: profile.slack_channel_id,
    telegramChatId: profile.telegram_chat_id,
    whatsappNumber: profile.whatsapp_number,
    email: profile.email,
    includeWeather: prefs.include_weather !== false,
    includeQuote: prefs.include_quote !== false,
    briefingStyle: prefs.briefing_style || "concise",
  };
}

/**
 * Process scheduled briefings for all users
 * Called by cron job
 */
export async function processScheduledBriefings(): Promise<{
  processed: number;
  delivered: number;
  failed: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Get all users with briefings enabled
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, organization_id, notification_preferences, telegram_chat_id, whatsapp_number, slack_channel_id")
    .not("notification_preferences", "is", null);

  if (!profiles || profiles.length === 0) {
    return { processed: 0, delivered: 0, failed: 0 };
  }

  let processed = 0;
  let delivered = 0;
  let failed = 0;

  for (const profile of profiles) {
    const prefs = (profile.notification_preferences as any) || {};

    // Check if briefings are enabled
    if (prefs.briefing_enabled === false) continue;

    // Check if it's time for this user's briefing (within 15 min window)
    const briefingTime = prefs.briefing_time || "08:00";
    const [targetHour, targetMinute] = briefingTime.split(":").map(Number);

    // Check if we're within the briefing window
    const isInWindow = currentHour === targetHour &&
                       currentMinute >= targetMinute &&
                       currentMinute < targetMinute + 15;

    if (!isInWindow) continue;

    // Check if we already sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: alreadySent } = await supabase
      .from("briefing_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("created_at", todayStart.toISOString());

    if ((alreadySent || 0) > 0) continue;

    processed++;

    // Build prefs object
    const userPrefs: UserBriefingPrefs = {
      userId: profile.id,
      organizationId: profile.organization_id,
      preferredChannel: prefs.preferred_channel || "in_app",
      briefingTime,
      timezone: prefs.timezone || "America/New_York",
      enabled: true,
      slackChannelId: profile.slack_channel_id,
      telegramChatId: profile.telegram_chat_id,
      whatsappNumber: profile.whatsapp_number,
      includeWeather: prefs.include_weather !== false,
      includeQuote: prefs.include_quote !== false,
      briefingStyle: prefs.briefing_style || "concise",
    };

    // Deliver briefing
    const result = await deliverMorningBriefing(userPrefs);

    if (result.success) {
      delivered++;
    } else {
      failed++;
    }
  }

  console.log(`Briefings processed: ${processed}, delivered: ${delivered}, failed: ${failed}`);

  return { processed, delivered, failed };
}
