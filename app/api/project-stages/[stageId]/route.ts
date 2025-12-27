import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PUT - Update a stage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, color, icon, description, sort_order, is_default, is_complete } = body;

  // Build update object
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    updates.name = name;
    // Update slug if name changes
    updates.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;
  if (description !== undefined) updates.description = description;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (is_default !== undefined) updates.is_default = is_default;
  if (is_complete !== undefined) updates.is_complete = is_complete;

  const { data: stage, error } = await supabase
    .from("project_stages")
    .update(updates)
    .eq("id", stageId)
    .eq("organization_id", profile.organization_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating stage:", error);
    return NextResponse.json(
      { error: "Failed to update stage" },
      { status: 500 }
    );
  }

  return NextResponse.json({ stage });
}

// DELETE - Delete (archive) a stage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const { stageId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  // Check if there are projects in this stage
  const { data: projectsInStage } = await supabase
    .from("projects")
    .select("id")
    .eq("current_stage", stageId)
    .eq("organization_id", profile.organization_id)
    .limit(1);

  // Get stage info for slug check
  const { data: stageInfo } = await supabase
    .from("project_stages")
    .select("slug")
    .eq("id", stageId)
    .single();

  // Also check by slug (for legacy projects using slug-based stages)
  const { data: projectsBySlug } = await supabase
    .from("projects")
    .select("id")
    .eq("current_stage", stageInfo?.slug || "")
    .eq("organization_id", profile.organization_id)
    .limit(1);

  if ((projectsInStage && projectsInStage.length > 0) ||
      (projectsBySlug && projectsBySlug.length > 0)) {
    return NextResponse.json(
      { error: "Cannot delete stage with projects. Move projects first." },
      { status: 400 }
    );
  }

  // Soft delete (archive) the stage
  const { error } = await supabase
    .from("project_stages")
    .update({ is_archived: true })
    .eq("id", stageId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error deleting stage:", error);
    return NextResponse.json(
      { error: "Failed to delete stage" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
