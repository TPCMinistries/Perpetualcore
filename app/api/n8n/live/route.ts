import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkN8nHealth } from "@/lib/n8n";
import {
  transformWorkflowToAutomation,
  transformExecutionToActivity,
  calculateWorkflowStats,
} from "@/lib/integrations/n8n";

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/live
 * Fetch live data directly from n8n instance (no database required)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check configuration
    if (!N8N_API_URL || !N8N_API_KEY || N8N_API_KEY.includes("REPLACE")) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: "n8n API not configured. Add N8N_API_URL and N8N_API_KEY to environment variables.",
        workflows: [],
        executions: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // workflows, executions, all, health
    const limit = parseInt(searchParams.get("limit") || "20");

    if (type === "health") {
      const health = await checkN8nHealth();
      return NextResponse.json({ success: true, health });
    }

    const results: any = { success: true, configured: true };

    // Fetch workflows
    if (type === "all" || type === "workflows") {
      try {
        const workflowsResponse = await fetch(
          `${N8N_API_URL}/workflows?limit=${limit}`,
          {
            headers: {
              "X-N8N-API-KEY": N8N_API_KEY,
              "Accept": "application/json",
            },
          }
        );

        if (workflowsResponse.ok) {
          const workflowsData = await workflowsResponse.json();
          const workflows = (workflowsData.data || []).map(transformWorkflowToAutomation);
          results.workflows = workflows;
          results.workflowStats = {
            total: workflows.length,
            active: workflows.filter((w: any) => w.status === "active").length,
            inactive: workflows.filter((w: any) => w.status === "inactive").length,
          };
        } else {
          results.workflowError = `Failed to fetch workflows: ${workflowsResponse.status}`;
          results.workflows = [];
        }
      } catch (error) {
        results.workflowError = error instanceof Error ? error.message : "Failed to fetch workflows";
        results.workflows = [];
      }
    }

    // Fetch executions
    if (type === "all" || type === "executions") {
      try {
        const executionsResponse = await fetch(
          `${N8N_API_URL}/executions?limit=${limit}`,
          {
            headers: {
              "X-N8N-API-KEY": N8N_API_KEY,
              "Accept": "application/json",
            },
          }
        );

        if (executionsResponse.ok) {
          const executionsData = await executionsResponse.json();
          const rawExecutions = executionsData.data || [];

          // Get workflow names
          let workflowNames: Record<string, string> = {};
          if (results.workflows) {
            workflowNames = results.workflows.reduce(
              (acc: Record<string, string>, wf: any) => {
                acc[wf.id.replace("n8n-", "")] = wf.name;
                return acc;
              },
              {}
            );
          } else {
            // Fetch workflows just for names
            try {
              const wfResponse = await fetch(`${N8N_API_URL}/workflows`, {
                headers: {
                  "X-N8N-API-KEY": N8N_API_KEY,
                  "Accept": "application/json",
                },
              });
              if (wfResponse.ok) {
                const wfData = await wfResponse.json();
                workflowNames = (wfData.data || []).reduce(
                  (acc: Record<string, string>, wf: any) => {
                    acc[wf.id] = wf.name;
                    return acc;
                  },
                  {}
                );
              }
            } catch {}
          }

          const executions = rawExecutions.map((exec: any) =>
            transformExecutionToActivity({
              ...exec,
              workflowName: workflowNames[exec.workflowId] || `Workflow ${exec.workflowId}`,
            })
          );

          const stats = calculateWorkflowStats(rawExecutions);

          results.executions = executions;
          results.executionStats = {
            total: stats.total,
            success: stats.success,
            error: stats.error,
            running: stats.running,
            avgDurationMs: stats.avgDuration,
          };
        } else {
          results.executionError = `Failed to fetch executions: ${executionsResponse.status}`;
          results.executions = [];
        }
      } catch (error) {
        results.executionError = error instanceof Error ? error.message : "Failed to fetch executions";
        results.executions = [];
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("n8n live API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch n8n data" },
      { status: 500 }
    );
  }
}
