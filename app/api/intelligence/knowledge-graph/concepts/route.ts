import {
  getRelatedConcepts,
  findConceptPath,
} from "@/lib/intelligence/knowledge-graph";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get related concepts or find path between concepts
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
    const concept = searchParams.get("concept");
    const target = searchParams.get("target");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!concept) {
      return NextResponse.json(
        { error: "Concept parameter is required" },
        { status: 400 }
      );
    }

    // If target is provided, find path between concepts
    if (target) {
      const path = await findConceptPath(organizationId, concept, target);
      return NextResponse.json({
        source: concept,
        target,
        path,
        pathLength: path.length,
        connected: path.length > 0,
      });
    }

    // Otherwise, get related concepts
    const related = await getRelatedConcepts(organizationId, concept, limit);

    return NextResponse.json({
      concept,
      related,
      count: related.length,
    });
  } catch (error: any) {
    console.error("Error querying concepts:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
