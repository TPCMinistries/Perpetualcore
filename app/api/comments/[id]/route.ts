import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/comments/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.id;

    // Verify ownership
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only delete your own comments" },
        { status: 403 }
      );
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from("comments")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/comments/[id] - Update comment content
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.id;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select(`
        *,
        user:profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error("Error updating comment:", updateError);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("Update comment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
