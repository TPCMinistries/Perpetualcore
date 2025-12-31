import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * POST - Receive callback from n8n workflow execution
 *
 * n8n can call this endpoint to report workflow completion
 * Configure in n8n with an HTTP Request node at the end of workflows
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get callback data
    const body = await req.json();
    const {
      execution_id, // Our execution ID
      n8n_execution_id,
      status, // 'success' or 'failed'
      output_data,
      error_message,
    } = body;

    // Validate required fields
    if (!execution_id) {
      return NextResponse.json({ error: "execution_id is required" }, { status: 400 });
    }

    if (!status || !["success", "failed"].includes(status)) {
      return NextResponse.json({ error: "status must be 'success' or 'failed'" }, { status: 400 });
    }

    // Get execution to verify it exists
    const { data: execution, error: execError } = await supabase
      .from("n8n_workflow_executions")
      .select("id, status, organization_id, n8n_workflow_id")
      .eq("id", execution_id)
      .single();

    if (execError || !execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    // Only update if still running
    if (execution.status !== "running" && execution.status !== "pending") {
      return NextResponse.json({
        success: true,
        message: "Execution already completed",
        current_status: execution.status,
      });
    }

    // Update execution
    const success = status === "success";

    await supabase.rpc("complete_n8n_execution", {
      p_execution_id: execution_id,
      p_success: success,
      p_output_data: output_data || null,
      p_error_message: error_message || null,
      p_n8n_execution_id: n8n_execution_id || null,
    });

    if (isDev) {
      console.log(`[n8n Callback] Execution ${execution_id} marked as ${status}`);
    }

    return NextResponse.json({
      success: true,
      execution_id,
      status,
    });
  } catch (error: any) {
    if (isDev) console.error("n8n callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Health check for n8n callback endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "n8n-callback",
    accepts: "POST",
    required_fields: ["execution_id", "status"],
    optional_fields: ["n8n_execution_id", "output_data", "error_message"],
  });
}
