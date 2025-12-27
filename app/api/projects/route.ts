import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { CreateProjectRequest, ProjectStage } from "@/types/work";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch all projects for user's organization with filters
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") as ProjectStage | null;
    const teamId = searchParams.get("team_id");
    const includeArchived = searchParams.get("archived") === "true";
    const withMembers = searchParams.get("members") === "true";
    const groupByStage = searchParams.get("group_by_stage") === "true";

    // Build query
    let query = supabase
      .from("projects")
      .select(
        withMembers
          ? `
          *,
          team:teams(id, name, emoji, color),
          project_members(
            id,
            user_id,
            role,
            can_edit_project,
            can_manage_tasks,
            joined_at,
            profiles:user_id(id, full_name, email, avatar_url)
          )
        `
          : `
          *,
          team:teams(id, name, emoji, color)
        `
      )
      .eq("organization_id", profile.organization_id)
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });

    // Apply filters
    if (stage) {
      query = query.eq("current_stage", stage);
    }

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedProjects = (projects || []).map((project: any) => ({
      ...project,
      members: project.project_members?.map((m: any) => ({
        ...m,
        user: m.profiles,
        profiles: undefined,
      })),
      member_count: project.project_members?.length || 0,
      project_members: undefined,
    }));

    // Optionally group by stage for Kanban view
    if (groupByStage) {
      const grouped = {
        ideation: transformedProjects.filter(
          (p: any) => p.current_stage === "ideation"
        ),
        planning: transformedProjects.filter(
          (p: any) => p.current_stage === "planning"
        ),
        in_progress: transformedProjects.filter(
          (p: any) => p.current_stage === "in_progress"
        ),
        review: transformedProjects.filter(
          (p: any) => p.current_stage === "review"
        ),
        complete: transformedProjects.filter(
          (p: any) => p.current_stage === "complete"
        ),
      };
      return NextResponse.json({ projects: grouped, grouped: true });
    }

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new project (workspace)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to find organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: CreateProjectRequest = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // If team_id provided, verify it exists
    if (body.team_id) {
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("id", body.team_id)
        .eq("organization_id", profile.organization_id)
        .single();

      if (!team) {
        return NextResponse.json(
          { error: "Team not found" },
          { status: 404 }
        );
      }
    }

    // Build AI context with advanced fields
    const aiContext: Record<string, unknown> = {};
    if (body.budget) aiContext.budget = body.budget;
    if (body.location) aiContext.location = body.location;
    if (body.expected_participants) aiContext.expected_participants = body.expected_participants;

    // Create the project
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name: body.name.trim(),
        description: body.description,
        color: body.color || "#6366f1",
        emoji: body.emoji || "📁",
        team_id: body.team_id,
        start_date: body.start_date,
        target_date: body.target_date,
        priority: body.priority || "medium",
        current_stage: "ideation", // All new projects start in ideation
        project_type: body.project_type || "general",
        client_name: body.client_name,
        tags: body.tags || [],
        ai_context: Object.keys(aiContext).length > 0 ? aiContext : undefined,
      })
      .select(
        `
        *,
        team:teams(id, name, emoji, color)
      `
      )
      .single();

    if (error) {
      console.error("Error creating project:", error);

      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A project with this name already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Add creator as project owner
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
      can_edit_project: true,
      can_manage_tasks: true,
      can_upload_files: true,
      can_invite_members: true,
      can_manage_milestones: true,
    });

    // Add initial milestones if provided
    if (body.milestones && Array.isArray(body.milestones) && body.milestones.length > 0) {
      const milestonesData = body.milestones.map((name: string, index: number) => ({
        project_id: project.id,
        name,
        sort_order: index,
        created_by: user.id,
      }));

      await supabase.from("project_milestones").insert(milestonesData);
    }

    // Add initial members if provided
    if (body.initial_members && Array.isArray(body.initial_members) && body.initial_members.length > 0) {
      const membersData = body.initial_members.map((userId: string) => ({
        project_id: project.id,
        user_id: userId,
        role: "member",
        can_edit_project: false,
        can_manage_tasks: true,
        can_upload_files: true,
        can_invite_members: false,
        can_manage_milestones: false,
        invited_by: user.id,
      }));

      await supabase.from("project_members").insert(membersData);
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
