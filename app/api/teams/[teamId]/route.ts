import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UpdateTeamRequest } from "@/types/work";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// GET /api/teams/[teamId] - Get a specific team
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

    // Get team with members
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select(
        `
        *,
        team_members (
          id,
          user_id,
          role,
          can_manage_members,
          can_edit_settings,
          can_manage_projects,
          can_view_analytics,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `
      )
      .eq("id", teamId)
      .single();

    if (teamError) {
      if (teamError.code === "PGRST116") {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      console.error("Error fetching team:", teamError);
      return NextResponse.json(
        { error: "Failed to fetch team" },
        { status: 500 }
      );
    }

    // Transform members data
    const transformedTeam = {
      ...team,
      members: team.team_members?.map((m: any) => ({
        ...m,
        user: m.profiles,
        profiles: undefined,
      })),
      member_count: team.team_members?.length || 0,
      team_members: undefined,
    };

    // Get project count for this team
    const { count: projectCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("is_archived", false);

    return NextResponse.json({
      team: {
        ...transformedTeam,
        project_count: projectCount || 0,
      },
    });
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[teamId] - Update a team
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check if user has permission to update this team
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");

    // Check if user is team lead
    const { data: membership } = await supabase
      .from("team_members")
      .select("role, can_edit_settings")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    const canEdit =
      isAdmin || membership?.can_edit_settings || membership?.role === "lead";

    if (!canEdit) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateTeamRequest = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.emoji !== undefined) updateData.emoji = body.emoji;
    if (body.is_archived !== undefined) updateData.is_archived = body.is_archived;

    // Merge AI context if provided
    if (body.ai_context) {
      const { data: currentTeam } = await supabase
        .from("teams")
        .select("ai_context")
        .eq("id", teamId)
        .single();

      updateData.ai_context = {
        ...(currentTeam?.ai_context || {}),
        ...body.ai_context,
      };
    }

    // Merge dashboard config if provided
    if (body.dashboard_config) {
      const { data: currentTeam } = await supabase
        .from("teams")
        .select("dashboard_config")
        .eq("id", teamId)
        .single();

      updateData.dashboard_config = {
        ...(currentTeam?.dashboard_config || {}),
        ...body.dashboard_config,
      };
    }

    // Update the team
    const { data: team, error: updateError } = await supabase
      .from("teams")
      .update(updateData)
      .eq("id", teamId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating team:", updateError);
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId] - Delete a team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (!["admin", "owner"].includes(profile?.user_role || "")) {
      return NextResponse.json(
        { error: "Permission denied. Only admins can delete teams." },
        { status: 403 }
      );
    }

    // Check if team is a default department (can't be deleted)
    const { data: team } = await supabase
      .from("teams")
      .select("team_type, slug")
      .eq("id", teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Don't allow deleting core departments
    const coreDepartments = [
      "marketing",
      "sales",
      "operations",
      "engineering",
      "finance",
      "hr",
    ];
    if (
      team.team_type === "department" &&
      coreDepartments.includes(team.slug)
    ) {
      return NextResponse.json(
        { error: "Cannot delete core department. Archive it instead." },
        { status: 400 }
      );
    }

    // Delete the team (cascade will handle members)
    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (deleteError) {
      console.error("Error deleting team:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
