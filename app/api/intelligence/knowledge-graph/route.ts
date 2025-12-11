import {
  getKnowledgeGraphStats,
  getAllConcepts,
  findConceptClusters,
} from "@/lib/intelligence/knowledge-graph";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get knowledge graph overview and statistics
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

    // Get stats, concepts, and clusters in parallel
    const [stats, concepts, clusters] = await Promise.all([
      getKnowledgeGraphStats(organizationId),
      getAllConcepts(organizationId),
      findConceptClusters(organizationId, 2),
    ]);

    return NextResponse.json({
      stats,
      concepts,
      clusters,
    });
  } catch (error: any) {
    console.error("Error getting knowledge graph:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
