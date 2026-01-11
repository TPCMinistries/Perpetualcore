import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;

    // Fetch document counts
    const { count: docCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "completed");

    // Get most recent document
    const { data: recentDoc } = await supabase
      .from("documents")
      .select("created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch conversation counts
    const { count: convCount } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Fetch insights count
    const { count: insightsCount } = await supabase
      .from("ai_insights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Fetch contact counts
    const { count: contactCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    // Count contacts with relationship context (has notes or recent interaction)
    const { count: contactsWithContext } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .not("relationship_strength", "is", null);

    // Fetch active agents
    const { count: activeAgents } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Count agent actions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: agentActionsToday } = await supabase
      .from("agent_activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());

    const lastAdded = recentDoc?.created_at
      ? getRelativeTime(new Date(recentDoc.created_at))
      : "never";

    return NextResponse.json({
      documents: {
        count: docCount || 0,
        lastAdded,
      },
      conversations: {
        count: convCount || 0,
        insights: insightsCount || 0,
      },
      contacts: {
        count: contactCount || 0,
        withContext: contactsWithContext || 0,
      },
      agents: {
        active: activeAgents || 0,
        actionsToday: agentActionsToday || 0,
      },
    });
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory stats" },
      { status: 500 }
    );
  }
}
