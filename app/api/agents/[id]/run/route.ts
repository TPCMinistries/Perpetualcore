import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processEmailsForAgent } from "@/lib/agents/email-monitor";
import { processDocumentsForAgent } from "@/lib/agents/document-analyzer";
import { processTasksForAgent } from "@/lib/agents/task-manager";
import { processCalendarForAgent } from "@/lib/agents/calendar-monitor";
import { processDigestForAgent } from "@/lib/agents/daily-digest";
import { logger } from "@/lib/logging";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

/**
 * Manually trigger an agent to run immediately
 * POST /api/agents/[id]/run
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Apply rate limiting - agents are expensive operations
    const rateLimitResponse = await checkRateLimit(request, rateLimiters.strict);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: agentId } = await params;

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

    logger.info(`[Manual Run] Processing agent "${agent.name}" (${agentId})`, {
      agentId,
      agentName: agent.name,
      agentType: agent.agent_type,
    });

    // Process based on agent type
    let result: { processed: number; created?: number; analyzed?: number };
    switch (agent.agent_type) {
      case "email_monitor":
        result = await processEmailsForAgent(agentId);
        break;

      case "document_analyzer":
        const docResult = await processDocumentsForAgent(agentId);
        result = { processed: docResult.processed, created: docResult.analyzed };
        break;

      case "task_manager":
        const taskResult = await processTasksForAgent(agentId);
        result = { processed: taskResult.processed, created: taskResult.updated };
        break;

      case "calendar_monitor":
        const calResult = await processCalendarForAgent(agentId);
        result = { processed: calResult.processed, created: calResult.tasksCreated };
        break;

      case "daily_digest":
        const digestResult = await processDigestForAgent(agentId);
        result = { processed: digestResult.processed ? 1 : 0, created: digestResult.digestId ? 1 : 0 };
        break;

      case "meeting_assistant":
      case "email_organizer":
      case "research_assistant":
      case "workflow_optimizer":
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

    const createdCount = result.created ?? 0;
    logger.info(`[Manual Run] Agent "${agent.name}" processed`, {
      agentId,
      agentName: agent.name,
      processed: result.processed,
      created: createdCount,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.agent_type,
      },
      result: {
        processed: result.processed,
        created: createdCount,
      },
      message: createdCount > 0
        ? `Successfully processed ${result.processed} items and created ${createdCount} new item${createdCount !== 1 ? 's' : ''}`
        : `Processed ${result.processed} items but found no actionable items`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Manual Run] Error", { error });
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
