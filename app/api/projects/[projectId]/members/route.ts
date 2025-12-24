import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { AddProjectMemberRequest, ProjectMemberRole } from "@/types/work";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET /api/projects/[projectId]/members - Get project members
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

    const { data: members, error } = await supabase
      .from("project_members")
      .select(
        `
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
      `
      )
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching project members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    const transformedMembers = (members || []).map((m: any) => ({
      ...m,
      user: m.profiles,
      profiles: undefined,
    }));

    return NextResponse.json({ members: transformedMembers });
  } catch (error) {
    console.error("Project members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/members - Add member to project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AddProjectMemberRequest = await request.json();

    if (!body.user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Check if user can invite members
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by, organization_id")
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
      .select("role, can_invite_members")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canInvite =
      isAdmin ||
      isCreator ||
      membership?.can_invite_members ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canInvite) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", body.user_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    // Verify user exists and is in same organization
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", body.user_id)
      .eq("organization_id", project.organization_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in organization" },
        { status: 404 }
      );
    }

    // Add member
    const { data: newMember, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: body.user_id,
        role: body.role || "member",
        can_edit_project: body.can_edit_project ?? false,
        can_manage_tasks: body.can_manage_tasks ?? true,
        can_upload_files: body.can_upload_files ?? true,
        can_invite_members: body.can_invite_members ?? false,
        can_manage_milestones: body.can_manage_milestones ?? false,
        invited_by: user.id,
      })
      .select(
        `
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
      `
      )
      .single();

    if (error) {
      console.error("Error adding project member:", error);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      );
    }

    const transformedMember = {
      ...newMember,
      user: (newMember as any).profiles,
      profiles: undefined,
    };

    return NextResponse.json({ member: transformedMember }, { status: 201 });
  } catch (error) {
    console.error("Project members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/members?user_id=xxx - Remove member
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

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
    const isSelf = targetUserId === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_invite_members")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    // Can remove if: admin, creator, has invite perms, or removing self
    const canRemove =
      isAdmin ||
      isCreator ||
      isSelf ||
      membership?.can_invite_members ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canRemove) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Can't remove the only owner
    const { data: targetMember } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", targetUserId)
      .single();

    if (targetMember?.role === "owner") {
      const { count } = await supabase
        .from("project_members")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("role", "owner");

      if (count === 1) {
        return NextResponse.json(
          { error: "Cannot remove the only project owner" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Error removing project member:", error);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
