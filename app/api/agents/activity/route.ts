import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResult = await rateLimiters.api.check(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Query agent_actions (the actual table) with agent info
    // First get all agent IDs for this organization
    const { data: orgAgents } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("organization_id", profile.organization_id);

    const agentIds = orgAgents?.map(a => a.id) || [];

    if (agentIds.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    // Get actions for those agents
    const { data: actions, error } = await supabase
      .from("agent_actions")
      .select(`
        id,
        agent_id,
        action_type,
        action_data,
        status,
        error_message,
        task_id,
        created_at,
        agent:ai_agents(name, agent_type)
      `)
      .in("agent_id", agentIds)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching activities:", error);
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }

    // Transform to activity format expected by frontend
    const activities = (actions || []).map(action => ({
      id: action.id,
      agent_id: action.agent_id,
      action_type: action.action_type,
      action_data: action.action_data,
      status: action.status,
      error_message: action.error_message,
      task_id: action.task_id,
      created_at: action.created_at,
      agent: action.agent,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Activity API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
