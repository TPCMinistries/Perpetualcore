import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get actions history for a specific agent
 * GET /api/agents/[id]/actions
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;

    // Verify agent ownership
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("user_id")
      .eq("id", agentId)
      .single();

    if (!agent || agent.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch agent actions, ordered by most recent first
    const { data: actions, error: actionsError } = await supabase
      .from("agent_actions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50); // Limit to most recent 50 actions

    if (actionsError) {
      console.error("Error fetching agent actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ actions: actions || [] });
  } catch (error) {
    console.error("Get agent actions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
