import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Service role client for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/content-generated
 * Called by n8n after AI generates content
 *
 * Expected payload:
 * {
 *   content_id: string (required)
 *   status: "draft" | "failed"
 *   generated_content: string
 *   hook?: string
 *   call_to_action?: string
 *   hashtags?: string[]
 *   ai_model?: string
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

    if (!payload.content_id) {
      return Response.json({ error: "content_id is required" }, { status: 400 });
    }

    // Get existing content
    const { data: existingContent, error: fetchError } = await supabase
      .from("content_queue")
      .select("id, user_id, title, content_type, platform")
      .eq("id", payload.content_id)
      .single();

    if (fetchError || !existingContent) {
      return Response.json({ error: "Content not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      n8n_workflow_id: payload.workflow_execution_id || null,
    };

    if (payload.status === "failed") {
      updateData.status = "failed";
      updateData.error_message = payload.error_message || "Content generation failed";
    } else {
      updateData.status = "draft";
      updateData.draft_content = payload.generated_content || null;
      updateData.ai_generated = true;
      updateData.ai_model = payload.ai_model || null;

      if (payload.hook) {
        updateData.hook = payload.hook;
      }
      if (payload.call_to_action) {
        updateData.call_to_action = payload.call_to_action;
      }
      if (payload.hashtags && Array.isArray(payload.hashtags)) {
        updateData.hashtags = payload.hashtags;
      }
    }

    // Update content
    const { data: content, error: updateError } = await supabase
      .from("content_queue")
      .update(updateData)
      .eq("id", payload.content_id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update content:", updateError);
      return Response.json({
        error: "Failed to update content",
        details: updateError.message
      }, { status: 500 });
    }

    // Log automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: existingContent.user_id,
      workflow_name: "content-generator",
      workflow_type: "content_generator",
      workflow_id: payload.workflow_execution_id,
      status: payload.status === "failed" ? "error" : "success",
      input_summary: `Generate ${existingContent.content_type}: ${existingContent.title}`,
      output_summary: payload.status === "failed"
        ? payload.error_message
        : `Generated ${payload.generated_content?.length || 0} chars`,
      execution_time_ms: executionTime,
      error_message: payload.status === "failed" ? payload.error_message : null,
      source_type: "content",
      source_id: payload.content_id,
      metadata: {
        content_type: existingContent.content_type,
        platform: existingContent.platform,
        ai_model: payload.ai_model,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      content_id: payload.content_id,
      status: payload.status || "draft",
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("content-generated webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/content-generated
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "content-generated",
    description: "POST to update content with AI-generated text",
  });
}
