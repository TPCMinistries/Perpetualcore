import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/teams/[teamId]/activity
 * Get activity feed for a specific team
 * Aggregates activities from team resources: documents, projects, work items, conversations
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    // Also check if user is org admin or team exists
    const { data: team } = await supabase
      .from("teams")
      .select("id, name, organization_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get user's profile to check org membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const hasAccess = teamMember || profile?.organization_id === team.organization_id;
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build aggregated activity from multiple sources
    const activities: any[] = [];

    // 1. Get document assignments to this team
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title, created_at, updated_at, user_id, profiles:user_id(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (documents) {
      documents.forEach((doc: any) => {
        activities.push({
          id: `doc-${doc.id}`,
          action_type: "assigned",
          entity_type: "document",
          entity_id: doc.id,
          entity_name: doc.title,
          actor_name: doc.profiles?.full_name || "Unknown",
          actor_avatar: doc.profiles?.avatar_url,
          created_at: doc.updated_at,
          metadata: {},
        });
      });
    }

    // 2. Get projects in this team
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, created_at, updated_at, owner_id, profiles:owner_id(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (projects) {
      projects.forEach((project: any) => {
        activities.push({
          id: `proj-${project.id}`,
          action_type: "created",
          entity_type: "project",
          entity_id: project.id,
          entity_name: project.name,
          actor_name: project.profiles?.full_name || "Unknown",
          actor_avatar: project.profiles?.avatar_url,
          created_at: project.created_at,
          metadata: {},
        });
      });
    }

    // 3. Get work items in this team
    const { data: workItems } = await supabase
      .from("work_items")
      .select("id, title, created_at, updated_at, created_by, stage_id, profiles:created_by(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (workItems) {
      workItems.forEach((item: any) => {
        activities.push({
          id: `item-${item.id}`,
          action_type: item.created_at === item.updated_at ? "created" : "updated",
          entity_type: "work_item",
          entity_id: item.id,
          entity_name: item.title,
          actor_name: item.profiles?.full_name || "Unknown",
          actor_avatar: item.profiles?.avatar_url,
          created_at: item.updated_at,
          metadata: { stage_id: item.stage_id },
        });
      });
    }

    // 4. Get team conversations
    const { data: conversations } = await supabase
      .from("shared_conversations")
      .select("id, title, created_at, updated_at, user_id, profiles:user_id(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (conversations) {
      conversations.forEach((conv: any) => {
        activities.push({
          id: `conv-${conv.id}`,
          action_type: "created",
          entity_type: "conversation",
          entity_id: conv.id,
          entity_name: conv.title || "Team Conversation",
          actor_name: conv.profiles?.full_name || "Unknown",
          actor_avatar: conv.profiles?.avatar_url,
          created_at: conv.created_at,
          metadata: {},
        });
      });
    }

    // 5. Get team member additions
    const { data: members } = await supabase
      .from("team_members")
      .select("id, role, joined_at, user_id, profiles:user_id(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: false })
      .limit(20);

    if (members) {
      members.forEach((member: any) => {
        activities.push({
          id: `member-${member.id}`,
          action_type: "joined",
          entity_type: "team",
          entity_id: teamId,
          entity_name: team.name,
          actor_name: member.profiles?.full_name || "Unknown",
          actor_avatar: member.profiles?.avatar_url,
          created_at: member.joined_at,
          metadata: { role: member.role },
        });
      });
    }

    // Sort all activities by date
    activities.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      activities: limitedActivities,
      count: limitedActivities.length,
      total: activities.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/teams/[teamId]/activity:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
