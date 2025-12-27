import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SmartCollection {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  documentIds: string[];
  confidence: number;
  color: string;
  icon: string;
  isPinned: boolean;
  type: "auto" | "manual";
}

export async function GET(req: NextRequest) {
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

    // Get stored collections
    const { data: collections } = await supabase
      .from("smart_collections")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Get document count
    const { count: totalDocuments } = await supabase
      .from("documents")
      .select("id", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed");

    // Transform to response format
    const formattedCollections: SmartCollection[] = (collections || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      keywords: c.topic_keywords || [],
      documentIds: c.document_ids || [],
      confidence: c.confidence || 0.5,
      color: c.color || "#3B82F6",
      icon: c.icon || "folder",
      isPinned: c.is_pinned || false,
      type: c.collection_type as "auto" | "manual",
    }));

    const clusteredDocIds = new Set(formattedCollections.flatMap(c => c.documentIds));

    return NextResponse.json({
      collections: formattedCollections,
      stats: {
        totalDocuments: totalDocuments || 0,
        clusteredDocuments: clusteredDocIds.size,
        clusterCount: formattedCollections.length,
      },
    });
  } catch (error) {
    console.error("Collections fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
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
    const { name, documentIds, color, icon } = body;

    if (!name || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Name and documentIds are required" },
        { status: 400 }
      );
    }

    // Create manual collection
    const { data: collection, error } = await supabase
      .from("smart_collections")
      .insert({
        organization_id: profile.organization_id,
        name,
        collection_type: "manual",
        document_ids: documentIds,
        color: color || "#3B82F6",
        icon: icon || "folder",
        confidence: 1.0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Collection create error:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
