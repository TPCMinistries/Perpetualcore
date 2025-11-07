import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: executions, error } = await supabase
      .from("job_executions")
      .select("*, job:scheduled_jobs(name, job_type)")
      .eq("organization_id", profile.organization_id)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching executions:", error);
      return NextResponse.json({ error: "Failed to fetch executions" }, { status: 500 });
    }

    return NextResponse.json({ executions: executions || [] });
  } catch (error) {
    console.error("Execution history API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
