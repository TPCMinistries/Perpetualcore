import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch automations from multiple sources
    const [botsResult, workflowsResult, jobsResult] = await Promise.all([
      // Bots
      supabase
        .from("bots")
        .select("id, name, description, status, last_run_at, run_count, success_rate, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),

      // Workflows
      supabase
        .from("workflows")
        .select("id, name, description, status, last_run_at, run_count, success_rate, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),

      // Scheduled jobs
      supabase
        .from("scheduled_jobs")
        .select("id, name, description, status, last_run_at, next_run_at, run_count, success_rate, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    // Combine and normalize automations
    const automations = [
      ...(botsResult.data || []).map((bot: any) => ({
        id: bot.id,
        name: bot.name,
        description: bot.description,
        type: "bot" as const,
        status: bot.status || "inactive",
        lastRun: bot.last_run_at,
        runCount: bot.run_count || 0,
        successRate: bot.success_rate || 100,
        createdAt: bot.created_at,
        updatedAt: bot.updated_at,
      })),
      ...(workflowsResult.data || []).map((wf: any) => ({
        id: wf.id,
        name: wf.name,
        description: wf.description,
        type: "workflow" as const,
        status: wf.status || "inactive",
        lastRun: wf.last_run_at,
        runCount: wf.run_count || 0,
        successRate: wf.success_rate || 100,
        createdAt: wf.created_at,
        updatedAt: wf.updated_at,
      })),
      ...(jobsResult.data || []).map((job: any) => ({
        id: job.id,
        name: job.name,
        description: job.description,
        type: "job" as const,
        status: job.status || "inactive",
        lastRun: job.last_run_at,
        nextRun: job.next_run_at,
        runCount: job.run_count || 0,
        successRate: job.success_rate || 100,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      })),
    ];

    // Sort by most recently updated
    automations.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({
      automations,
    });
  } catch (error) {
    console.error("Automation API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}
