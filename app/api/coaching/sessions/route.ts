import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/coaching/sessions
 * Fetch all coaching sessions (upcoming or recent)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("coaching_sessions")
      .select(`
        *,
        client:coaching_clients(id, name, email, company, coaching_type)
      `)
      .eq("user_id", user.id)
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (upcoming) {
      query = query
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });
    } else {
      query = query.order("scheduled_at", { ascending: false });
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    return Response.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("Coaching sessions GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/coaching/sessions
 * Update a coaching session (complete it, add notes, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return Response.json({ error: "Session ID is required" }, { status: 400 });
    }

    const allowedFields = [
      "status",
      "prep_notes",
      "goals_for_session",
      "topics_covered",
      "key_insights",
      "action_items",
      "homework_assigned",
      "ai_summary",
      "ai_recommendations",
      "next_session_focus",
      "follow_up_required",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates[field] = updateFields[field];
      }
    }

    // Handle completion
    if (updateFields.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating session:", error);
      return Response.json({ error: "Failed to update session" }, { status: 500 });
    }

    // If action_items provided, create them as separate records
    if (updateFields.action_items_to_create && Array.isArray(updateFields.action_items_to_create)) {
      const { data: currentSession } = await supabase
        .from("coaching_sessions")
        .select("client_id")
        .eq("id", id)
        .single();

      if (currentSession) {
        const actionItems = updateFields.action_items_to_create.map((item: any) => ({
          session_id: id,
          client_id: currentSession.client_id,
          user_id: user.id,
          description: item.description,
          due_date: item.due_date,
          priority: item.priority || "medium",
        }));

        await supabase.from("coaching_action_items").insert(actionItems);
      }
    }

    return Response.json({ session });
  } catch (error) {
    console.error("Coaching sessions PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/coaching/sessions
 * Delete a coaching session
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Session ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("coaching_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting session:", error);
      return Response.json({ error: "Failed to delete session" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Coaching sessions DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
