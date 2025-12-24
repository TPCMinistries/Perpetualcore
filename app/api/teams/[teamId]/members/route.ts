import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AddTeamMemberRequest } from "@/types/work";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// GET /api/teams/[teamId]/members - List team members
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

    // Get team members with profile info
    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select(
        `
        id,
        user_id,
        role,
        can_manage_members,
        can_edit_settings,
        can_manage_projects,
        can_view_analytics,
        joined_at,
        invited_by,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("team_id", teamId)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedMembers = members.map((m: any) => ({
      ...m,
      user: m.profiles,
      profiles: undefined,
    }));

    return NextResponse.json({ members: transformedMembers });
  } catch (error) {
    console.error("Team members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/members - Add a member to the team
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

    // Check if user can manage team members
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");

    const { data: currentMembership } = await supabase
      .from("team_members")
      .select("role, can_manage_members")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    const canManage =
      isAdmin ||
      currentMembership?.can_manage_members ||
      currentMembership?.role === "lead";

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: AddTeamMemberRequest = await request.json();

    if (!body.user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", body.user_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 409 }
      );
    }

    // Verify user is in the same organization
    const { data: team } = await supabase
      .from("teams")
      .select("organization_id")
      .eq("id", teamId)
      .single();

    const { data: targetUser } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", body.user_id)
      .single();

    if (!team || !targetUser || team.organization_id !== targetUser.organization_id) {
      return NextResponse.json(
        { error: "User must be in the same organization" },
        { status: 400 }
      );
    }

    // Add the member
    const { data: member, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: body.user_id,
        role: body.role || "member",
        can_manage_members: body.can_manage_members || false,
        can_manage_projects: body.can_manage_projects || false,
        invited_by: user.id,
      })
      .select(
        `
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
      `
      )
      .single();

    if (insertError) {
      console.error("Error adding team member:", insertError);
      return NextResponse.json(
        { error: "Failed to add team member" },
        { status: 500 }
      );
    }

    // Transform response
    const transformedMember = {
      ...member,
      user: (member as any).profiles,
      profiles: undefined,
    };

    return NextResponse.json({ member: transformedMember }, { status: 201 });
  } catch (error) {
    console.error("Team members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/members?userId=xxx - Remove a member
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

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");

    const { data: currentMembership } = await supabase
      .from("team_members")
      .select("role, can_manage_members")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    const canManage =
      isAdmin ||
      currentMembership?.can_manage_members ||
      currentMembership?.role === "lead" ||
      userId === user.id; // Users can remove themselves

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Don't allow removing the last team lead
    if (userId !== user.id) {
      const { data: targetMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (targetMember?.role === "lead") {
        const { count: leadCount } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId)
          .eq("role", "lead");

        if ((leadCount || 0) <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last team lead" },
            { status: 400 }
          );
        }
      }
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error removing team member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove team member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
