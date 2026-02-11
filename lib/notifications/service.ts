import { createAdminClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

export type NotificationType =
  | "task_due"
  | "task_assigned"
  | "email_important"
  | "email_mention"
  | "calendar_event"
  | "calendar_reminder"
  | "document_shared"
  | "document_comment"
  | "whatsapp_message"
  | "system_alert"
  | "ai_insight"
  | "usage_limit";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  priority?: NotificationPriority;
}

/**
 * Create a notification with AI prioritization
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = createAdminClient();

  // Check user preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", params.userId)
    .single();

  if (!prefs || !shouldSendNotification(params.type, prefs)) {
    return { success: false, reason: "User preferences disabled" };
  }

  // AI prioritization
  let aiPriorityScore: number | null = null;
  let aiUrgencyReason: string | null = null;
  let finalPriority = params.priority || "medium";

  if (prefs.enable_ai_prioritization) {
    const aiResult = await calculateAIPriority(params);
    aiPriorityScore = aiResult.score;
    aiUrgencyReason = aiResult.reason;
    finalPriority = aiResult.priority;
  }

  // Check quiet hours
  if (isQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)) {
    // Snooze until quiet hours end, unless urgent
    if (finalPriority !== "urgent") {
      const snoozeUntil = calculateQuietHoursEnd(prefs.quiet_hours_end);
      await createSnoozedNotification(params, snoozeUntil);
      return { success: true, snoozed: true };
    }
  }

  // Create notification
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      type: params.type,
      priority: finalPriority,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      action_label: params.actionLabel,
      related_entity_type: params.relatedEntityType,
      related_entity_id: params.relatedEntityId,
      metadata: params.metadata || {},
      ai_priority_score: aiPriorityScore,
      ai_urgency_reason: aiUrgencyReason,
      delivered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }

  // Send via additional channels if enabled
  if (prefs.enable_email && finalPriority === "urgent") {
    await sendEmailNotification(params);
  }

  return { success: true, notification: data };
}

/**
 * Calculate AI priority using GPT
 */
