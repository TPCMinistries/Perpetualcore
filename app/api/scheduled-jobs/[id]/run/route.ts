import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("scheduled_jobs")
      .select("*, organization_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from("job_executions")
      .insert({
        job_id: jobId,
        organization_id: job.organization_id,
        status: "running",
        started_at: new Date().toISOString(),
        input_data: { manual: true, user_id: user.id },
      })
      .select()
      .single();

    if (executionError) {
      console.error("Error creating execution:", executionError);
      return NextResponse.json({ error: "Failed to start execution" }, { status: 500 });
    }

    // Simulate job execution
    // In production, this would be handled by a background worker/queue
    setTimeout(async () => {
      const startTime = Date.now();
      const success = Math.random() > 0.1; // 90% success rate for demo
      const endTime = Date.now();

      await supabase
        .from("job_executions")
        .update({
          status: success ? "success" : "failed",
          completed_at: new Date().toISOString(),
          duration_ms: endTime - startTime,
          output_data: success
            ? { result: "Job completed successfully", logs: ["Step 1: Started", "Step 2: Processing", "Step 3: Completed"] }
            : null,
          error_message: success ? null : "Simulated random failure for demo purposes",
          logs: [
            { timestamp: new Date().toISOString(), level: "info", message: "Job started" },
            { timestamp: new Date().toISOString(), level: success ? "info" : "error", message: success ? "Job completed" : "Job failed" },
          ],
        })
        .eq("id", execution.id);
    }, 2000); // Simulate 2 second execution

    return NextResponse.json({
      execution,
      message: "Job execution started"
    });
  } catch (error) {
    console.error("Run job API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
