import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ministry/events/[id]
 * Get a single ministry event
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: event, error } = await supabase
      .from("ministry_events")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Get linked teaching preparation if any
    const { data: teaching } = await supabase
      .from("teaching_preparations")
      .select("*")
      .eq("ministry_event_id", id)
      .single();

    return Response.json({ event, teaching });
  } catch (error) {
    console.error("Ministry event GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/ministry/events/[id]
 * Update a ministry event
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowedFields = [
      "title",
      "description",
      "event_type",
      "start_time",
      "end_time",
      "all_day",
      "recurring_pattern",
      "recurring_end_date",
      "location_type",
      "location_name",
      "location_address",
      "virtual_link",
      "expected_attendance",
      "actual_attendance",
      "notes",
      "resources",
      "tags",
      "status",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: event, error } = await supabase
      .from("ministry_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      return Response.json({ error: "Failed to update event" }, { status: 500 });
    }

    return Response.json({ event });
  } catch (error) {
    console.error("Ministry event PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ministry/events/[id]
 * Delete a ministry event
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("ministry_events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting event:", error);
      return Response.json({ error: "Failed to delete event" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Ministry event DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
