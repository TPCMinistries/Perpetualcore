import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/work-item-stage
 * Webhook endpoint to notify external systems (n8n) when work items change stages
 * Called internally after stage transitions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      work_item_id,
      team_id,
      from_stage,
      to_stage,
      item_title,
      item_type,
      priority,
      assigned_to,
      custom_fields,
      trigger_source = "manual",
    } = body;

    if (!work_item_id || !to_stage) {
      return NextResponse.json(
        { error: "work_item_id and to_stage are required" },
        { status: 400 }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_WORK_ITEM_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.log("[Webhook] N8N_WORK_ITEM_WEBHOOK_URL not configured, skipping n8n notification");
      return NextResponse.json({
        success: true,
        message: "Stage change recorded (n8n not configured)"
      });
    }

    // Build payload for n8n
    const payload = {
      event: "work_item.stage_changed",
      timestamp: new Date().toISOString(),
      data: {
        work_item_id,
        team_id,
        from_stage,
        to_stage,
        item_title,
        item_type,
        priority,
        assigned_to,
        custom_fields,
        trigger_source,
      },
    };

    // Send to n8n webhook
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!n8nResponse.ok) {
        console.error("[Webhook] n8n webhook failed:", await n8nResponse.text());
      } else {
        console.log("[Webhook] Successfully notified n8n of stage change");
      }
    } catch (n8nError) {
      console.error("[Webhook] Failed to call n8n:", n8nError);
      // Don't fail the request if n8n is unavailable
    }

    return NextResponse.json({
      success: true,
      message: "Stage change webhook processed",
      payload,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/work-item-stage
 * Health check and configuration info
 */
export async function GET() {
  const configured = !!process.env.N8N_WORK_ITEM_WEBHOOK_URL;

  return NextResponse.json({
    endpoint: "/api/webhooks/work-item-stage",
    configured,
    events: ["work_item.stage_changed"],
    payload_schema: {
      event: "string",
      timestamp: "ISO8601",
      data: {
        work_item_id: "uuid",
        team_id: "uuid",
        from_stage: "string",
        to_stage: "string",
        item_title: "string",
        item_type: "string (candidate|lead|budget_item|etc)",
        priority: "string (low|medium|high|urgent)",
        assigned_to: "uuid|null",
        custom_fields: "object",
        trigger_source: "string (manual|automation|ai)",
      },
    },
  });
}
