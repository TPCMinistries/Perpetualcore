import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { shareSkill, unshareSkill, getTeamSkills } from "@/lib/teams/shared-resources";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[id]/skills - List shared skills for a team
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const admin = createAdminClient();
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    const skills = await getTeamSkills(teamId);
    return NextResponse.json({ skills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/teams/[id]/skills - Share a skill with the team
 * Body: { skillId: string, config?: object }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership with share permission
    const admin = createAdminClient();
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!member || member.role === "viewer") {
      return NextResponse.json(
        { error: "You don't have permission to share skills" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { skillId, config } = body;

    if (!skillId) {
      return NextResponse.json(
        { error: "skillId is required" },
        { status: 400 }
      );
    }

    const { success, error } = await shareSkill(teamId, skillId, user.id, config);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[id]/skills?skillId=xxx - Unshare a skill
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin/owner membership
    const admin = createAdminClient();
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin", "lead"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only admins can unshare skills" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get("skillId");

    if (!skillId) {
      return NextResponse.json(
        { error: "skillId query parameter is required" },
        { status: 400 }
      );
    }

    const { success, error } = await unshareSkill(teamId, skillId);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
