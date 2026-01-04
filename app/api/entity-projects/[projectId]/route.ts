import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch single entity project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from("entity_projects")
      .select(`
        *,
        entity:entities(id, name),
        stage:lookup_project_stages(id, name, color)
      `)
      .eq("id", params.projectId)
      .eq("owner_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        ...project,
        current_stage: project.stage?.name || "planning",
      }
    });
  } catch (error) {
    console.error("Entity project API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update entity project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.current_stage_id !== undefined) updates.current_stage_id = body.current_stage_id;
    if (body.tags !== undefined) updates.tags = body.tags;

    updates.updated_at = new Date().toISOString();

    const { data: project, error } = await supabase
      .from("entity_projects")
      .update(updates)
      .eq("id", params.projectId)
      .eq("owner_id", user.id)
      .select(`
        *,
        entity:entities(id, name),
        stage:lookup_project_stages(id, name, color)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Entity project update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete entity project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("entity_projects")
      .delete()
      .eq("id", params.projectId)
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entity project delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
