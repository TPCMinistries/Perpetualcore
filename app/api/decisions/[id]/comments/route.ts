import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions/[id]/comments - Get comments for a decision
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: comments, error } = await supabase
      .from("decision_comments")
      .select(`
        *,
        author:profiles!decision_comments_author_id_fkey(full_name, avatar_url)
      `)
      .eq("decision_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const formattedComments = (comments || []).map((c) => ({
      id: c.id,
      content: c.content,
      comment_type: c.comment_type,
      author_id: c.author_id,
      author_name: c.author?.full_name,
      author_avatar: c.author?.avatar_url,
      created_at: c.created_at,
      is_edited: c.is_edited,
      parent_comment_id: c.parent_comment_id,
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/decisions/[id]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, comment_type, parent_comment_id, mentioned_user_ids } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("decision_comments")
      .insert({
        decision_id: id,
        author_id: user.id,
        content: content.trim(),
        comment_type: comment_type || "comment",
        parent_comment_id: parent_comment_id || null,
        mentioned_user_ids: mentioned_user_ids || [],
      })
      .select(`
        *,
        author:profiles!decision_comments_author_id_fkey(full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    // Record event in decision history
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "commented",
      comment: content.substring(0, 200),
      performed_by: user.id,
      performed_by_system: false,
      metadata: {},
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        comment_type: comment.comment_type,
        author_id: comment.author_id,
        author_name: comment.author?.full_name,
        author_avatar: comment.author?.avatar_url,
        created_at: comment.created_at,
        is_edited: comment.is_edited,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
