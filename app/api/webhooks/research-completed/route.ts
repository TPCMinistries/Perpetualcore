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
 * POST /api/webhooks/research-completed
 * Called by n8n after completing research
 *
 * Expected payload:
 * {
 *   research_id: string (required)
 *   status: "completed" | "failed"
 *   executive_summary?: string
 *   key_findings?: string[]
 *   recommendations?: string[]
 *   research_output?: object (full structured output)
 *   sources?: [{url, title, relevance, snippet}]
 *   confidence_score?: number (0-1)
 *   error_message?: string (if failed)
 *   workflow_execution_id?: string
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Validate required fields
    if (!payload.research_id) {
      return Response.json({ error: "research_id is required" }, { status: 400 });
    }

    // Get the existing research request
    const { data: existingRequest, error: fetchError } = await supabase
      .from("research_requests")
      .select("id, user_id, subject, request_type")
      .eq("id", payload.research_id)
      .single();

    if (fetchError || !existingRequest) {
      return Response.json({ error: "Research request not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, any> = {
      status: payload.status || "completed",
      processing_completed_at: new Date().toISOString(),
      n8n_workflow_id: payload.workflow_execution_id || null,
      updated_at: new Date().toISOString(),
    };

    if (payload.status === "completed") {
      updateData.executive_summary = payload.executive_summary || null;
      updateData.key_findings = payload.key_findings || [];
      updateData.recommendations = payload.recommendations || [];
      updateData.research_output = payload.research_output || {};
      updateData.sources = payload.sources || [];
      updateData.confidence_score = payload.confidence_score || null;
    } else if (payload.status === "failed") {
      updateData.error_message = payload.error_message || "Research failed";
    }

    // Update the research request
    const { data: request, error: updateError } = await supabase
      .from("research_requests")
      .update(updateData)
      .eq("id", payload.research_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update research request:", updateError);
      return Response.json({
        error: "Failed to update research request",
        details: updateError.message
      }, { status: 500 });
    }

    // Log the automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: existingRequest.user_id,
      workflow_name: "research-processor",
      workflow_type: "research_processor",
      workflow_id: payload.workflow_execution_id,
      status: payload.status === "completed" ? "success" : "error",
      input_summary: `Research: ${existingRequest.subject}`,
      output_summary: payload.status === "completed"
        ? `Found ${payload.key_findings?.length || 0} findings, ${payload.sources?.length || 0} sources`
        : payload.error_message || "Research failed",
      execution_time_ms: executionTime,
      error_message: payload.status === "failed" ? payload.error_message : null,
      source_type: "research",
      source_id: payload.research_id,
      metadata: {
        request_type: existingRequest.request_type,
        confidence_score: payload.confidence_score,
        findings_count: payload.key_findings?.length || 0,
        sources_count: payload.sources?.length || 0,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: existingRequest.user_id,
      type: payload.status === "completed" ? "research_complete" : "research_failed",
      title: payload.status === "completed"
        ? `Research Complete: ${existingRequest.subject}`
        : `Research Failed: ${existingRequest.subject}`,
      message: payload.status === "completed"
        ? payload.executive_summary?.substring(0, 200) || "Research completed successfully"
        : payload.error_message || "Research processing failed",
      data: {
        research_id: payload.research_id,
        request_type: existingRequest.request_type,
      },
      action_url: `/dashboard/research/${payload.research_id}`,
    }).catch(() => {
      // Notifications table might not exist, ignore error
    });

    return Response.json({
      success: true,
      research_id: payload.research_id,
      status: payload.status,
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("research-completed webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/research-completed
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "research-completed",
    description: "POST to update research request with AI findings",
  });
}
