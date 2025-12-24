import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ProjectStage } from "@/types/work";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// PUT /api/projects/[projectId]/stage - Update project stage (for Kanban drag-drop)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { stage, sort_order } = body;

    // Validate stage
    const validStages: ProjectStage[] = [
      "ideation",
      "planning",
      "in_progress",
      "review",
      "complete",
    ];

    if (!stage || !validStages.includes(stage)) {
      return NextResponse.json(
        { error: "Invalid stage. Must be one of: " + validStages.join(", ") },
        { status: 400 }
      );
    }

    // Check if user has permission to update this project
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by, current_stage")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_edit_project")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canEdit =
      isAdmin ||
      isCreator ||
      membership?.can_edit_project ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canEdit) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {
      current_stage: stage,
    };

    // If moving to complete, set completed_at
    if (stage === "complete" && project.current_stage !== "complete") {
      updateData.completed_at = new Date().toISOString();
    }

    // If moving out of complete, clear completed_at
    if (stage !== "complete" && project.current_stage === "complete") {
      updateData.completed_at = null;
    }

    // Update sort_order if provided
    if (sort_order !== undefined) {
      updateData.sort_order = sort_order;
    }

    // Update the project
    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project stage:", error);
      return NextResponse.json(
        { error: "Failed to update project stage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Project stage API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