async function calculateAIPriority(params: CreateNotificationParams): Promise<{
  score: number;
  reason: string;
  priority: NotificationPriority;
}> {
  try {
    const prompt = `Analyze this notification and determine its urgency:

Type: ${params.type}
Title: ${params.title}
Message: ${params.message}

Consider:
1. Time sensitivity (is there a deadline?)
2. Impact (how important is this to the user?)
3. Context (related to ongoing work?)
4. Actionability (requires immediate action?)

Respond in JSON format:
{
  "score": 0.0-1.0,
  "reason": "Brief explanation",
  "priority": "low|medium|high|urgent"
}`;

    const response = await getChatCompletion("gpt-4o-mini", [
      {
        role: "system",
        content:
          "You are a notification prioritization AI. Analyze notifications and determine urgency accurately.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const result = JSON.parse(response);
    return {
      score: Math.max(0, Math.min(1, result.score)),
      reason: result.reason,
      priority: result.priority,
    };
  } catch (error) {
    console.error("AI prioritization error:", error);
    return {
      score: 0.5,
      reason: "Default priority",
      priority: "medium",
    };
  }
}

/**
 * Check if notification type is enabled in preferences
 */
function shouldSendNotification(
  type: NotificationType,
  prefs: any
): boolean {
  const prefMap: Record<NotificationType, string> = {
    task_due: "enable_task_due",
    task_assigned: "enable_task_assigned",
    email_important: "enable_email_important",
    email_mention: "enable_email_mention",
    calendar_event: "enable_calendar_event",
    calendar_reminder: "enable_calendar_reminder",
    document_shared: "enable_document_shared",
    document_comment: "enable_document_comment",
    whatsapp_message: "enable_whatsapp_message",
    system_alert: "enable_system_alert",
    ai_insight: "enable_ai_insight",
    usage_limit: "enable_usage_limit",
  };

  const prefKey = prefMap[type];
  return prefs[prefKey] !== false;
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  const quietStart = startHour * 60 + startMin;
  const quietEnd = endHour * 60 + endMin;

  if (quietStart < quietEnd) {
    return currentTime >= quietStart && currentTime < quietEnd;
  } else {
    // Quiet hours span midnight
    return currentTime >= quietStart || currentTime < quietEnd;
  }
}

/**
 * Calculate when quiet hours end
 */
function calculateQuietHoursEnd(end: string): Date {
  const [hour, minute] = end.split(":").map(Number);
  const endTime = new Date();
  endTime.setHours(hour, minute, 0, 0);

  const now = new Date();
  if (endTime < now) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return endTime;
}

/**
 * Create snoozed notification
 */
async function createSnoozedNotification(
  params: CreateNotificationParams,
  snoozeUntil: Date
) {
  const supabase = createAdminClient();

  await supabase.from("notifications").insert({
    user_id: params.userId,
    organization_id: params.organizationId,
    type: params.type,
    priority: params.priority || "medium",
    title: params.title,
    message: params.message,
    action_url: params.actionUrl,
    action_label: params.actionLabel,
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    metadata: params.metadata || {},
    snoozed_until: snoozeUntil.toISOString(),
  });
}

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(params: CreateNotificationParams) {
  try {
    // Import email service
    const { sendEmail } = await import("@/lib/email");
    
    // Get user email
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", params.userId)
      .single();
    
    if (!profile?.email) {
      console.warn("No email found for user:", params.userId);
      return;
    }
    
    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Perpetual Core Notification</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 600;">${params.title}</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">${params.message}</p>
              ${params.actionUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${params.actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">${params.actionLabel || 'View Details'}</a>
                </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">This is an automated notification from Perpetual Core</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    // Send email
    await sendEmail(
      profile.email,
      params.title,
      html
    );
    
    console.log("Email notification sent:", params.title);
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Don't throw - email failure shouldn't break notification creation
  }
}

/**
 * Get user's unread notifications
 * Note: Notifications table may not exist in current deployed schema
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Table doesn't exist yet - return empty array silently
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return [];
      }
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    // Suppress errors if notifications table doesn't exist
    return [];
  }
}

/**
 * Get notification count
 * Note: Notifications table may not exist in current deployed schema
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      // Table doesn't exist yet - return 0 silently
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return 0;
      }
      console.error("Error getting unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    // Suppress errors if notifications table doesn't exist
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return { success: !error, error };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select("*", { count: "exact", head: true });

  return { success: !error, count: count || 0 };
}

/**
 * Snooze notification
 */
export async function snoozeNotification(
  notificationId: string,
  userId: string,
  duration: "1h" | "3h" | "1d" | "3d" | "1w"
) {
  const durationMap = {
    "1h": 60,
    "3h": 180,
    "1d": 1440,
    "3d": 4320,
    "1w": 10080,
  };

  const minutes = durationMap[duration];
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("notifications")
    .update({ snoozed_until: snoozeUntil.toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return { success: !error, error };
}

/**
 * Create task due notification
 */
export async function notifyTaskDue(
  userId: string,
  organizationId: string,
  task: any
) {
  await createNotification({
    userId,
    organizationId,
    type: "task_due",
    title: "Task Due Soon",
    message: `"${task.title}" is due ${formatDueDate(task.due_date)}`,
    actionUrl: `/dashboard/tasks?id=${task.id}`,
    actionLabel: "View Task",
    relatedEntityType: "task",
    relatedEntityId: task.id,
    priority: "high",
  });
}

/**
 * Create important email notification
 */
export async function notifyImportantEmail(
  userId: string,
  organizationId: string,
  email: any
) {
  await createNotification({
    userId,
    organizationId,
    type: "email_important",
    title: "Important Email",
    message: `From: ${email.from_address} - ${email.subject}`,
    actionUrl: `/dashboard/email?id=${email.id}`,
    actionLabel: "Read Email",
    relatedEntityType: "email",
    relatedEntityId: email.id,
  });
}

/**
 * Create calendar reminder notification
 */
export async function notifyCalendarEvent(
  userId: string,
  organizationId: string,
  event: any,
  minutesBefore: number
) {
  await createNotification({
    userId,
    organizationId,
    type: "calendar_reminder",
    title: "Upcoming Event",
    message: `"${event.title}" starts in ${minutesBefore} minutes`,
    actionUrl: `/dashboard/calendar?id=${event.id}`,
    actionLabel: "View Event",
    relatedEntityType: "calendar_event",
    relatedEntityId: event.id,
    priority: minutesBefore <= 15 ? "high" : "medium",
  });
}

/**
 * Create AI insight notification
 */
export async function notifyAIInsight(
  userId: string,
  organizationId: string,
  insight: string,
  context?: any
) {
  await createNotification({
    userId,
    organizationId,
    type: "ai_insight",
    title: "AI Insight",
    message: insight,
    metadata: { context },
  });
}

/**
 * Format due date for display
 */
function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "in less than an hour";
  if (diffHours < 24) return `in ${diffHours} hours`;
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}
