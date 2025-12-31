import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncWorkflowsFromN8n, executeWorkflow, pollExecutionStatus } from "@/lib/n8n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - List n8n workflows
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get("integration_id");
    const active = searchParams.get("active");

    let query = supabase
      .from("n8n_workflows")
      .select(`
        *,
        n8n_integrations!inner (
          id,
          name,
          n8n_instance_url
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("last_execution_at", { ascending: false, nullsFirst: false });

    if (integrationId) {
      query = query.eq("n8n_integration_id", integrationId);
    }

    if (active === "true") {
      query = query.eq("is_active", true);
    }

    const { data: workflows, error } = await query;

    if (error) {
      if (isDev) console.error("Error fetching workflows:", error);
      return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
    }

    return NextResponse.json({
      workflows: (workflows || []).map((w: any) => ({
        id: w.id,
        n8n_workflow_id: w.n8n_workflow_id,
        name: w.local_name || w.n8n_workflow_name,
        original_name: w.n8n_workflow_name,
        description: w.description,
        category: w.category,
        tags: w.tags,
        trigger_type: w.trigger_type,
        is_active: w.is_active,
        is_synced: w.is_synced,
        stats: {
          total_executions: w.total_executions,
          successful_executions: w.successful_executions,
          failed_executions: w.failed_executions,
          avg_execution_time_ms: w.avg_execution_time_ms,
          last_execution_at: w.last_execution_at,
          last_execution_status: w.last_execution_status,
        },
        integration: {
          id: w.n8n_integrations.id,
          name: w.n8n_integrations.name,
        },
        last_synced_at: w.last_synced_at,
        created_at: w.created_at,
      })),
    });
  } catch (error: any) {
    if (isDev) console.error("n8n workflows error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Sync workflows or execute a workflow
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const { action, integration_id, workflow_id, input_data } = body;

    if (action === "sync") {
      // Sync workflows from n8n
      if (!integration_id) {
        return NextResponse.json({ error: "integration_id is required" }, { status: 400 });
      }

      const result = await syncWorkflowsFromN8n(integration_id, profile.organization_id);

      return NextResponse.json({
        success: result.success,
        synced: result.synced,
        added: result.added,
        updated: result.updated,
        removed: result.removed,
        errors: result.errors,
      });
    }

    if (action === "execute") {
      // Execute a workflow
      if (!workflow_id) {
        return NextResponse.json({ error: "workflow_id is required" }, { status: 400 });
      }

      const result = await executeWorkflow(
        workflow_id,
        profile.organization_id,
        user.id,
        input_data || {},
        "manual"
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, execution_id: result.executionId },
          { status: 400 }
        );
      }

      // Optionally poll for completion (for short-running workflows)
      const { searchParams } = new URL(req.url);
      const waitForCompletion = searchParams.get("wait") === "true";

      if (waitForCompletion && result.executionId) {
        const pollResult = await pollExecutionStatus(
          result.executionId,
          profile.organization_id,
          15, // 15 attempts
          2000 // 2 seconds each
        );

        return NextResponse.json({
          success: pollResult.success,
          execution_id: result.executionId,
          n8n_execution_id: result.n8nExecutionId,
          status: pollResult.status,
          output_data: pollResult.outputData,
          error: pollResult.error,
        });
      }

      return NextResponse.json({
        success: true,
        execution_id: result.executionId,
        n8n_execution_id: result.n8nExecutionId,
        message: "Workflow execution started",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (isDev) console.error("n8n workflows action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT - Update workflow settings
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const { workflow_id, local_name, description, category, tags, is_active } = body;

    if (!workflow_id) {
      return NextResponse.json({ error: "workflow_id is required" }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (local_name !== undefined) updates.local_name = local_name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: workflow, error } = await supabase
      .from("n8n_workflows")
      .update(updates)
      .eq("id", workflow_id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) {
      if (isDev) console.error("Error updating workflow:", error);
      return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.local_name || workflow.n8n_workflow_name,
        is_active: workflow.is_active,
      },
    });
  } catch (error: any) {
    if (isDev) console.error("n8n workflow update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
