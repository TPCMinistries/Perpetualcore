import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { clusterDocuments } from "@/lib/intelligence/document-clustering";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Parse options from request
    let options = {};
    try {
      const body = await req.json().catch(() => ({}));
      options = {
        minClusterSize: body.minClusterSize || 2,
        maxClusters: body.maxClusters || 10,
        similarityThreshold: body.similarityThreshold || 0.7,
      };
    } catch {
      // Use defaults
    }

    // Generate clusters
    const result = await clusterDocuments(profile.organization_id, options);

    // Delete old auto-generated collections
    await supabase
      .from("smart_collections")
      .delete()
      .eq("organization_id", profile.organization_id)
      .eq("collection_type", "auto");

    // Store new collections
    if (result.clusters.length > 0) {
      const collectionsToInsert = result.clusters.map(cluster => ({
        id: cluster.id,
        organization_id: profile.organization_id,
        name: cluster.name,
        description: cluster.description,
        collection_type: "auto",
        document_ids: cluster.documentIds,
        topic_keywords: cluster.keywords,
        color: cluster.color,
        icon: cluster.icon,
        confidence: cluster.confidence,
        is_pinned: false,
      }));

      await supabase
        .from("smart_collections")
        .insert(collectionsToInsert);
    }

    return NextResponse.json({
      clusters: result.clusters,
      unclustered: result.unclustered,
      stats: result.stats,
    });
  } catch (error) {
    console.error("Cluster generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate clusters" },
      { status: 500 }
    );
  }
}
