import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/meetings/submit
 * Called from frontend to submit a new meeting for n8n processing
 *
 * This endpoint:
 * 1. Validates the user is authenticated
 * 2. Creates a pending meeting record
 * 3. Sends the meeting data to n8n for AI processing
 * 4. n8n will call /api/webhooks/meeting-processed when done
 *
 * Expected body:
 * {
 *   title: string (required)
 *   date: string (ISO date, required)
 *   type?: string (investor, coaching, team, etc.)
 *   attendees?: string[]
 *   transcript: string (required - the meeting transcript)
 *   source?: string (manual, fathom, zoom, etc.)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.transcript) {
      return Response.json({ error: "transcript is required" }, { status: 400 });
    }

    // Create a pending meeting record (will be updated by n8n webhook)
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        user_id: user.id,
        meeting_title: body.title,
        meeting_date: body.date || new Date().toISOString(),
        meeting_type: body.type || "other",
        attendees: body.attendees || [],
        transcript: body.transcript,
        source: body.source || "manual",
        // These will be filled by n8n after AI processing
        executive_summary: null,
        key_topics: [],
        decisions_made: [],
        next_steps: [],
        sentiment: null,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Failed to create meeting:", meetingError);
      return Response.json({
        error: "Failed to create meeting",
        details: meetingError.message
      }, { status: 500 });
    }

    // Send to n8n for AI processing
    const n8nWebhookUrl = process.env.N8N_MEETING_PROCESSOR_WEBHOOK;

    if (n8nWebhookUrl) {
      try {
        const n8nPayload = {
          meeting_id: meeting.id,
          user_id: user.id,
          title: body.title,
          date: body.date || new Date().toISOString(),
          type: body.type || "other",
          attendees: body.attendees || [],
          transcript: body.transcript,
          source: body.source || "manual",
          // Tell n8n where to send results
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/meeting-processed`,
        };

        // Fire and forget - don't wait for n8n
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("Failed to send to n8n:", err);
        });

        return Response.json({
          success: true,
          meeting_id: meeting.id,
          status: "processing",
          message: "Meeting submitted for AI processing",
        });

      } catch (n8nError) {
        console.error("n8n webhook error:", n8nError);
        // Don't fail - meeting is saved, just not being processed
        return Response.json({
          success: true,
          meeting_id: meeting.id,
          status: "saved",
          message: "Meeting saved but AI processing unavailable",
        });
      }
    }

    // No n8n webhook configured - just return the saved meeting
    return Response.json({
      success: true,
      meeting_id: meeting.id,
      status: "saved",
      message: "Meeting saved (n8n webhook not configured)",
    });

  } catch (error: any) {
    console.error("meetings/submit error:", error);
    return Response.json({
      error: "Failed to submit meeting",
      message: error.message,
    }, { status: 500 });
  }
}
