import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GraphNode {
  id: string;
  label: string;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

/**
 * Explore knowledge graph - returns nodes and edges for visualization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const organizationId = profile.organization_id as string;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const centerConcept = searchParams.get("center");
    const depth = Math.min(parseInt(searchParams.get("depth") || "2", 10), 3);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // Fetch relationships
    let query = supabase
      .from("knowledge_graph")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("strength", { ascending: false })
      .limit(limit);

    // If center concept specified, filter to related concepts
    if (centerConcept) {
      query = query.or(
        `source_concept.ilike.%${centerConcept}%,target_concept.ilike.%${centerConcept}%`
      );
    }

    const { data: relationships, error } = await query;

    if (error) {
      throw error;
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        totalNodes: 0,
        totalEdges: 0,
      });
    }

    // Build nodes and edges for graph visualization
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const rel of relationships) {
      // Add source node
      if (!nodeMap.has(rel.source_concept)) {
        nodeMap.set(rel.source_concept, {
          id: rel.source_concept,
          label: rel.source_concept,
          connections: 0,
        });
      }
      nodeMap.get(rel.source_concept)!.connections++;

      // Add target node
      if (!nodeMap.has(rel.target_concept)) {
        nodeMap.set(rel.target_concept, {
          id: rel.target_concept,
          label: rel.target_concept,
          connections: 0,
        });
      }
      nodeMap.get(rel.target_concept)!.connections++;

      // Add edge
      edges.push({
        source: rel.source_concept,
        target: rel.target_concept,
        type: rel.relationship_type,
        strength: rel.strength,
      });
    }

    const nodes = Array.from(nodeMap.values()).sort(
      (a, b) => b.connections - a.connections
    );

    return NextResponse.json({
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      center: centerConcept || null,
    });
  } catch (error: any) {
    console.error("Error exploring knowledge graph:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
