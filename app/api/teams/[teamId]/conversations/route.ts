import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// GET /api/teams/[teamId]/conversations - List team conversations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this team
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: team } = await supabase
      .from("teams")
      .select("organization_id")
      .eq("id", teamId)
      .single();

    if (!team || team.organization_id !== profile?.organization_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch conversations for this team
    const { data: conversations, error: convsError } = await supabase
      .from("shared_conversations")
      .select(`
        id,
        title,
        last_message_at,
        message_count,
        created_at,
        updated_at
      `)
      .eq("team_id", teamId)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convsError) {
      console.error("Error fetching team conversations:", convsError);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error("Team conversations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/conversations - Create team conversation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this team
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: team } = await supabase
      .from("teams")
      .select("organization_id, name")
      .eq("id", teamId)
      .single();

    if (!team || team.organization_id !== profile?.organization_id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await request.json();
    const title = body.title || `${team.name} Conversation`;

    // Create conversation with team_id
    const { data: conversation, error: createError } = await supabase
      .from("shared_conversations")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        title,
        team_id: teamId,
        visibility: "team",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating team conversation:", createError);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Team conversations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
