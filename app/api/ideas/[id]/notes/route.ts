import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ideas/[id]/notes
 * Get all notes for an idea
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify idea belongs to user
    const { data: idea } = await supabase
      .from("ideas")
      .select("id")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (!idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const { data: notes, error } = await supabase
      .from("idea_notes")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
    }

    return Response.json({ notes: notes || [] });
  } catch (error) {
    console.error("Notes GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ideas/[id]/notes
 * Add a note to an idea
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify idea belongs to user
    const { data: idea } = await supabase
      .from("ideas")
      .select("id")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (!idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, note_type = "note" } = body;

    if (!content?.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const { data: note, error } = await supabase
      .from("idea_notes")
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        content,
        note_type,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      return Response.json({ error: "Failed to create note" }, { status: 500 });
    }

    // Update idea status to "developing" if it was "captured"
    await supabase
      .from("ideas")
      .update({ status: "developing", updated_at: new Date().toISOString() })
      .eq("id", ideaId)
      .eq("status", "captured");

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Notes POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/ideas/[id]/notes
 * Delete a note from an idea
 *
 * Query params:
 * - note_id: The note ID to delete
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("note_id");

    if (!noteId) {
      return Response.json({ error: "note_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("idea_notes")
      .delete()
      .eq("id", noteId)
      .eq("idea_id", ideaId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting note:", error);
      return Response.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Notes DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
