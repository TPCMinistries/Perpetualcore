import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  N8nExecution,
  transformExecutionToActivity,
  calculateWorkflowStats
} from "@/lib/integrations/n8n";

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/executions
 * Fetch execution history from n8n instance
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!N8N_API_URL || !N8N_API_KEY || N8N_API_KEY.includes("REPLACE")) {
      return NextResponse.json({
        error: "n8n API not configured",
        configured: false
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    // Build query params
    const params = new URLSearchParams();
    if (workflowId) params.set("workflowId", workflowId);
    if (status) params.set("status", status);
    if (limit) params.set("limit", limit.toString());
    if (cursor) params.set("cursor", cursor);

    // Fetch executions from n8n
    const response = await fetch(`${N8N_API_URL}/executions?${params}`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("n8n API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch executions from n8n" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const executions: N8nExecution[] = data.data || [];

    // Get workflow names if not included
    let workflowNames: Record<string, string> = {};
    if (executions.length > 0) {
      const uniqueWorkflowIds = [...new Set(executions.map(e => e.workflowId))];

      // Fetch workflow details to get names
      try {
        const workflowsResponse = await fetch(`${N8N_API_URL}/workflows`, {
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Accept": "application/json",
          },
        });

        if (workflowsResponse.ok) {
          const workflowsData = await workflowsResponse.json();
          workflowNames = (workflowsData.data || []).reduce(
            (acc: Record<string, string>, wf: any) => {
              acc[wf.id] = wf.name;
              return acc;
            },
            {}
          );
        }
      } catch {
        // Continue without workflow names
      }
    }

    // Transform executions with workflow names
    const transformedExecutions = executions.map((exec) => ({
      ...transformExecutionToActivity({
        ...exec,
        workflowName: exec.workflowName || workflowNames[exec.workflowId] || `Workflow ${exec.workflowId}`,
      }),
    }));

    // Calculate overall stats
    const stats = calculateWorkflowStats(executions);

    // Group by status for summary
    const statusSummary = {
      success: executions.filter(e => e.status === "success").length,
      error: executions.filter(e => e.status === "error").length,
      running: executions.filter(e => !e.finished).length,
      waiting: executions.filter(e => e.status === "waiting").length,
    };

    return NextResponse.json({
      success: true,
      executions: transformedExecutions,
      stats,
      statusSummary,
      nextCursor: data.nextCursor,
      hasMore: data.hasMore,
      total: executions.length,
    });
  } catch (error) {
    console.error("n8n executions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch executions" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/n8n/executions/[id]
 * Get details of a specific execution
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!N8N_API_URL || !N8N_API_KEY || N8N_API_KEY.includes("REPLACE")) {
      return NextResponse.json({
        error: "n8n API not configured",
        configured: false
      }, { status: 503 });
    }

    const body = await req.json();
    const { executionId, action } = body;

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    if (action === "details") {
      // Fetch execution details
      const response = await fetch(
        `${N8N_API_URL}/executions/${executionId}`,
        {
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("n8n API error:", error);
        return NextResponse.json(
          { error: "Failed to fetch execution details" },
          { status: response.status }
        );
      }

      const execution = await response.json();

      return NextResponse.json({
        success: true,
        execution: transformExecutionToActivity(execution),
        raw: execution,
      });
    }

    if (action === "delete") {
      // Delete execution
      const response = await fetch(
        `${N8N_API_URL}/executions/${executionId}`,
        {
          method: "DELETE",
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("n8n API error:", error);
        return NextResponse.json(
          { error: "Failed to delete execution" },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Execution deleted",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("n8n execution action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
