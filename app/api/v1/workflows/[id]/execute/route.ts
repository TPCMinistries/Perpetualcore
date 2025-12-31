import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, APIContext } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { webhookEvents } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public API v1 - Execute Workflow
 * POST /api/v1/workflows/[id]/execute
 *
 * Request body:
 * {
 *   "inputs": { "key": "value" },
 *   "async": false
 * }
 */
async function handleExecute(
  req: NextRequest,
  context: APIContext,
  workflowId: string
): Promise<Response> {
  const supabase = await createClient();

  try {
    const body = await req.json().catch(() => ({}));
    const { inputs = {}, async: runAsync = false } = body;

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("organization_id", context.organizationId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!workflow.is_active) {
      return NextResponse.json(
        { error: "Workflow is not active" },
        { status: 400 }
      );
    }

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        organization_id: context.organizationId,
        triggered_by: context.userId,
        trigger_type: "api",
        status: "running",
        inputs,
      })
      .select()
      .single();

    if (execError) {
      console.error("[API v1] Workflow execution error:", execError);
      return NextResponse.json(
        { error: "Failed to start workflow", message: execError.message },
        { status: 500 }
      );
    }

    // Dispatch webhook
    webhookEvents.workflowTriggered(context.organizationId, {
      workflowId: workflow.id,
      executionId: execution.id,
      triggeredBy: "api",
    }).catch(() => {});

    if (runAsync) {
      // Return immediately, workflow runs in background
      return NextResponse.json({
        execution_id: execution.id,
        workflow_id: workflow.id,
        status: "running",
        message: "Workflow execution started",
      });
    }

    // Synchronous execution - simulate running workflow steps
    try {
      const steps = workflow.steps || [];
      const stepResults: any[] = [];

      for (const step of steps) {
        // Execute each step
        const stepResult = await executeWorkflowStep(step, inputs, stepResults);
        stepResults.push({
          step_id: step.id,
          step_name: step.name,
          result: stepResult,
          completed_at: new Date().toISOString(),
        });
      }

      // Update execution as completed
      await supabase
        .from("workflow_executions")
        .update({
          status: "completed",
          outputs: { steps: stepResults },
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id);

      // Dispatch completion webhook
      webhookEvents.workflowCompleted(context.organizationId, {
        workflowId: workflow.id,
        executionId: execution.id,
        result: { steps: stepResults },
      }).catch(() => {});

      return NextResponse.json({
        execution_id: execution.id,
        workflow_id: workflow.id,
        status: "completed",
        outputs: { steps: stepResults },
      });
    } catch (execError: any) {
      // Update execution as failed
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error: execError.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id);

      return NextResponse.json(
        {
          execution_id: execution.id,
          workflow_id: workflow.id,
          status: "failed",
          error: execError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API v1] Workflow execute error:", error);
    return NextResponse.json(
      {
        error: "Workflow execution failed",
        message: error?.message || "Unknown error",
        request_id: context.requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Execute a single workflow step
 */
async function executeWorkflowStep(
  step: any,
  inputs: Record<string, any>,
  previousResults: any[]
): Promise<any> {
  const stepType = step.type || "action";

  switch (stepType) {
    case "condition":
      return { evaluated: true, branch: "true" };

    case "ai_response":
      return { message: "AI response placeholder", model: step.config?.model || "auto" };

    case "api_call":
      // Placeholder for API call execution
      return { status: 200, data: {} };

    case "transform":
      return { transformed: true, data: inputs };

    case "delay":
      const delayMs = step.config?.delay_ms || 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000)));
      return { delayed_ms: delayMs };

    default:
      return { executed: true, type: stepType };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiAuth(
    req,
    (req, context) => handleExecute(req, context, id),
    { requiredScopes: ["workflows:execute"] }
  );
}
