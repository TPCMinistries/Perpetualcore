import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { extractAndStoreEntities, getDocumentEntities, getEntityStats } from "@/lib/intelligence/entity-extractor";
import { extractAndStoreIntelligence, getDocumentTimeline, getDocumentActionItems, getOrganizationActionItems, getOrganizationUpcomingEvents } from "@/lib/intelligence/timeline-extractor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const type = searchParams.get("type") || "all";

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    if (documentId) {
      // Get intelligence for a specific document
      const [entities, timeline, actionItems] = await Promise.all([
        type === "all" || type === "entities" ? getDocumentEntities(documentId) : [],
        type === "all" || type === "timeline" ? getDocumentTimeline(documentId) : [],
        type === "all" || type === "actions" ? getDocumentActionItems(documentId) : [],
      ]);

      return NextResponse.json({
        entities,
        timeline,
        actionItems,
      });
    } else {
      // Get organization-wide intelligence
      const [entityStats, actionItems, upcomingEvents] = await Promise.all([
        getEntityStats(profile.organization_id),
        getOrganizationActionItems(profile.organization_id, { status: "pending", limit: 20 }),
        getOrganizationUpcomingEvents(profile.organization_id, 30),
      ]);

      return NextResponse.json({
        entityStats,
        pendingActionItems: actionItems,
        upcomingEvents,
      });
    }
  } catch (error) {
    console.error("Intelligence fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Get document content
    const { data: document } = await supabase
      .from("documents")
      .select("content, organization_id")
      .eq("id", documentId)
      .single();

    if (!document || document.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (!document.content) {
      return NextResponse.json(
        { error: "Document has no content to analyze" },
        { status: 400 }
      );
    }

    // Extract all intelligence in parallel
    const [entityResult, intelligenceResult] = await Promise.all([
      extractAndStoreEntities(documentId, profile.organization_id, document.content),
      extractAndStoreIntelligence(documentId, profile.organization_id, document.content),
    ]);

    // Log activity
    await supabase.from("document_activity").insert({
      organization_id: profile.organization_id,
      document_id: documentId,
      user_id: user.id,
      activity_type: "generate_summary",
      metadata: {
        entitiesExtracted: entityResult.count,
        timelineEventsExtracted: intelligenceResult.eventsCount,
        actionItemsExtracted: intelligenceResult.actionItemsCount,
      },
    });

    return NextResponse.json({
      success: true,
      entities: entityResult.count,
      timelineEvents: intelligenceResult.eventsCount,
      actionItems: intelligenceResult.actionItemsCount,
    });
  } catch (error) {
    console.error("Intelligence extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract intelligence" },
      { status: 500 }
    );
  }
}
