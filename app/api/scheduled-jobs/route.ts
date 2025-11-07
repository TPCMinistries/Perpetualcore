import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
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

    const { data: jobs, error } = await supabase
      .from("scheduled_jobs")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (error) {
    console.error("Scheduled jobs API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
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

    const body = await request.json();
    const {
      name,
      description,
      cron_expression,
      job_type,
      target_id,
      config,
      timezone,
    } = body;

    // Validate required fields
    if (!name || !cron_expression || !job_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate next run time (simplified - in production use proper cron parser)
    const nextRunAt = new Date();
    nextRunAt.setHours(nextRunAt.getHours() + 1);

    const { data: job, error: createError } = await supabase
      .from("scheduled_jobs")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name,
        description,
        cron_expression,
        job_type,
        target_id,
        config: config || {},
        timezone: timezone || "UTC",
        enabled: true,
        next_run_at: nextRunAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating job:", createError);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Create job API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
