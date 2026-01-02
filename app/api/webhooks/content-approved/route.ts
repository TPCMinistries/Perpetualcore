import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/content-approved
 * Called when user approves content in UI
 * Triggers n8n workflow to post to social media
 *
 * Body: {
 *   contentId: string,
 *   platforms: string[],  // ['linkedin', 'twitter', etc.]
 *   scheduledFor?: string, // ISO date string for scheduled posting
 *   postNow?: boolean     // If true, post immediately
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, platforms, scheduledFor, postNow } = body;

    if (!contentId) {
      return Response.json({ error: "contentId is required" }, { status: 400 });
    }

    // Fetch the content
    const { data: content, error: fetchError } = await supabase
      .from("content_queue")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !content) {
      return Response.json({ error: "Content not found" }, { status: 404 });
    }

    // Update content status to approved
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("content_queue")
      .update({
        status: scheduledFor ? "scheduled" : "approved",
        scheduled_for: scheduledFor || null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_requested_at: new Date().toISOString(),
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Error updating content:", updateError);
      return Response.json({ error: "Failed to update content" }, { status: 500 });
    }

    // Trigger n8n workflow if configured
    const n8nWebhookUrl = process.env.N8N_CONTENT_WEBHOOK_URL;

    if (n8nWebhookUrl && (postNow || scheduledFor)) {
      try {
        const webhookPayload = {
          event: "content.approved",
          contentId: content.id,
          title: content.title,
          content: content.final_content || content.draft_content,
          contentType: content.content_type,
          platforms: platforms || [content.platform],
          scheduledFor: scheduledFor || null,
          postNow: postNow || false,
          userId: user.id,
          approvedAt: new Date().toISOString(),
        };

        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!n8nResponse.ok) {
          console.error("n8n webhook failed:", await n8nResponse.text());
          // Don't fail the whole request, just log it
        }

        // Log the automation
        await adminClient.from("automation_logs").insert({
          organization_id: content.organization_id,
          user_id: user.id,
          automation_type: "n8n",
          automation_name: "Content Posting Pipeline",
          status: n8nResponse.ok ? "success" : "failed",
          trigger_type: "webhook",
          trigger_source: "content_approval",
          input_data: webhookPayload,
        });
      } catch (webhookError) {
        console.error("Error triggering n8n webhook:", webhookError);
        // Log failed automation
        await adminClient.from("automation_logs").insert({
          organization_id: content.organization_id,
          user_id: user.id,
          automation_type: "n8n",
          automation_name: "Content Posting Pipeline",
          status: "failed",
          trigger_type: "webhook",
          trigger_source: "content_approval",
          error_message: String(webhookError),
        });
      }
    }

    return Response.json({
      success: true,
      message: scheduledFor
        ? `Content scheduled for ${new Date(scheduledFor).toLocaleString()}`
        : postNow
        ? "Content approved and posting initiated"
        : "Content approved",
      contentId,
      status: scheduledFor ? "scheduled" : "approved",
    });
  } catch (error) {
    console.error("Content approval webhook error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
