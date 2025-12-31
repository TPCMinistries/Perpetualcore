import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ministry/discipleship/[id]
 * Get a discipleship relationship with sessions
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

    const { data: relationship, error } = await supabase
      .from("discipleship_relationships")
      .select(`
        *,
        disciple_contact:contacts(id, first_name, last_name, email, phone, avatar_url)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !relationship) {
      return Response.json({ error: "Relationship not found" }, { status: 404 });
    }

    // Get sessions
    const { data: sessions } = await supabase
      .from("discipleship_sessions")
      .select("*")
      .eq("relationship_id", id)
      .order("session_date", { ascending: false });

    return Response.json({
      relationship,
      sessions: sessions || [],
    });
  } catch (error) {
    console.error("Discipleship GET [id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/ministry/discipleship/[id]
 * Update a discipleship relationship
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
      "disciple_name",
      "disciple_email",
      "disciple_phone",
      "relationship_type",
      "meeting_frequency",
      "goals",
      "current_focus",
      "resources_shared",
      "status",
      "notes",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data: relationship, error } = await supabase
      .from("discipleship_relationships")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating relationship:", error);
      return Response.json({ error: "Failed to update relationship" }, { status: 500 });
    }

    return Response.json({ relationship });
  } catch (error) {
    console.error("Discipleship PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ministry/discipleship/[id]
 * Delete a discipleship relationship
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
      .from("discipleship_relationships")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting relationship:", error);
      return Response.json({ error: "Failed to delete relationship" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Discipleship DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ministry/discipleship/[id] (add session)
 * Add a session to a discipleship relationship
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: relationshipId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify relationship exists
    const { data: relationship } = await supabase
      .from("discipleship_relationships")
      .select("id")
      .eq("id", relationshipId)
      .eq("user_id", user.id)
      .single();

    if (!relationship) {
      return Response.json({ error: "Relationship not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      session_date,
      duration_minutes,
      location,
      topics_discussed,
      scripture_studied,
      key_insights,
      action_items,
      prayer_requests,
      next_session_date,
      follow_up_notes,
    } = body;

    if (!session_date) {
      return Response.json({ error: "Session date is required" }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from("discipleship_sessions")
      .insert({
        relationship_id: relationshipId,
        user_id: user.id,
        session_date,
        duration_minutes,
        location,
        topics_discussed,
        scripture_studied,
        key_insights,
        action_items,
        prayer_requests,
        next_session_date,
        follow_up_notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return Response.json({ error: "Failed to create session" }, { status: 500 });
    }

    return Response.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Discipleship session POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
