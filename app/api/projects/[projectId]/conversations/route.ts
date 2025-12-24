import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch conversations for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ conversations: [] });
    }

    // Verify project belongs to user's organization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch conversations for this project
    const { data: conversations, error: convError } = await supabase
      .from("shared_conversations")
      .select(`
        id,
        title,
        description,
        context_type,
        is_private,
        is_archived,
        tags,
        created_at,
        updated_at,
        last_message_at,
        created_by,
        profiles!shared_conversations_created_by_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .eq("is_archived", false)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convError) {
      console.error("Error fetching project conversations:", convError);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Transform data
    const formattedConversations = (conversations || []).map((conv: any) => ({
      ...conv,
      creator_name: conv.profiles?.full_name || "Unknown",
      creator_avatar: conv.profiles?.avatar_url,
      profiles: undefined,
    }));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Project conversations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation for this project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, is_private = false, tags = [] } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create conversation with project_id
    const { data: conversation, error } = await supabase
      .from("shared_conversations")
      .insert({
        organization_id: profile.organization_id,
        title: title.trim(),
        description: description?.trim() || null,
        context_type: "project",
        is_private,
        tags: tags.length > 0 ? tags : null,
        created_by: user.id,
        project_id: projectId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project conversation:", error);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        creator_name: profile.full_name || "Unknown",
      },
    });
  } catch (error) {
    console.error("Create project conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
