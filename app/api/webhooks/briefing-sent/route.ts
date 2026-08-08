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
 * POST /api/webhooks/briefing-sent
 * Called by n8n after sending a pre-meeting briefing
 *
 * Expected payload:
 * {
 *   user_id: string (required)
 *   calendar_event_id?: string (links to calendar_events table)
 *   meeting_title?: string
 *   meeting_time?: string (ISO datetime)
 *   attendees?: string[]
 *   briefing_content: string | object (the briefing that was sent)
 *   sent_via: "email" | "whatsapp" | "telegram" | "slack"
 *   past_meetings_referenced?: string[] (UUIDs of meetings used for context)
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
    if (!payload.user_id) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    // Insert meeting briefing
    const { data: briefing, error: briefingError } = await supabase
      .from("meeting_briefings")
      .insert({
        user_id: payload.user_id,
        calendar_event_id: payload.calendar_event_id || null,
        meeting_title: payload.meeting_title || null,
        meeting_time: payload.meeting_time || null,
        attendees: payload.attendees || [],
        briefing_content: typeof payload.briefing_content === "string"
          ? { text: payload.briefing_content }
          : payload.briefing_content,
        past_meetings_referenced: payload.past_meetings_referenced || [],
        sent_at: new Date().toISOString(),
        sent_via: payload.sent_via || "email",
      })
      .select()
      .single();

    if (briefingError) {
      console.error("Failed to insert briefing:", briefingError);
      return Response.json({
        error: "Failed to save briefing",
        details: briefingError.message
      }, { status: 500 });
    }

    // Log the automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: payload.user_id,
      workflow_name: "pre-meeting-briefing",
      workflow_type: "briefing_generator",
      workflow_id: payload.workflow_execution_id,
      status: "success",
      input_summary: `Briefing for: ${payload.meeting_title || "meeting"}`,
      output_summary: `Sent via ${payload.sent_via || "email"}`,
      execution_time_ms: executionTime,
      source_type: "meeting_briefing",
      source_id: briefing.id,
      metadata: {
        briefing_id: briefing.id,
        calendar_event_id: payload.calendar_event_id,
        sent_via: payload.sent_via,
        attendees_count: payload.attendees?.length || 0,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      briefing_id: briefing.id,
      sent_via: payload.sent_via || "email",
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("briefing-sent webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/briefing-sent
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "briefing-sent",
    description: "POST to log a sent pre-meeting briefing",
  });
}
