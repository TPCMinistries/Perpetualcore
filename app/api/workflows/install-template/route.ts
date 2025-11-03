import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/workflows/install-template
 * Create a new workflow from a template
 */
export async function POST(request: NextRequest) {
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { templateId, name, description } = body;

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Create workflow from template
    const { data: workflow, error: insertError } = await supabase
      .from("workflows")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name: name || template.name,
        description: description || template.description,
        icon: template.icon || "⚡",
        category: template.category || null,
        nodes: template.nodes,
        edges: template.edges,
        trigger_type: template.default_trigger_type || "manual",
        trigger_config: {},
        enabled: true,
        timeout_seconds: 300,
        max_retries: 3,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating workflow from template:", insertError);
      return NextResponse.json(
        { error: "Failed to create workflow", details: insertError.message },
        { status: 500 }
      );
    }

    // Increment template usage count
    await supabase
      .from("workflow_templates")
      .update({
        usage_count: (template.usage_count || 0) + 1,
      })
      .eq("id", templateId);

    return NextResponse.json({
      message: "Workflow created from template successfully",
      workflow,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Install template error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
