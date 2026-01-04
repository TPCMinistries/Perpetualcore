import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// GET /api/teams/[teamId]/advisors - Get all consulting advisors for a team
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get consulting advisors for this team
    const { data: consultingAdvisors, error } = await supabase
      .from("team_consulting_advisors")
      .select(`
        id,
        added_at,
        notes,
        advisor:ai_assistants (
          id,
          name,
          description,
          role,
          avatar_emoji,
          tone,
          enabled,
          total_conversations,
          total_messages,
          personality_traits
        )
      `)
      .eq("team_id", teamId)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching consulting advisors:", error);
      return NextResponse.json(
        { error: "Failed to fetch consulting advisors" },
        { status: 500 }
      );
    }

    // Transform the data
    const advisors = consultingAdvisors.map((ca: any) => ({
      ...ca.advisor,
      consulting_id: ca.id,
      added_at: ca.added_at,
      notes: ca.notes,
    }));

    return NextResponse.json({ advisors });
  } catch (error) {
    console.error("Team advisors API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/advisors - Attach a consulting advisor to a team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission (team lead or manager)
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isTeamLead = ["lead", "manager"].includes(membership?.role || "");

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Only team leads, managers, or admins can attach advisors" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { advisor_id, notes } = body;

    if (!advisor_id) {
      return NextResponse.json(
        { error: "advisor_id is required" },
        { status: 400 }
      );
    }

    // Verify the advisor exists and is standalone
    const { data: advisor, error: advisorError } = await supabase
      .from("ai_assistants")
      .select("id, name, advisor_type")
      .eq("id", advisor_id)
      .single();

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Only allow attaching standalone advisors as consultants
    if (advisor.advisor_type === "dedicated") {
      return NextResponse.json(
        { error: "Cannot attach a dedicated team advisor. Choose a standalone advisor." },
        { status: 400 }
      );
    }

    // Create the consulting relationship
    const { data: consulting, error: createError } = await supabase
      .from("team_consulting_advisors")
      .insert({
        team_id: teamId,
        advisor_id,
        added_by: user.id,
        notes,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === "23505") {
        return NextResponse.json(
          { error: "This advisor is already attached to this team" },
          { status: 409 }
        );
      }
      console.error("Error attaching advisor:", createError);
      return NextResponse.json(
        { error: "Failed to attach advisor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ consulting, advisor }, { status: 201 });
  } catch (error) {
    console.error("Team advisors API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/advisors?advisorId=xxx - Detach a consulting advisor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get advisor ID from query params
    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get("advisorId");

    if (!advisorId) {
      return NextResponse.json(
        { error: "advisorId query parameter is required" },
        { status: 400 }
      );
    }

    // Check if user has permission
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isTeamLead = ["lead", "manager"].includes(membership?.role || "");

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Only team leads, managers, or admins can detach advisors" },
        { status: 403 }
      );
    }

    // Delete the consulting relationship
    const { error: deleteError } = await supabase
      .from("team_consulting_advisors")
      .delete()
      .eq("team_id", teamId)
      .eq("advisor_id", advisorId);

    if (deleteError) {
      console.error("Error detaching advisor:", deleteError);
      return NextResponse.json(
        { error: "Failed to detach advisor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team advisors API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
