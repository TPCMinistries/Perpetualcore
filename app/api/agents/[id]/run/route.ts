import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processEmailsForAgent } from "@/lib/agents/email-monitor";

/**
 * Manually trigger an agent to run immediately
 * POST /api/agents/[id]/run
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;

    // Get agent details and verify ownership
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("*, profiles!inner(organization_id, id)")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (!agent.enabled) {
      return NextResponse.json({ error: "Cannot run disabled agent" }, { status: 400 });
    }

    console.log(`[Manual Run] Processing agent "${agent.name}" (${agentId})`);

    // Process based on agent type
    let result;
    switch (agent.agent_type) {
      case "email_monitor":
        result = await processEmailsForAgent(agentId);
        break;

      case "calendar_monitor":
      case "document_analyzer":
      case "task_manager":
      case "meeting_assistant":
      case "email_organizer":
      case "research_assistant":
      case "workflow_optimizer":
      case "daily_digest":
      case "sentiment_monitor":
        // These agent types aren't implemented yet
        return NextResponse.json({
          error: `Agent type "${agent.agent_type}" is not yet implemented`,
          message: "This agent type will be available in a future update"
        }, { status: 501 });

      default:
        return NextResponse.json({
          error: "Unknown agent type",
          message: `Agent type "${agent.agent_type}" is not recognized`
        }, { status: 400 });
    }

    // Update last_active_at
    await supabase
      .from("ai_agents")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", agentId);

    console.log(`[Manual Run] Agent "${agent.name}" processed: ${result.processed} emails, ${result.created} tasks created`);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.agent_type,
      },
      result: {
        processed: result.processed,
        created: result.created,
      },
      message: result.created > 0
        ? `Successfully processed ${result.processed} items and created ${result.created} new task${result.created !== 1 ? 's' : ''}`
        : `Processed ${result.processed} items but found no actionable items`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Manual Run] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to run agent manually"
      },
      { status: 500 }
    );
  }
}
