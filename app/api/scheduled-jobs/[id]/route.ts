import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

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
      if (isDev) console.error("Error deleting job:", deleteError);
      return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDev) console.error("Delete job API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
