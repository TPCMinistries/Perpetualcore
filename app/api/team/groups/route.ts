import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/groups
 * Get all team groups for the organization
 */
export async function GET(req: NextRequest) {
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

    // Get all groups with member counts
    const { data: groups, error } = await supabase
      .from("team_groups")
      .select(`
        *,
        members:team_group_members(
          id,
          user_id,
          role,
          added_at,
          profile:profiles!team_group_members_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            job_title
          )
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching team groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups", details: error.message },
        { status: 500 }
      );
    }

    // Add member count to each group
    const groupsWithCounts = groups?.map(group => ({
      ...group,
      member_count: group.members?.length || 0
    })) || [];

    return NextResponse.json({ groups: groupsWithCounts });
  } catch (error: any) {
    console.error("Error in GET /api/team/groups:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/groups
 * Create a new team group
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check permissions (admin or higher)
    if (!["admin", "owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, color, icon } = body;

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    // Create the group
    const { data: group, error } = await supabase
      .from("team_groups")
      .insert({
        organization_id: profile.organization_id,
        name,
        description,
        color,
        icon,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating team group:", error);
      return NextResponse.json(
        { error: "Failed to create group", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/team/groups:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
