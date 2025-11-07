import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/comments/[id]/react
export async function POST(
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
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("reactions")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Parse reactions
    const reactions = comment.reactions || {};
    const currentReactors = reactions[emoji] || [];

    // Toggle reaction - if user already reacted with this emoji, remove it; otherwise add it
    let updatedReactors: string[];
    if (currentReactors.includes(user.id)) {
      // Remove user's reaction
      updatedReactors = currentReactors.filter((id: string) => id !== user.id);
    } else {
      // Add user's reaction
      updatedReactors = [...currentReactors, user.id];
    }

    // Update reactions object
    const updatedReactions = { ...reactions };
    if (updatedReactors.length === 0) {
      // Remove emoji key if no more reactors
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = updatedReactors;
    }

    // Update comment with new reactions
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .update({ reactions: updatedReactions })
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
      console.error("Error updating reactions:", updateError);
      return NextResponse.json(
        { error: "Failed to update reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error("React API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
