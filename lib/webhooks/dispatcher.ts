import { createClient } from "@/lib/supabase/server";
import { createHmac } from "crypto";

export interface WebhookEvent {
  type: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookDelivery {
  deliveryId: string;
  webhookId: string;
  url: string;
  secret: string;
  headers: Record<string, string>;
  eventType: string;
  payload: Record<string, any>;
  attemptCount: number;
  timeoutSeconds: number;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId: string;
  status?: number;
  responseTimeMs?: number;
  error?: string;
}

/**
 * Dispatch a webhook event to all subscribed webhooks
 */
export async function dispatchWebhook(
  organizationId: string,
  eventType: string,
  data: Record<string, any>
): Promise<{ dispatched: number; webhookIds: string[] }> {
  const supabase = await createClient();

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  const { data: results, error } = await supabase.rpc("dispatch_webhook", {
    p_org_id: organizationId,
    p_event_type: eventType,
    p_payload: payload,
  });

  if (error) {
    console.error("[Webhooks] Error dispatching:", error);
    return { dispatched: 0, webhookIds: [] };
  }

  const webhookIds = (results || []).map((r: any) => r.webhook_id);

  console.log(`[Webhooks] Dispatched ${eventType} to ${webhookIds.length} webhooks`);

  return {
    dispatched: webhookIds.length,
    webhookIds,
  };
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: string
): string {
  const signaturePayload = `${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signaturePayload).digest("hex");
}

/**
 * Deliver a single webhook
 */
export async function deliverWebhook(
  delivery: WebhookDelivery
): Promise<DeliveryResult> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    const payload = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateWebhookSignature(payload, delivery.secret, timestamp);

    const response = await fetch(delivery.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `v1=${signature}`,
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-ID": delivery.webhookId,
        "X-Delivery-ID": delivery.deliveryId,
        ...(delivery.headers || {}),
      },
      body: payload,
      signal: AbortSignal.timeout(delivery.timeoutSeconds * 1000),
    });

    const responseTimeMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => "");

    const success = response.status >= 200 && response.status < 300;

    // Mark delivery result
    await supabase.rpc("mark_webhook_delivery", {
      p_delivery_id: delivery.deliveryId,
      p_success: success,
      p_response_status: response.status,
      p_response_body: responseBody.substring(0, 1000), // Limit stored response
      p_response_time_ms: responseTimeMs,
      p_error_message: success ? null : `HTTP ${response.status}`,
    });

    return {
      success,
      deliveryId: delivery.deliveryId,
      status: response.status,
      responseTimeMs,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Mark delivery failed
    await supabase.rpc("mark_webhook_delivery", {
      p_delivery_id: delivery.deliveryId,
      p_success: false,
      p_response_status: null,
      p_response_body: null,
      p_response_time_ms: responseTimeMs,
      p_error_message: errorMessage,
    });

    return {
      success: false,
      deliveryId: delivery.deliveryId,
      responseTimeMs,
      error: errorMessage,
    };
  }
}

/**
 * Process pending webhook deliveries (for cron job)
 */
export async function processPendingDeliveries(
  limit: number = 100
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: DeliveryResult[];
}> {
  const supabase = await createClient();

  // Get pending deliveries
  const { data: pending, error } = await supabase.rpc(
    "get_pending_webhook_deliveries",
    { p_limit: limit }
  );

  if (error) {
    console.error("[Webhooks] Error getting pending deliveries:", error);
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  if (!pending || pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  console.log(`[Webhooks] Processing ${pending.length} pending deliveries`);

  // Process deliveries in parallel (with concurrency limit)
  const CONCURRENCY = 10;
  const results: DeliveryResult[] = [];

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((d: any) =>
        deliverWebhook({
          deliveryId: d.delivery_id,
          webhookId: d.webhook_id,
          url: d.url,
          secret: d.secret,
          headers: d.headers || {},
          eventType: d.event_type,
          payload: d.payload,
          attemptCount: d.attempt_count,
          timeoutSeconds: d.timeout_seconds || 30,
        })
      )
    );
    results.push(...batchResults);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`[Webhooks] Processed: ${results.length}, Success: ${succeeded}, Failed: ${failed}`);

  return {
    processed: results.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Webhook event types
 */
export const WEBHOOK_EVENTS = {
  // Chat
  CHAT_MESSAGE_CREATED: "chat.message.created",
  CHAT_MESSAGE_UPDATED: "chat.message.updated",
  CHAT_CONVERSATION_CREATED: "chat.conversation.created",

  // Documents
  DOCUMENT_UPLOADED: "document.uploaded",
  DOCUMENT_PROCESSED: "document.processed",
  DOCUMENT_DELETED: "document.deleted",

  // Workflows
  WORKFLOW_TRIGGERED: "workflow.triggered",
  WORKFLOW_COMPLETED: "workflow.completed",
  WORKFLOW_FAILED: "workflow.failed",

  // Agents
  AGENT_TASK_STARTED: "agent.task.started",
  AGENT_TASK_COMPLETED: "agent.task.completed",
  AGENT_TASK_FAILED: "agent.task.failed",

  // Users
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",

  // Billing
  BILLING_USAGE_THRESHOLD: "billing.usage.threshold",
  BILLING_SUBSCRIPTION_CHANGED: "billing.subscription.changed",
} as const;

/**
 * Helper to trigger common events
 */
export const webhookEvents = {
  async chatMessageCreated(orgId: string, data: { conversationId: string; messageId: string; content: string; role: string }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.CHAT_MESSAGE_CREATED, data);
  },

  async documentUploaded(orgId: string, data: { documentId: string; filename: string; mimeType: string; size: number }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.DOCUMENT_UPLOADED, data);
  },

  async documentProcessed(orgId: string, data: { documentId: string; chunks: number; status: string }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.DOCUMENT_PROCESSED, data);
  },

  async workflowTriggered(orgId: string, data: { workflowId: string; executionId: string; triggeredBy: string }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.WORKFLOW_TRIGGERED, data);
  },

  async workflowCompleted(orgId: string, data: { workflowId: string; executionId: string; result: any }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.WORKFLOW_COMPLETED, data);
  },

  async agentTaskCompleted(orgId: string, data: { agentId: string; taskId: string; result: any }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.AGENT_TASK_COMPLETED, data);
  },

  async usageThreshold(orgId: string, data: { meterType: string; threshold: number; currentPercentage: number }) {
    return dispatchWebhook(orgId, WEBHOOK_EVENTS.BILLING_USAGE_THRESHOLD, data);
  },
};
