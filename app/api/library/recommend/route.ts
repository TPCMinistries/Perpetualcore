import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/documents/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RecommendedDocument {
  id: string;
  title: string;
  documentType: string | null;
  summary: string | null;
  reason: string;
  similarity?: number;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const currentDocId = searchParams.get("documentId");
    const context = searchParams.get("context"); // Optional context query

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const recommendations: RecommendedDocument[] = [];

    // If we have a current document, find related ones
    if (currentDocId) {
      // Get the current document
      const { data: currentDoc } = await supabase
        .from("documents")
        .select("title, summary, document_type, content")
        .eq("id", currentDocId)
        .single();

      if (currentDoc) {
        // Use the document's content to find similar documents
        const searchQuery = currentDoc.summary || currentDoc.title;
        const relatedDocs = await searchDocuments(
          searchQuery,
          profile.organization_id,
          user.id,
          6,
          0.5,
          { scope: "all" }
        );

        // Filter out the current document and add to recommendations
        for (const doc of relatedDocs) {
          if (doc.documentId !== currentDocId) {
            const { data: fullDoc } = await supabase
              .from("documents")
              .select("id, title, document_type, summary, created_at")
              .eq("id", doc.documentId)
              .single();

            if (fullDoc) {
              recommendations.push({
                id: fullDoc.id,
                title: fullDoc.title,
                documentType: fullDoc.document_type,
                summary: fullDoc.summary,
                reason: `Related to "${currentDoc.title}"`,
                similarity: doc.similarity,
                createdAt: fullDoc.created_at,
              });
            }
          }
        }
      }
    }

    // If we have a context query, search for relevant documents
    if (context) {
      const contextDocs = await searchDocuments(
        context,
        profile.organization_id,
        user.id,
        5,
        0.6,
        { scope: "all" }
      );

      for (const doc of contextDocs) {
        // Don't add duplicates
        if (!recommendations.find(r => r.id === doc.documentId)) {
          const { data: fullDoc } = await supabase
            .from("documents")
            .select("id, title, document_type, summary, created_at")
            .eq("id", doc.documentId)
            .single();

          if (fullDoc) {
            recommendations.push({
              id: fullDoc.id,
              title: fullDoc.title,
              documentType: fullDoc.document_type,
              summary: fullDoc.summary,
              reason: `Matches your search context`,
              similarity: doc.similarity,
              createdAt: fullDoc.created_at,
            });
          }
        }
      }
    }

    // If no specific context, provide general recommendations
    if (recommendations.length === 0) {
      // Get recently accessed or popular documents
      const { data: recentDocs } = await supabase
        .from("documents")
        .select("id, title, document_type, summary, created_at")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentDocs) {
        for (const doc of recentDocs) {
          recommendations.push({
            id: doc.id,
            title: doc.title,
            documentType: doc.document_type,
            summary: doc.summary,
            reason: "Recently added",
            createdAt: doc.created_at,
          });
        }
      }

      // Get documents with summaries that might be interesting
      const { data: summarizedDocs } = await supabase
        .from("documents")
        .select("id, title, document_type, summary, created_at")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .not("summary", "is", null)
        .order("summary_generated_at", { ascending: false })
        .limit(5);

      if (summarizedDocs) {
        for (const doc of summarizedDocs) {
          if (!recommendations.find(r => r.id === doc.id)) {
            recommendations.push({
              id: doc.id,
              title: doc.title,
              documentType: doc.document_type,
              summary: doc.summary,
              reason: "Has AI-generated insights",
              createdAt: doc.created_at,
            });
          }
        }
      }
    }

    // Limit to 10 recommendations
    return NextResponse.json({
      recommendations: recommendations.slice(0, 10),
      totalFound: recommendations.length,
    });
  } catch (error) {
    console.error("Library recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
