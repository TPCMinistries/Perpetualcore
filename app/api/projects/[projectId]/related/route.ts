import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/projects/[projectId]/related - Get related items for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to use the helper function
    const { data: items, error } = await supabase
      .rpc("get_related_items", {
        p_item_type: "project",
        p_item_id: projectId,
      });

    if (error) {
      console.error("Error fetching related items:", error);
      // Fallback to direct query
      const { data: outgoing } = await supabase
        .from("item_relationships")
        .select("*")
        .eq("source_type", "project")
        .eq("source_id", projectId);

      const { data: incoming } = await supabase
        .from("item_relationships")
        .select("*")
        .eq("target_type", "project")
        .eq("target_id", projectId);

      // Get titles for related items
      const relatedIds = new Set<string>();
      const relatedTypes: Record<string, string[]> = {};

      [...(outgoing || []), ...(incoming || [])].forEach(r => {
        const type = r.source_type === "project" ? r.target_type : r.source_type;
        const relId = r.source_type === "project" ? r.target_id : r.source_id;
        relatedIds.add(relId);
        if (!relatedTypes[type]) relatedTypes[type] = [];
        relatedTypes[type].push(relId);
      });

      // Fetch titles from different tables
      const titleMap: Record<string, { title: string; status?: string }> = {};

      if (relatedTypes.decision?.length) {
        const { data: decisions } = await supabase
          .from("decisions")
          .select("id, title, status")
          .in("id", relatedTypes.decision);
        decisions?.forEach(d => titleMap[d.id] = { title: d.title, status: d.status });
      }

      if (relatedTypes.opportunity?.length) {
        const { data: opps } = await supabase
          .from("work_items")
          .select("id, title, final_decision")
          .in("id", relatedTypes.opportunity);
        opps?.forEach(o => titleMap[o.id] = { title: o.title, status: o.final_decision });
      }

      if (relatedTypes.project?.length) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name, status")
          .in("id", relatedTypes.project);
        projects?.forEach(p => titleMap[p.id] = { title: p.name, status: p.status });
      }

      // Also check for source decision (projects created from decisions)
      const { data: project } = await supabase
        .from("projects")
        .select("source_decision_id")
        .eq("id", projectId)
        .single();

      let sourceDecision = null;
      if (project?.source_decision_id) {
        const { data: decision } = await supabase
          .from("decisions")
          .select("id, title, status")
          .eq("id", project.source_decision_id)
          .single();
        if (decision) {
          sourceDecision = {
            relationship_id: `source_${project.source_decision_id}`,
            relationship_type: "created_from",
            direction: "incoming",
            related_type: "decision",
            related_id: decision.id,
            related_title: decision.title,
            related_status: decision.status,
            is_source: true,
          };
        }
      }

      // Format the results
      const allItems = [
        ...(sourceDecision ? [sourceDecision] : []),
        ...(outgoing || []).map((r) => ({
          relationship_id: r.id,
          relationship_type: r.relationship_type,
          direction: "outgoing",
          related_type: r.target_type,
          related_id: r.target_id,
          related_title: titleMap[r.target_id]?.title || null,
          related_status: titleMap[r.target_id]?.status || null,
          created_at: r.created_at,
        })),
        ...(incoming || []).map((r) => ({
          relationship_id: r.id,
          relationship_type: r.relationship_type,
          direction: "incoming",
          related_type: r.source_type,
          related_id: r.source_id,
          related_title: titleMap[r.source_id]?.title || null,
          related_status: titleMap[r.source_id]?.status || null,
          created_at: r.created_at,
        })),
      ];

      return NextResponse.json({ items: allItems });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Get related items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/related - Link a related item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { target_type, target_id, relationship_type, description } = body;

    if (!target_type || !target_id || !relationship_type) {
      return NextResponse.json(
        { error: "target_type, target_id, and relationship_type are required" },
        { status: 400 }
      );
    }

    const { data: relationship, error } = await supabase
      .from("item_relationships")
      .insert({
        source_type: "project",
        source_id: projectId,
        target_type,
        target_id,
        relationship_type,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating relationship:", error);
      return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
    }

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    console.error("Create relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/related - Remove a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { relationship_id } = body;

    if (!relationship_id) {
      return NextResponse.json({ error: "relationship_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("item_relationships")
      .delete()
      .eq("id", relationship_id);

    if (error) {
      console.error("Error removing relationship:", error);
      return NextResponse.json({ error: "Failed to remove relationship" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove relationship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
