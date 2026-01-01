import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isN8nConfigured } from "@/lib/n8n";

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    // Fetch automations from multiple sources
    const [botsResult, workflowsResult, n8nDbResult, jobsResult] = await Promise.all([
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

      // n8n workflows from database (organization-based)
      profile?.organization_id
        ? supabase
            .from("n8n_workflows")
            .select("id, local_name, n8n_workflow_name, description, is_active, last_execution_at, total_executions, successful_executions, created_at, updated_at")
            .eq("organization_id", profile.organization_id)
            .order("updated_at", { ascending: false })
        : { data: [] },

      // Scheduled jobs
      supabase
        .from("scheduled_jobs")
        .select("id, name, description, status, last_run_at, next_run_at, run_count, success_rate, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    // Fetch live n8n workflows if configured
    let liveN8nWorkflows: any[] = [];
    if (isN8nConfigured() && N8N_API_URL && N8N_API_KEY) {
      try {
        const n8nResponse = await fetch(`${N8N_API_URL}/workflows?limit=50`, {
          headers: {
            "X-N8N-API-KEY": N8N_API_KEY,
            "Accept": "application/json",
          },
        });

        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          liveN8nWorkflows = (n8nData.data || []).map((wf: any) => ({
            id: `n8n-live-${wf.id}`,
            name: wf.name,
            description: `n8n workflow: ${wf.name}`,
            type: "n8n" as const,
            status: wf.active ? "active" : "inactive",
            lastRun: wf.updatedAt,
            runCount: 0,
            successRate: 100,
            createdAt: wf.createdAt,
            updatedAt: wf.updatedAt,
            metadata: {
              source: "live",
              n8nId: wf.id,
              tags: wf.tags?.map((t: any) => t.name) || [],
            },
          }));
        }
      } catch (error) {
        console.error("Failed to fetch live n8n workflows:", error);
      }
    }

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
      // n8n workflows from database
      ...(n8nDbResult.data || []).map((n8n: any) => ({
        id: n8n.id,
        name: n8n.local_name || n8n.n8n_workflow_name,
        description: n8n.description,
        type: "n8n" as const,
        status: n8n.is_active ? "active" : "inactive",
        lastRun: n8n.last_execution_at,
        runCount: n8n.total_executions || 0,
        successRate: n8n.total_executions
          ? Math.round((n8n.successful_executions / n8n.total_executions) * 100)
          : 100,
        createdAt: n8n.created_at,
        updatedAt: n8n.updated_at,
        metadata: { source: "database" },
      })),
      // Live n8n workflows (deduplicated by checking if already in database)
      ...liveN8nWorkflows.filter(liveWf => {
        const n8nId = liveWf.metadata?.n8nId;
        const existsInDb = (n8nDbResult.data || []).some(
          (dbWf: any) => dbWf.n8n_workflow_id === n8nId
        );
        return !existsInDb;
      }),
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
      n8nConfigured: isN8nConfigured(),
      n8nLiveCount: liveN8nWorkflows.length,
    });
  } catch (error) {
    console.error("Automation API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}
