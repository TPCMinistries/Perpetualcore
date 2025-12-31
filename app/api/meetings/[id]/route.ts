import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/meetings/[id]
 * Fetch a single meeting with attendees and related promises
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (meetingError || !meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Fetch attendees
    const { data: attendees } = await supabase
      .from("meeting_attendees")
      .select("*")
      .eq("meeting_id", id);

    // Fetch promises from this meeting
    const { data: promises } = await supabase
      .from("promises")
      .select("*")
      .eq("meeting_id", id);

    // Fetch tasks created from this meeting
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("source_type", "meeting")
      .eq("source_id", id);

    return Response.json({
      success: true,
      meeting: {
        ...meeting,
        attendees_details: attendees || [],
        promises: promises || [],
        tasks: tasks || [],
      },
    });

  } catch (error: any) {
    console.error("GET /api/meetings/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/meetings/[id]
 * Update a meeting
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "meeting_title",
      "meeting_date",
      "meeting_type",
      "attendees",
      "transcript",
      "executive_summary",
      "key_topics",
      "decisions_made",
      "next_steps",
      "project_tags",
      "sentiment",
      "follow_up_needed",
      "suggested_follow_up_date",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: meeting, error } = await supabase
      .from("meetings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update meeting:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      meeting,
    });

  } catch (error: any) {
    console.error("PATCH /api/meetings/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/meetings/[id]
 * Delete a meeting and its related data
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete meeting (cascades to attendees via FK)
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete meeting:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Meeting deleted",
    });

  } catch (error: any) {
    console.error("DELETE /api/meetings/[id] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
