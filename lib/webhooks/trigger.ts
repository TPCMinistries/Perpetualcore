import { createClient } from "@/lib/supabase/server";
import { createHmac } from "crypto";

export interface WebhookPayload {
  event: string;
  user_id: string;
  organization_id: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Trigger webhooks for a specific event
 * This sends the event to all registered webhook URLs for the user/org
 */
export async function triggerWebhooks(
  event: string,
  userId: string,
  organizationId: string,
  data: Record<string, any>
): Promise<{ sent: number; failed: number }> {
  const supabase = await createClient();

  // Get all active webhooks subscribed to this event
  const { data: webhooks, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("is_active", true)
    .contains("events", [event]);

  if (error || !webhooks || webhooks.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload: WebhookPayload = {
    event,
    user_id: userId,
    organization_id: organizationId,
    timestamp: new Date().toISOString(),
    data,
  };

  let sent = 0;
  let failed = 0;

  // Send to each webhook
  await Promise.all(
    webhooks.map(async (webhook) => {
      try {
        const signature = createHmac("sha256", webhook.secret)
          .update(JSON.stringify(payload))
          .digest("hex");

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
            "X-Webhook-Timestamp": payload.timestamp,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          sent++;
          // Update success count
          await supabase
            .from("webhooks")
            .update({
              success_count: webhook.success_count + 1,
              last_triggered_at: new Date().toISOString(),
            })
            .eq("id", webhook.id);
        } else {
          failed++;
          // Update failure count
          await supabase
            .from("webhooks")
            .update({
              failure_count: webhook.failure_count + 1,
              last_error: `HTTP ${response.status}: ${response.statusText}`,
              last_triggered_at: new Date().toISOString(),
            })
            .eq("id", webhook.id);
        }
      } catch (err: any) {
        failed++;
        await supabase
          .from("webhooks")
          .update({
            failure_count: webhook.failure_count + 1,
            last_error: err.message || "Unknown error",
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", webhook.id);
      }
    })
  );

  return { sent, failed };
}

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = {
  // Tasks
  "task.created": "When a new task is created",
  "task.completed": "When a task is marked complete",
  "task.updated": "When a task is updated",
  "task.deleted": "When a task is deleted",
  "task.due_soon": "When a task is due within 24 hours",
  "task.overdue": "When a task becomes overdue",

  // Contacts
  "contact.created": "When a new contact is added",
  "contact.updated": "When a contact is updated",
  "contact.enriched": "When contact data is enriched by AI",

  // Projects
  "project.created": "When a new project is created",
  "project.updated": "When a project is updated",
  "project.completed": "When a project is marked complete",

  // Documents
  "document.uploaded": "When a document is uploaded",
  "document.processed": "When document processing completes",

  // Meetings
  "meeting.scheduled": "When a meeting is scheduled",
  "meeting.processed": "When meeting transcript is processed",
  "meeting.action_items": "When action items are extracted",

  // Leads
  "lead.created": "When a new lead is captured",
  "lead.scored": "When a lead score changes",
  "lead.converted": "When a lead is converted",

  // Automation
  "automation.started": "When an automation begins",
  "automation.completed": "When an automation finishes",
  "automation.failed": "When an automation fails",

  // AI
  "ai.insight": "When AI generates an insight",
  "ai.suggestion": "When AI has a suggestion",

  // Email
  "email.received": "When a new email arrives",
  "email.sent": "When an email is sent",
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;
