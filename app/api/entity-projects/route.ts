import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch entity projects for user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entity_id");
    const brandId = searchParams.get("brand_id");
    const stageId = searchParams.get("stage_id");
    const groupByStage = searchParams.get("group_by_stage") === "true";

    // Build query
    let query = supabase
      .from("entity_projects")
      .select(`
        *,
        entity:entities(id, name),
        brand:brands(id, name),
        stage:lookup_project_stages(id, name, color)
      `)
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    // Apply filters
    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    if (stageId) {
      query = query.eq("current_stage_id", stageId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching entity projects:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Get stage lookup for grouping
    const { data: stages } = await supabase
      .from("lookup_project_stages")
      .select("id, name, color, sort_order")
      .eq("is_active", true)
      .order("sort_order");

    // Transform to match the expected project format
    const transformedProjects = (projects || []).map((project: any) => ({
      ...project,
      current_stage: project.stage?.name || "planning",
      current_stage_color: project.stage?.color || "blue",
    }));

    // Optionally group by stage for Kanban view
    if (groupByStage) {
      // Use standard stage keys that match the ProjectStage type
      const grouped: Record<string, any[]> = {
        ideation: [],
        planning: [],
        in_progress: [],
        review: [],
        complete: [],
      };

      // Map database stage names to standard keys
      const stageMapping: Record<string, string> = {
        ideation: "ideation",
        planning: "planning",
        research: "planning",
        drafting: "planning",
        active: "in_progress",
        in_progress: "in_progress",
        review: "review",
        submitted: "review",
        awarded: "review",
        complete: "complete",
        completed: "complete",
        cancelled: "complete",
        on_hold: "planning",
      };

      // Group projects
      for (const project of transformedProjects) {
        const stageName = project.current_stage || "planning";
        const mappedStage = stageMapping[stageName] || "planning";
        grouped[mappedStage].push(project);
      }

      return NextResponse.json({
        projects: grouped,
        grouped: true,
        stages: stages
      });
    }

    return NextResponse.json({
      projects: transformedProjects,
      stages: stages
    });
  } catch (error) {
    console.error("Entity projects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new entity project
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!body.entity_id) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Get default planning stage
    const { data: planningStage } = await supabase
      .from("lookup_project_stages")
      .select("id")
      .eq("name", "planning")
      .single();

    const { data: project, error } = await supabase
      .from("entity_projects")
      .insert({
        entity_id: body.entity_id,
        brand_id: body.brand_id || null,
        owner_id: user.id,
        name: body.name.trim(),
        description: body.description || null,
        priority: body.priority || "medium",
        current_stage_id: planningStage?.id || null,
        tags: body.tags || [],
        is_active: true,
      })
      .select(`
        *,
        entity:entities(id, name),
        stage:lookup_project_stages(id, name, color)
      `)
      .single();

    if (error) {
      console.error("Error creating entity project:", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Entity projects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
