import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateProjectRequest } from "@/types/work";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET /api/projects/[projectId] - Get single project with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project with team, members, and milestones
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        team:teams(id, name, emoji, color, team_type),
        project_members(
          id,
          user_id,
          role,
          can_edit_project,
          can_manage_tasks,
          can_upload_files,
          can_invite_members,
          can_manage_milestones,
          joined_at,
          profiles:user_id(id, full_name, email, avatar_url)
        ),
        project_milestones(
          id,
          name,
          description,
          due_date,
          completed_at,
          stage,
          sort_order,
          is_key_milestone,
          created_at
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Transform members to include user profile
    const transformedProject = {
      ...project,
      members: project.project_members?.map((m: any) => ({
        ...m,
        user: m.profiles,
        profiles: undefined,
      })),
      milestones: project.project_milestones || [],
      member_count: project.project_members?.length || 0,
      project_members: undefined,
      project_milestones: undefined,
    };

    return NextResponse.json({ project: transformedProject });
  } catch (error) {
    console.error("Project API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateProjectRequest = await request.json();

    // Check permissions
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_edit_project")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canEdit =
      isAdmin ||
      isCreator ||
      membership?.can_edit_project ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canEdit) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.emoji !== undefined) updateData.emoji = body.emoji;
    if (body.current_stage !== undefined) updateData.current_stage = body.current_stage;
    if (body.team_id !== undefined) updateData.team_id = body.team_id;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.target_date !== undefined) updateData.target_date = body.target_date;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.settings !== undefined) updateData.settings = body.settings;
    if (body.is_archived !== undefined) updateData.is_archived = body.is_archived;

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select(
        `
        *,
        team:teams(id, name, emoji, color)
      `
      )
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Project API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only owner/admin can delete
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canDelete =
      isAdmin || isCreator || membership?.role === "owner";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
