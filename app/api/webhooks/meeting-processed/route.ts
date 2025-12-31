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
 * POST /api/webhooks/meeting-processed
 * Called by n8n after processing a meeting transcript with AI
 *
 * Expected payload from n8n:
 * {
 *   user_id: string (required)
 *   meeting_title: string
 *   meeting_date: string (ISO date)
 *   meeting_type: string
 *   attendees: string[]
 *   transcript: string
 *   executive_summary: string
 *   key_topics: string[]
 *   decisions_made: string[]
 *   action_items: Array<{title, assigned_to?, due_date?, priority?}>
 *   promises: Array<{text, direction, promised_by?, promised_to?, deadline?}>
 *   sentiment: string
 *   opportunities_detected: object
 *   project_tags: string[]
 *   source: string (fathom, zoom, manual, etc.)
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

    // Insert meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        user_id: payload.user_id,
        meeting_title: payload.meeting_title || "Untitled Meeting",
        meeting_date: payload.meeting_date || new Date().toISOString(),
        meeting_type: payload.meeting_type || "other",
        attendees: payload.attendees || [],
        transcript: payload.transcript || null,
        executive_summary: payload.executive_summary || null,
        key_topics: payload.key_topics || [],
        decisions_made: payload.decisions_made || [],
        next_steps: payload.action_items?.map((a: any) =>
          typeof a === "string" ? a : a.title
        ) || [],
        project_tags: payload.project_tags || [],
        sentiment: payload.sentiment || "neutral",
        follow_up_needed: (payload.action_items?.length > 0) || (payload.promises?.length > 0),
        suggested_follow_up_date: payload.suggested_follow_up_date || null,
        opportunities_detected: payload.opportunities_detected || null,
        source: payload.source || "n8n",
        summary: payload.ai_analysis || null,
        webhook_payload: payload,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Failed to insert meeting:", meetingError);
      return Response.json({
        error: "Failed to save meeting",
        details: meetingError.message
      }, { status: 500 });
    }

    // Insert attendees into meeting_attendees
    if (payload.attendees && payload.attendees.length > 0) {
      const attendeeInserts = payload.attendees.map((attendee: string) => ({
        meeting_id: meeting.id,
        attendee_name: typeof attendee === "string" ? attendee : attendee.name,
        attendee_email: typeof attendee === "object" ? attendee.email : null,
      }));

      await supabase.from("meeting_attendees").insert(attendeeInserts);
    }

    // Insert promises
    let promisesCreated = 0;
    if (payload.promises && payload.promises.length > 0) {
      const promiseInserts = payload.promises.map((promise: any) => ({
        user_id: payload.user_id,
        meeting_id: meeting.id,
        promise_text: typeof promise === "string" ? promise : promise.text,
        direction: promise.direction || "made",
        promised_by: promise.promised_by || null,
        promised_to: promise.promised_to || null,
        deadline: promise.deadline || null,
        status: "open",
      }));

      const { data: promises, error: promiseError } = await supabase
        .from("promises")
        .insert(promiseInserts)
        .select();

      if (!promiseError && promises) {
        promisesCreated = promises.length;
      }
    }

    // Create tasks from action items
    let tasksCreated = 0;
    if (payload.action_items && payload.action_items.length > 0) {
      // Get user's organization_id for tasks
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", payload.user_id)
        .single();

      if (profile?.organization_id) {
        const taskInserts = payload.action_items.map((item: any) => ({
          user_id: payload.user_id,
          organization_id: profile.organization_id,
          title: typeof item === "string" ? item : item.title,
          description: typeof item === "object" ? item.description : null,
          status: "todo",
          priority: item.priority || "medium",
          due_date: item.due_date || null,
          source_type: "meeting",
          source_id: meeting.id,
          ai_extracted: true,
          ai_context: `From meeting: ${payload.meeting_title}`,
        }));

        const { data: tasks, error: taskError } = await supabase
          .from("tasks")
          .insert(taskInserts)
          .select();

        if (!taskError && tasks) {
          tasksCreated = tasks.length;
        }
      }
    }

    // Log the automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: payload.user_id,
      workflow_name: "meeting-processor",
      workflow_type: "meeting_processor",
      workflow_id: payload.workflow_execution_id,
      status: "success",
      input_summary: `Meeting: ${payload.meeting_title}`,
      output_summary: `Created meeting with ${promisesCreated} promises and ${tasksCreated} tasks`,
      execution_time_ms: executionTime,
      source_type: "meeting",
      source_id: meeting.id,
      metadata: {
        meeting_id: meeting.id,
        promises_created: promisesCreated,
        tasks_created: tasksCreated,
        attendees_count: payload.attendees?.length || 0,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      meeting_id: meeting.id,
      promises_created: promisesCreated,
      tasks_created: tasksCreated,
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("meeting-processed webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/meeting-processed
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "meeting-processed",
    description: "POST meeting data after n8n AI processing",
  });
}
