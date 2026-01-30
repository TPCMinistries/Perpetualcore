import { NextResponse } from "next/server";
import { processAllEmailMonitorAgents } from "@/lib/agents/email-monitor";
import { processAllDocumentAnalyzerAgents } from "@/lib/agents/document-analyzer";
import { processAllTaskManagerAgents } from "@/lib/agents/task-manager";
import { processAllCalendarMonitorAgents } from "@/lib/agents/calendar-monitor";
import { processAllDailyDigestAgents } from "@/lib/agents/daily-digest";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

interface AgentSchedule {
  agentType: string;
  intervalMinutes: number;
  lastRunKey: string;
}

// Define schedule intervals for each agent type
const AGENT_SCHEDULES: AgentSchedule[] = [
  { agentType: "email_monitor", intervalMinutes: 15, lastRunKey: "email_monitor_last_run" },
  { agentType: "document_analyzer", intervalMinutes: 60, lastRunKey: "document_analyzer_last_run" },
  { agentType: "task_manager", intervalMinutes: 30, lastRunKey: "task_manager_last_run" },
  { agentType: "calendar_monitor", intervalMinutes: 15, lastRunKey: "calendar_monitor_last_run" },
  { agentType: "daily_digest", intervalMinutes: 60, lastRunKey: "daily_digest_last_run" },
];

// In-memory cache for last run times (resets on cold start, but that's fine)
// For persistent tracking, we use the cron_executions table
const lastRunTimes: Record<string, number> = {};

/**
 * Check if an agent should run based on its interval and last execution
 */
async function shouldAgentRun(
  supabase: ReturnType<typeof createAdminClient>,
  agentType: string,
  intervalMinutes: number
): Promise<boolean> {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;

  // Check in-memory cache first (fast path)
  if (lastRunTimes[agentType] && now - lastRunTimes[agentType] < intervalMs) {
    return false;
  }

  // Check database for last successful run
  const { data: lastRun } = await supabase
    .from("cron_executions")
    .select("executed_at")
    .eq("job_name", `agent_${agentType}`)
    .eq("status", "success")
    .order("executed_at", { ascending: false })
    .limit(1)
    .single();

  if (lastRun) {
    const lastRunTime = new Date(lastRun.executed_at).getTime();
    if (now - lastRunTime < intervalMs) {
      // Update cache and skip
      lastRunTimes[agentType] = lastRunTime;
      return false;
    }
  }

  return true;
}

/**
 * Log agent execution to database
 */
async function logAgentExecution(
  supabase: ReturnType<typeof createAdminClient>,
  agentType: string,
  status: "success" | "error",
  result: unknown,
  durationMs: number
) {
  await supabase.from("cron_executions").insert({
    job_name: `agent_${agentType}`,
    status,
    result: result ? JSON.stringify(result) : null,
    duration_ms: durationMs,
    executed_at: new Date().toISOString(),
  });

  // Update in-memory cache on success
  if (status === "success") {
    lastRunTimes[agentType] = Date.now();
  }
}

/**
 * Cron endpoint to process all AI agents
 *
 * This endpoint is triggered by Vercel Cron (configured in vercel.json)
 * to run all enabled agents periodically based on their schedule.
 *
 * Runs every 15 minutes and checks which agent types are due to run.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[Cron] Starting agent processing cycle");

    const results: Record<string, unknown> = {};
    const supabase = createAdminClient();
    const now = Date.now();

    for (const schedule of AGENT_SCHEDULES) {
      // Check if this agent type should run based on interval
      const shouldRun = await shouldAgentRun(supabase, schedule.agentType, schedule.intervalMinutes);

      if (!shouldRun) {
        logger.info(`[Cron] Skipping ${schedule.agentType} - not due yet`);
        results[schedule.agentType] = { skipped: true, reason: "not_due" };
        continue;
      }

      const startTime = Date.now();
      try {
        logger.info(`[Cron] Processing ${schedule.agentType} agents...`);

        let result;
        switch (schedule.agentType) {
          case "email_monitor":
            result = await processAllEmailMonitorAgents();
            results.emailMonitor = {
              agents: result.totalAgents,
              processed: result.totalProcessed,
              created: result.totalCreated,
            };
            break;

          case "document_analyzer":
            result = await processAllDocumentAnalyzerAgents();
            results.documentAnalyzer = {
              agents: result.totalAgents,
              processed: result.totalProcessed,
              analyzed: result.totalAnalyzed,
            };
            break;

          case "task_manager":
            result = await processAllTaskManagerAgents();
            results.taskManager = {
              agents: result.totalAgents,
              processed: result.totalProcessed,
              updated: result.totalUpdated,
            };
            break;

          case "calendar_monitor":
            result = await processAllCalendarMonitorAgents();
            results.calendarMonitor = {
              agents: result.totalAgents,
              processed: result.totalProcessed,
              tasksCreated: result.totalTasksCreated,
              conflicts: result.totalConflicts,
            };
            break;

          case "daily_digest":
            result = await processAllDailyDigestAgents();
            results.dailyDigest = {
              agents: result.totalAgents,
              processed: result.totalProcessed,
              digestsGenerated: result.digestsGenerated,
            };
            break;
        }

        const durationMs = Date.now() - startTime;
        logger.info(`[Cron] ${schedule.agentType} processing complete in ${durationMs}ms`, result);

        // Log successful execution
        await logAgentExecution(supabase, schedule.agentType, "success", result, durationMs);
      } catch (error) {
        const durationMs = Date.now() - startTime;
        logger.error(`[Cron] Error processing ${schedule.agentType}`, { error });
        results[schedule.agentType] = { error: error instanceof Error ? error.message : "Unknown error" };

        // Log failed execution
        await logAgentExecution(
          supabase,
          schedule.agentType,
          "error",
          { error: error instanceof Error ? error.message : "Unknown error" },
          durationMs
        );
      }
    }

    logger.info("[Cron] Agent processing cycle complete", { results });

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Error in agent processing cycle", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
