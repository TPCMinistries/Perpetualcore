import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

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

    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const { data: template, error: templateError } = await supabase
      .from("job_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Calculate next run time (simplified - in production use proper cron parser)
    const nextRunAt = new Date();
    nextRunAt.setHours(nextRunAt.getHours() + 1);

    const { data: job, error: createError } = await supabase
      .from("scheduled_jobs")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: template.name,
        description: template.description,
        cron_expression: template.default_cron,
        job_type: template.job_type,
        config: template.default_config,
        enabled: true,
        next_run_at: nextRunAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      if (isDev) console.error("Error creating job:", createError);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }

    // Increment template usage count
    await supabase
      .from("job_templates")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", templateId);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (isDev) console.error("Install template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
