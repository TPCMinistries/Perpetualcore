import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflowId = params.id;

    // Fetch the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Verify user owns this workflow
    if (workflow.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        organization_id: workflow.organization_id,
        status: "running",
        trigger_data: { manual: true, user_id: user.id },
      })
      .select()
      .single();

    if (executionError) {
      console.error("Error creating execution:", executionError);
      return NextResponse.json(
        { error: "Failed to start execution" },
        { status: 500 }
      );
    }

    // In a real implementation, you would:
    // 1. Queue the workflow for execution (using a job queue like Bull, BullMQ, or Supabase Edge Functions)
    // 2. Execute each action in sequence
    // 3. Update the execution record with results

    // For now, we'll simulate a successful execution
    const startTime = Date.now();

    try {
      // Simulate workflow execution
      const steps = [];

      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];

        // Simulate action execution
        steps.push({
          step: i + 1,
          action: action.type,
          status: "success",
          output: `Simulated execution of ${action.type}`,
        });
      }

      const duration = Date.now() - startTime;

      // Update execution as successful
      await supabase
        .from("workflow_executions")
        .update({
          status: "success",
          steps,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id);

      // Update workflow last run info
      await supabase
        .from("workflows")
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: "success",
          run_count: workflow.run_count + 1,
        })
        .eq("id", workflowId);

      return NextResponse.json({
        execution,
        message: "Workflow executed successfully (simulated)",
      });
    } catch (error) {
      // Mark execution as failed
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error_message: String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id);

      throw error;
    }
  } catch (error) {
    console.error("Run workflow API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
