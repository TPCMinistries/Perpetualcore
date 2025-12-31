import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("automation_executions")
      .select(`
        id,
        automation_id,
        automation_type,
        status,
        started_at,
        completed_at,
        duration_ms,
        summary,
        error_message
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("automation_type", type);
    }

    const { data: executions, error } = await query;

    if (error) throw error;

    // Get automation names
    const automationIds = [...new Set(executions?.map((e) => e.automation_id) || [])];

    // Fetch names from multiple tables
    const [botsResult, workflowsResult, n8nResult, jobsResult] = await Promise.all([
      supabase.from("bots").select("id, name").in("id", automationIds),
      supabase.from("workflows").select("id, name").in("id", automationIds),
      supabase.from("n8n_workflows").select("id, name").in("id", automationIds),
      supabase.from("scheduled_jobs").select("id, name").in("id", automationIds),
    ]);

    const nameMap = new Map<string, string>();
    [...(botsResult.data || []), ...(workflowsResult.data || []), ...(n8nResult.data || []), ...(jobsResult.data || [])]
      .forEach((item: any) => nameMap.set(item.id, item.name));

    const enrichedExecutions = (executions || []).map((exec) => ({
      id: exec.id,
      automationId: exec.automation_id,
      automationName: nameMap.get(exec.automation_id) || "Unknown",
      automationType: exec.automation_type,
      status: exec.status,
      startedAt: exec.started_at,
      completedAt: exec.completed_at,
      duration: exec.duration_ms,
      summary: exec.summary,
      error: exec.error_message,
    }));

    return NextResponse.json({ executions: enrichedExecutions });
  } catch (error) {
    console.error("Executions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}
