import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;
    const { enabled } = await request.json();

    // Verify ownership
    const { data: job } = await supabase
      .from("scheduled_jobs")
      .select("user_id, cron_expression")
      .eq("id", jobId)
      .single();

    if (!job || job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If enabling, calculate next run time
    const updateData: any = { enabled };
    if (enabled) {
      const nextRunAt = new Date();
      nextRunAt.setHours(nextRunAt.getHours() + 1);
      updateData.next_run_at = nextRunAt.toISOString();
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from("scheduled_jobs")
      .update(updateData)
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) {
      console.error("Error toggling job:", updateError);
      return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
    }

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error("Toggle job API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
