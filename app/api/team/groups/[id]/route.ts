import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/groups/[id]
 * Get a specific team group with members
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Get the group with members
    const { data: group, error } = await supabase
      .from("team_groups")
      .select(`
        *,
        members:team_group_members(
          id,
          user_id,
          role,
          added_at,
          added_by,
          profile:profiles!team_group_members_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            job_title,
            department
          )
        )
      `)
      .eq("id", params.id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      console.error("Error fetching team group:", error);
      return NextResponse.json(
        { error: "Failed to fetch group", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      group: {
        ...group,
        member_count: group.members?.length || 0
      }
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/groups/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/team/groups/[id]
 * Update a team group
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check permissions
    if (!["admin", "owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify group belongs to user's organization
    const { data: existingGroup } = await supabase
      .from("team_groups")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (existingGroup.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Group not in your organization" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, color, icon } = body;

    // Update the group
    const { data: group, error } = await supabase
      .from("team_groups")
      .update({
        name,
        description,
        color,
        icon,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating team group:", error);
      return NextResponse.json(
        { error: "Failed to update group", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ group });
  } catch (error: any) {
    console.error("Error in PUT /api/team/groups/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/groups/[id]
 * Delete a team group
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check permissions
    if (!["admin", "owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify group belongs to user's organization
    const { data: existingGroup } = await supabase
      .from("team_groups")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (existingGroup.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Group not in your organization" }, { status: 403 });
    }

    // Delete the group (cascade will remove members)
    const { error } = await supabase
      .from("team_groups")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting team group:", error);
      return NextResponse.json(
        { error: "Failed to delete group", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/team/groups/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
