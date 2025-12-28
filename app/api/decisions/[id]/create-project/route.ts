import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/create-project - Create a project from a decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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

    // Get the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, target_date, team_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() || decision.decision_rationale || decision.description,
        source_decision_id: id,
        team_id: team_id || null,
        target_date: target_date || null,
        status: "planning",
        owner_id: user.id,
        priority: decision.priority || "medium",
      })
      .select()
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }

    // Update the decision with the spawned project
    await supabase
      .from("decisions")
      .update({
        spawned_project_id: project.id,
        implementation_status: "in_progress",
      })
      .eq("id", id);

    // Create the relationship
    await supabase
      .from("item_relationships")
      .insert({
        source_type: "decision",
        source_id: id,
        target_type: "project",
        target_id: project.id,
        relationship_type: "spawns",
        created_by: user.id,
      });

    // Record event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "updated",
      comment: `Created project: ${project.name}`,
      performed_by: user.id,
      performed_by_system: false,
      metadata: { project_id: project.id },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project from decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
