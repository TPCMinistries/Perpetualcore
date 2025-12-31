import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ideas/[id]
 * Get a single idea with notes
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

    // Get idea with linked entities
    const { data: idea, error } = await supabase
      .from("ideas")
      .select(`
        *,
        linked_project:projects(id, name, status, description),
        linked_decision:decisions(id, title, status, description),
        linked_opportunity:opportunities(id, name, status, description)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    // Get notes
    const { data: notes } = await supabase
      .from("idea_notes")
      .select("*")
      .eq("idea_id", id)
      .order("created_at", { ascending: false });

    // Get attachments
    const { data: attachments } = await supabase
      .from("idea_attachments")
      .select("*")
      .eq("idea_id", id)
      .order("created_at", { ascending: false });

    return Response.json({
      idea,
      notes: notes || [],
      attachments: attachments || [],
    });
  } catch (error) {
    console.error("Idea GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/ideas/[id]
 * Update an idea
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
      "category",
      "tags",
      "priority",
      "status",
      "ai_expanded",
      "ai_suggestions",
      "ai_related_topics",
      "ai_potential_score",
      "ai_processed_at",
      "linked_project_id",
      "linked_decision_id",
      "linked_opportunity_id",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle status changes
    if (body.status === "implemented") {
      updates.implemented_at = new Date().toISOString();
    }
    if (body.status === "archived") {
      updates.archived_at = new Date().toISOString();
    }

    const { data: idea, error } = await supabase
      .from("ideas")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating idea:", error);
      return Response.json({ error: "Failed to update idea" }, { status: 500 });
    }

    return Response.json({ idea });
  } catch (error) {
    console.error("Idea PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ideas/[id]
 * Delete an idea
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
      .from("ideas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting idea:", error);
      return Response.json({ error: "Failed to delete idea" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Idea DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
