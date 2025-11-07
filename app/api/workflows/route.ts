import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/workflows
 * List all workflows for the user's organization
 */
export async function GET(request: NextRequest) {
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const enabled = searchParams.get("enabled");

    // Build query
    let query = supabase
      .from("workflows")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (enabled !== null && enabled !== undefined) {
      query = query.eq("enabled", enabled === "true");
    }

    const { data: workflows, error } = await query;

    if (error) {
      console.error("Error fetching workflows:", error);
      return NextResponse.json(
        { error: "Failed to fetch workflows", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workflows: workflows || [],
      count: workflows?.length || 0,
    });
  } catch (error: any) {
    console.error("Get workflows error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      icon,
      category,
      nodes,
      edges,
      trigger_type,
      trigger_config,
      enabled,
      timeout_seconds,
      max_retries,
    } = body;

    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Workflow name is required" }, { status: 400 });
    }

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Workflow nodes are required" }, { status: 400 });
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Workflow edges are required" }, { status: 400 });
    }

    if (!trigger_type || !["manual", "schedule", "webhook", "event"].includes(trigger_type)) {
      return NextResponse.json({ error: "Valid trigger_type is required" }, { status: 400 });
    }

    // Create workflow
    const { data: workflow, error: insertError } = await supabase
      .from("workflows")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "⚡",
        category: category || null,
        nodes: nodes,
        edges: edges,
        trigger_type: trigger_type,
        trigger_config: trigger_config || {},
        enabled: enabled !== undefined ? enabled : true,
        timeout_seconds: timeout_seconds || 300,
        max_retries: max_retries !== undefined ? max_retries : 3,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating workflow:", insertError);
      return NextResponse.json(
        { error: "Failed to create workflow", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Workflow created successfully",
      workflow,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
