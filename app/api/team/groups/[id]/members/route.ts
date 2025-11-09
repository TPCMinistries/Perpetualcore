import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/team/groups/[id]/members
 * Add a member to a group
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const { data: group } = await supabase
      .from("team_groups")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Group not in your organization" }, { status: 403 });
    }

    const body = await req.json();
    const { user_id, role = "member" } = body;

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify the user being added is in the same organization
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "User not in your organization" }, { status: 403 });
    }

    // Add member to group
    const { data: member, error } = await supabase
      .from("team_group_members")
      .insert({
        group_id: params.id,
        user_id,
        role,
        added_by: user.id
      })
      .select(`
        *,
        profile:profiles!team_group_members_user_id_fkey(
          id,
          full_name,
          email,
          avatar_url,
          job_title
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        return NextResponse.json({ error: "User is already a member of this group" }, { status: 409 });
      }
      console.error("Error adding group member:", error);
      return NextResponse.json(
        { error: "Failed to add member", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/team/groups/[id]/members:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/groups/[id]/members
 * Remove a member from a group
 * Body: { user_id: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const { data: group } = await supabase
      .from("team_groups")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Group not in your organization" }, { status: 403 });
    }

    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Remove member from group
    const { error } = await supabase
      .from("team_group_members")
      .delete()
      .eq("group_id", params.id)
      .eq("user_id", user_id);

    if (error) {
      console.error("Error removing group member:", error);
      return NextResponse.json(
        { error: "Failed to remove member", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/team/groups/[id]/members:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
