import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/tasks/recurring
// Get all recurring task templates
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get recurring templates
    const { data: templates, error: templatesError } = await supabase
      .from("recurring_task_templates")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("Error fetching recurring templates:", templatesError);
      return NextResponse.json(
        { error: "Failed to fetch recurring templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Get recurring templates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/recurring
// Create a new recurring task template
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      priority,
      assigned_to,
      project_name,
      tags,
      recurrence_pattern,
      start_date,
      end_date,
      generate_days_ahead,
    } = body;

    if (!title || !recurrence_pattern || !start_date) {
      return NextResponse.json(
        { error: "Title, recurrence_pattern, and start_date are required" },
        { status: 400 }
      );
    }

    // Create recurring template
    const { data: template, error: insertError } = await supabase
      .from("recurring_task_templates")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        title,
        description,
        priority: priority || "medium",
        assigned_to,
        project_name,
        tags: tags || [],
        recurrence_pattern,
        start_date,
        end_date,
        generate_days_ahead: generate_days_ahead || 30,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating recurring template:", insertError);
      return NextResponse.json(
        { error: "Failed to create recurring template" },
        { status: 500 }
      );
    }

    // Generate initial instances
    const { data: instancesCreated } = await supabase.rpc(
      "generate_recurring_task_instances",
      {
        p_template_id: template.id,
        p_generate_until_date: new Date(Date.now() + (generate_days_ahead || 30) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }
    );

    return NextResponse.json({
      template,
      instancesCreated,
    }, { status: 201 });
  } catch (error) {
    console.error("Create recurring template API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
