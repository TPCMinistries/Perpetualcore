import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QueueAutomationRequest, AutomationJob } from "@/types/entities";

export const runtime = "nodejs";

/**
 * GET - Get pending jobs (for n8n Master Orchestrator to poll)
 * Can be called with or without auth - uses API key for n8n
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for n8n API key in header
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.AUTOMATION_API_KEY;

    // If API key provided and matches, allow service-level access
    const isServiceCall = apiKey && expectedKey && apiKey === expectedKey;

    if (!isServiceCall) {
      // Otherwise require user auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Get next job for processing
    if (action === "next") {
      const { data: job, error } = await supabase.rpc("get_next_automation_job");

      if (error) {
        console.error("Error getting next job:", error);
        return NextResponse.json({ job: null });
      }

      return NextResponse.json({ job: job?.[0] || null });
    }

    // List jobs (for UI display)
    const status = searchParams.get("status");
    const entityId = searchParams.get("entity_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("automation_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    // If not service call, filter by user
    if (!isServiceCall) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = query.eq("owner_id", user.id);
      }
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error("Error listing jobs:", error);
      return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error) {
    console.error("Automation queue GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

/**
 * POST - Queue a new automation job
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: QueueAutomationRequest = await req.json();

    if (!body.job_type) {
      return NextResponse.json(
        { error: "job_type is required" },
        { status: 400 }
      );
    }

    // Use the helper function to queue the job
    const { data: jobId, error } = await supabase.rpc("queue_automation_job", {
      p_owner_id: user.id,
      p_job_type: body.job_type,
      p_payload: body.payload || {},
      p_entity_id: body.entity_id || null,
      p_brand_id: body.brand_id || null,
      p_project_id: body.project_id || null,
      p_priority: body.priority || "normal",
      p_scheduled_for: body.scheduled_for || new Date().toISOString(),
    });

    if (error) {
      console.error("Error queueing job:", error);
      return NextResponse.json(
        { error: "Failed to queue job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ job_id: jobId, success: true });
  } catch (error) {
    console.error("Automation queue POST error:", error);
    return NextResponse.json(
      { error: "Failed to queue job" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update job status (for n8n to complete/fail jobs)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for n8n API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.AUTOMATION_API_KEY;
    const isServiceCall = apiKey && expectedKey && apiKey === expectedKey;

    if (!isServiceCall) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { job_id, action, result, error_message, n8n_execution_id } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 }
      );
    }

    if (action === "complete") {
      const { data: success, error } = await supabase.rpc("complete_automation_job", {
        p_job_id: job_id,
        p_result: result || null,
        p_n8n_execution_id: n8n_execution_id || null,
      });

      if (error) {
        console.error("Error completing job:", error);
        return NextResponse.json(
          { error: "Failed to complete job" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success });
    }

    if (action === "fail") {
      const { data: success, error } = await supabase.rpc("fail_automation_job", {
        p_job_id: job_id,
        p_error_message: error_message || "Unknown error",
        p_permanent: body.permanent || false,
      });

      if (error) {
        console.error("Error failing job:", error);
        return NextResponse.json(
          { error: "Failed to update job" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Automation queue PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel a job
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("automation_queue")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("owner_id", user.id)
      .in("status", ["pending", "processing"]);

    if (error) {
      console.error("Error cancelling job:", error);
      return NextResponse.json(
        { error: "Failed to cancel job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Automation queue DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 }
    );
  }
}
