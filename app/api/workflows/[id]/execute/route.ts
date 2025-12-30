import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorkflowExecutionEngine } from "@/lib/workflow-engine";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

/**
 * POST /api/workflows/[id]/execute
 * Execute a workflow with optional input data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting - workflow execution can be expensive
    const rateLimitResponse = await checkRateLimit(request, rateLimiters.strict);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: workflowId } = await params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Check if workflow is enabled
    if (!workflow.enabled) {
      return NextResponse.json(
        { error: "Workflow is disabled" },
        { status: 400 }
      );
    }

    // Parse request body for input data
    const body = await request.json().catch(() => ({}));
    const inputData = body.inputData || {};

    // Create execution record
    const { data: execution, error: executionError} = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        organization_id: profile.organization_id,
        user_id: user.id,
        triggered_by: "manual",  // Fixed: add required triggered_by field
        status: "pending",
        input_data: inputData,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError || !execution) {
      console.error("Error creating execution:", executionError);
      return NextResponse.json(
        { error: "Failed to create execution record" },
        { status: 500 }
      );
    }

    // Initialize workflow execution engine
    const engine = new WorkflowExecutionEngine(
      execution.id,
      workflowId,
      workflow.nodes,
      workflow.edges
    );

    // Execute workflow (this runs asynchronously)
    // We don't await here for long-running workflows
    engine.execute(inputData).catch((error) => {
      console.error("Workflow execution error:", error);
    });

    // Return execution ID immediately so user can track progress
    return NextResponse.json(
      {
        message: "Workflow execution started",
        execution: {
          id: execution.id,
          workflow_id: workflowId,
          status: "running",
          started_at: execution.started_at,
        },
      },
      { status: 202 } // 202 Accepted - execution started
    );
  } catch (error: any) {
    console.error("Execute workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/[id]/execute
 * Get execution history for a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get execution history
    const { data: executions, error: executionsError } = await supabase
      .from("workflow_executions")
      .select("*")
      .eq("workflow_id", workflowId)
      .eq("organization_id", profile.organization_id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (executionsError) {
      console.error("Error fetching executions:", executionsError);
      return NextResponse.json(
        { error: "Failed to fetch execution history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      executions: executions || [],
      count: executions?.length || 0,
    });
  } catch (error: any) {
    console.error("Get execution history error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
