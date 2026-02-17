import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit, extractRequestContext } from "@/lib/audit/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Get workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update a workflow
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify workflow belongs to user's organization
    const { data: existing } = await supabase
      .from("workflows")
      .select("id, name, organization_id")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
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

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (icon !== undefined) updates.icon = icon;
    if (category !== undefined) updates.category = category;
    if (nodes !== undefined) updates.nodes = nodes;
    if (edges !== undefined) updates.edges = edges;
    if (trigger_type !== undefined) updates.trigger_type = trigger_type;
    if (trigger_config !== undefined) updates.trigger_config = trigger_config;
    if (enabled !== undefined) updates.enabled = enabled;
    if (timeout_seconds !== undefined) updates.timeout_seconds = timeout_seconds;
    if (max_retries !== undefined) updates.max_retries = max_retries;

    const { data: workflow, error } = await supabase
      .from("workflows")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workflow:", error);
      return NextResponse.json(
        { error: "Failed to update workflow", details: error.message },
        { status: 500 }
      );
    }

    const reqCtx = extractRequestContext(request);
    logAudit({
      event: "WORKFLOW_UPDATED",
      resource_type: "workflow",
      resource_id: workflow.id,
      resource_name: workflow.name,
      description: `Workflow "${workflow.name}" updated`,
      details: { updated_fields: Object.keys(updates) },
      user_id: user.id,
      organization_id: profile.organization_id,
      ip_address: reqCtx.ip_address || undefined,
      user_agent: reqCtx.user_agent || undefined,
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Update workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify workflow belongs to user's organization and get name for audit
    const { data: existing } = await supabase
      .from("workflows")
      .select("id, name, organization_id")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting workflow:", error);
      return NextResponse.json(
        { error: "Failed to delete workflow", details: error.message },
        { status: 500 }
      );
    }

    const reqCtx = extractRequestContext(request);
    logAudit({
      event: "WORKFLOW_DELETED",
      resource_type: "workflow",
      resource_id: id,
      resource_name: existing.name,
      description: `Workflow "${existing.name}" deleted`,
      user_id: user.id,
      organization_id: profile.organization_id,
      ip_address: reqCtx.ip_address || undefined,
      user_agent: reqCtx.user_agent || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
