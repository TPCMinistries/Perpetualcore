import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Service role client for n8n webhook calls (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/rag/status
 *
 * RAG system health check and statistics endpoint.
 * Used by n8n to verify RAG is operational before queries.
 *
 * Query params:
 *   user_id: string (optional) - Get stats for specific user's organization
 *
 * Headers:
 *   x-webhook-secret: N8N_WEBHOOK_SECRET (required)
 *
 * Response:
 * {
 *   success: true,
 *   status: "operational" | "degraded" | "offline",
 *   stats: {
 *     total_documents: number,
 *     documents_with_embeddings: number,
 *     total_chunks: number,
 *     embedding_coverage: number (percentage),
 *     by_document_type: { [type]: count }
 *   },
 *   config: {
 *     openai_configured: boolean,
 *     embedding_model: string,
 *     embedding_dimensions: number,
 *     vector_search_enabled: boolean,
 *     text_search_fallback: boolean
 *   },
 *   last_indexed_at: timestamp | null,
 *   checked_at: timestamp
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    let organizationId: string | null = null;

    // If user_id provided, get their organization
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      organizationId = profile?.organization_id || null;
    }

    // Get document stats
    let docQuery = supabase
      .from("documents")
      .select("id, status, document_type, updated_at, created_at", { count: "exact" });

    if (organizationId) {
      docQuery = docQuery.eq("organization_id", organizationId);
    }

    const { data: documents, count: totalDocuments, error: docError } = await docQuery;

    if (docError) {
      console.error("[RAG Status] Document query error:", docError);
    }

    // Get chunk stats (embeddings)
    const { count: totalChunks, data: chunks, error: chunkError } = await supabase
      .from("document_chunks")
      .select("document_id, created_at", { count: "exact" });

    if (chunkError) {
      console.error("[RAG Status] Chunk query error:", chunkError);
    }

    // Calculate unique documents with embeddings
    const documentsWithEmbeddings = chunks
      ? [...new Set(chunks.map((c: any) => c.document_id))].length
      : 0;

    // Stats by document type
    const byDocumentType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    documents?.forEach((doc: any) => {
      // By type
      const type = doc.document_type || "unknown";
      byDocumentType[type] = (byDocumentType[type] || 0) + 1;

      // By status
      const status = doc.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Get last indexed timestamp
    const latestChunk = chunks?.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const latestDocument = documents?.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    // Determine system status
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    let systemStatus: "operational" | "degraded" | "offline" = "operational";

    if (!openaiConfigured) {
      systemStatus = "degraded"; // Can still do text search
    }
    if (docError && chunkError) {
      systemStatus = "offline";
    }

    // Calculate embedding coverage
    const embeddingCoverage = totalDocuments && totalDocuments > 0
      ? Math.round((documentsWithEmbeddings / totalDocuments) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      status: systemStatus,
      stats: {
        total_documents: totalDocuments || 0,
        documents_with_embeddings: documentsWithEmbeddings,
        total_chunks: totalChunks || 0,
        embedding_coverage: embeddingCoverage,
        by_document_type: byDocumentType,
        by_status: byStatus,
      },
      config: {
        openai_configured: openaiConfigured,
        embedding_model: "text-embedding-3-small",
        embedding_dimensions: 1536,
        vector_search_enabled: openaiConfigured,
        text_search_fallback: true,
      },
      timestamps: {
        last_document_added: latestDocument?.created_at || null,
        last_chunk_indexed: latestChunk?.created_at || null,
      },
      organization_id: organizationId,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[RAG Status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "offline",
        error: error instanceof Error ? error.message : "Internal server error",
        checked_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
