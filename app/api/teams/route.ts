import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Team, CreateTeamRequest, TeamWithMembers, BOS_2_TEAM_TEMPLATES, TRADITIONAL_TEAM_TEMPLATES } from "@/types/work";
import { createTeamAdvisor } from "@/lib/teams/create-team-advisor";

// GET /api/teams - List all teams for the organization
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teamType = searchParams.get("type"); // 'department' or 'project_team'
    const includeArchived = searchParams.get("archived") === "true";
    const withMembers = searchParams.get("members") === "true";

    // Build query
    let query = supabase
      .from("teams")
      .select(
        withMembers
          ? `
          *,
          team_members (
            id,
            user_id,
            role,
            can_manage_members,
            can_manage_projects,
            joined_at,
            profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `
          : "*"
      )
      .eq("organization_id", profile.organization_id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    // Apply filters
    if (teamType) {
      query = query.eq("team_type", teamType);
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data: teams, error: teamsError } = await query;

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    // Transform data if members were included
    const transformedTeams = withMembers
      ? teams.map((team: any) => ({
          ...team,
          members: team.team_members?.map((m: any) => ({
            ...m,
            user: m.profiles,
          })),
          member_count: team.team_members?.length || 0,
          team_members: undefined, // Remove raw data
        }))
      : teams;

    return NextResponse.json({ teams: transformedTeams });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to create teams
    if (!["admin", "owner", "manager", "business_owner"].includes(profile.user_role || "")) {
      return NextResponse.json(
        { error: "Permission denied. Only admins and managers can create teams." },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateTeamRequest = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Build team data with optional template fields
    const teamData: Record<string, unknown> = {
      organization_id: profile.organization_id,
      name: body.name,
      slug,
      description: body.description,
      team_type: body.team_type || "department",
      color: body.color || "#6366f1",
      emoji: body.emoji,
      ai_context: body.ai_context || {
        personality: "professional",
        tools: [],
        prompts: {},
        content_filters: [],
        suggestions_focus: [],
      },
      created_by: user.id,
    };

    // Add template-specific fields if provided
    if ((body as any).template_id) {
      teamData.template_id = (body as any).template_id;
    }
    if ((body as any).workflow_stages) {
      teamData.workflow_stages = (body as any).workflow_stages;
    }

    // Create the team
    const { data: team, error: createError } = await supabase
      .from("teams")
      .insert(teamData)
      .select()
      .single();

    if (createError) {
      console.error("Error creating team:", createError);

      // Handle unique constraint violation
      if (createError.code === "23505") {
        return NextResponse.json(
          { error: "A team with this name already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }

    // Add the creator as a team lead
    await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      role: "lead",
      can_manage_members: true,
      can_manage_projects: true,
    });

    // Auto-create a dedicated AI advisor for BOS 2.0 teams
    let advisor = null;
    const templateId = (body as any).template_id;
    if (templateId) {
      const allTemplates = [...(BOS_2_TEAM_TEMPLATES || []), ...(TRADITIONAL_TEAM_TEMPLATES || [])];
      const template = allTemplates.find((t) => t.id === templateId);

      if (template && template.ai_context) {
        const { advisor: createdAdvisor, error: advisorError } = await createTeamAdvisor(
          supabase,
          team,
          template,
          user.id
        );

        if (advisorError) {
          console.error("Warning: Failed to create team advisor:", advisorError);
          // Don't fail team creation - advisor is optional
        } else {
          advisor = createdAdvisor;
        }
      }
    }

    return NextResponse.json({ team, advisor }, { status: 201 });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
