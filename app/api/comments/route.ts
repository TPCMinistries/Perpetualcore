import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/comments?entityType=document&entityId=xxx
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Fetch comments with user information
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        *,
        user:profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      entityType,
      entityId,
      content,
      parentCommentId,
      mentionedUserIds,
    } = body;

    if (!entityType || !entityId || !content) {
      return NextResponse.json(
        { error: "entityType, entityId, and content are required" },
        { status: 400 }
      );
    }

    // Validate entity type
    const validEntityTypes = [
      "document",
      "task",
      "workflow",
      "email",
      "meeting",
      "agent",
      "workflow_execution",
      "suggestion",
      "calendar_event",
    ];

    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 }
      );
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from("comments")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        mentioned_user_ids: mentionedUserIds || [],
      })
      .select(`
        *,
        user:profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error("Error creating comment:", createError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // The mention notifications are automatically created by the database trigger

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
