import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/automation-logs
 * Fetch automation logs for the authenticated user
 *
 * Query params:
 * - workflow_type: filter by type (meeting_processor, daily_briefing, etc.)
 * - status: filter by status (success, error, pending, running)
 * - from: start date (ISO)
 * - to: end date (ISO)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workflowType = searchParams.get("workflow_type");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("automation_logs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workflowType) {
      query = query.eq("workflow_type", workflowType);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      console.error("Failed to fetch automation logs:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get aggregate stats
    const { data: stats } = await supabase
      .from("automation_logs")
      .select("status, workflow_type")
      .eq("user_id", user.id);

    const aggregateStats = {
      total: stats?.length || 0,
      success: stats?.filter((s) => s.status === "success").length || 0,
      error: stats?.filter((s) => s.status === "error").length || 0,
      running: stats?.filter((s) => s.status === "running").length || 0,
      byType: {} as Record<string, number>,
    };

    stats?.forEach((s) => {
      if (s.workflow_type) {
        aggregateStats.byType[s.workflow_type] = (aggregateStats.byType[s.workflow_type] || 0) + 1;
      }
    });

    return Response.json({
      success: true,
      logs,
      total: count,
      stats: aggregateStats,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/automation-logs error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
