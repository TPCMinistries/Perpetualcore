import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Service role client for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/automation-log
 * Called by ANY n8n workflow to log its execution
 *
 * Expected payload:
 * {
 *   user_id?: string (optional - may not be known for some workflows)
 *   workflow_name: string (required)
 *   workflow_type?: string (meeting_processor, daily_briefing, etc.)
 *   workflow_id?: string (n8n workflow ID)
 *   status: "success" | "error" | "pending" | "running"
 *   input_summary?: string
 *   output_summary?: string
 *   execution_time_ms?: number
 *   error_message?: string
 *   error_details?: object
 *   source_type?: string (meeting, contact, task, etc.)
 *   source_id?: string (UUID of processed item)
 *   metadata?: object
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Validate required fields
    if (!payload.workflow_name) {
      return Response.json({ error: "workflow_name is required" }, { status: 400 });
    }

    // Insert automation log
    const { data: log, error } = await supabase
      .from("automation_logs")
      .insert({
        user_id: payload.user_id || null,
        workflow_name: payload.workflow_name,
        workflow_type: payload.workflow_type || null,
        workflow_id: payload.workflow_id || null,
        status: payload.status || "success",
        input_summary: payload.input_summary || null,
        output_summary: payload.output_summary || null,
        execution_time_ms: payload.execution_time_ms || null,
        error_message: payload.error_message || null,
        error_details: payload.error_details || null,
        source_type: payload.source_type || null,
        source_id: payload.source_id || null,
        metadata: payload.metadata || {},
        started_at: payload.started_at || null,
        completed_at: payload.completed_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert automation log:", error);
      return Response.json({
        error: "Failed to log automation",
        details: error.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      log_id: log.id,
    });

  } catch (error: any) {
    console.error("automation-log webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/automation-log
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "automation-log",
    description: "POST to log any n8n workflow execution",
  });
}
