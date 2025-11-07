import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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

    // Verify ownership
    const { data: job } = await supabase
      .from("scheduled_jobs")
      .select("user_id")
      .eq("id", jobId)
      .single();

    if (!job || job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("scheduled_jobs")
      .delete()
      .eq("id", jobId);

    if (deleteError) {
      console.error("Error deleting job:", deleteError);
      return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
