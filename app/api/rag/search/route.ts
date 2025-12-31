import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Service role client for n8n webhook calls (bypasses RLS)
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchRequest {
  query: string;
  user_id: string;
  limit?: number;
  doc_types?: string[];
}

interface SearchResult {
  document_id: string;
  document_title: string;
  document_type: string | null;
  relevant_chunk: string;
  similarity_score: number;
}

/**
 * POST /api/rag/search
 *
 * RAG search endpoint for n8n integration.
 * Searches documents using vector similarity with text search fallback.
 *
 * Headers:
 *   x-webhook-secret: N8N_WEBHOOK_SECRET (required)
 *
 * Body:
 *   query: string - The search query
 *   user_id: string - UUID of the user whose documents to search
 *   limit?: number - Max results (default: 5)
 *   doc_types?: string[] - Filter by document types, ["all"] for all types
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: SearchRequest = await req.json();
    const { query, user_id, limit = 5, doc_types = ["all"] } = body;

    // Validate required fields
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    // Use service role client for n8n webhook calls
    const supabase = serviceClient;

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user_id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("[RAG Search] Profile error:", profileError);
      return NextResponse.json(
        { success: false, error: "User not found or has no organization" },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;
    console.log("[RAG Search] Searching for user:", user_id, "org:", organizationId);
    let results: SearchResult[] = [];

    // Try vector search first
    const vectorResults = await performVectorSearch(
      supabase,
      query,
      organizationId,
      user_id,
      limit,
      doc_types
    );

    if (vectorResults.length > 0) {
      results = vectorResults;
    } else {
      // Fall back to text search
      console.log("[RAG Search] No vector results, falling back to text search");
      results = await performTextSearch(
        supabase,
        query,
        organizationId,
        limit,
        doc_types
      );
    }

    return NextResponse.json({
      success: true,
      results,
      query,
      searched_at: new Date().toISOString(),
      search_type: results === vectorResults ? "vector" : "text",
    });
  } catch (error) {
    console.error("[RAG Search] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Perform vector similarity search using embeddings
 */
async function performVectorSearch(
  supabase: any,
  query: string,
  organizationId: string,
  userId: string,
  limit: number,
  docTypes: string[]
): Promise<SearchResult[]> {
  try {
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search using the existing RPC function
    const { data, error } = await supabase.rpc("search_document_chunks", {
      query_embedding: queryEmbedding,
      org_id: organizationId,
      requesting_user_id: userId,
      match_threshold: 0.5, // Lower threshold for broader results
      match_count: limit * 2, // Get more to filter by doc_type
      search_scope: "all",
      conversation_id: null,
      space_id: null,
    });

    if (error) {
      console.error("[RAG Search] Vector search error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter by document type if specified
    let filteredData = data;
    if (!docTypes.includes("all")) {
      // Get document types for the matched documents
      const docIds = Array.from(new Set(data.map((d: any) => d.document_id))) as string[];
      const { data: docs } = await supabase
        .from("documents")
        .select("id, document_type")
        .in("id", docIds);

      const docTypeMap = new Map(docs?.map((d: any) => [d.id, d.document_type]) || []);

      filteredData = data.filter((d: any) => {
        const docType = docTypeMap.get(d.document_id);
        return docTypes.includes(docType) || docTypes.includes(docType?.toLowerCase());
      });
    }

    // Map to response format and dedupe by document
    const seenDocs = new Set<string>();
    const results: SearchResult[] = [];

    for (const row of filteredData) {
      if (seenDocs.has(row.document_id)) continue;
      seenDocs.add(row.document_id);

      results.push({
        document_id: row.document_id,
        document_title: row.document_title,
        document_type: row.document_type || null,
        relevant_chunk: row.content,
        similarity_score: Math.round(row.similarity * 100) / 100,
      });

      if (results.length >= limit) break;
    }

    return results;
  } catch (error) {
    console.error("[RAG Search] Vector search exception:", error);
    return [];
  }
}

/**
 * Fallback text search when embeddings aren't available
 */
async function performTextSearch(
  supabase: any,
  query: string,
  organizationId: string,
  limit: number,
  docTypes: string[]
): Promise<SearchResult[]> {
  try {
    // Build the query
    let dbQuery = supabase
      .from("documents")
      .select("id, title, document_type, content, ai_summary")
      .eq("organization_id", organizationId)
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,ai_summary.ilike.%${query}%`
      );

    // Filter by document type
    if (!docTypes.includes("all")) {
      dbQuery = dbQuery.in("document_type", docTypes);
    }

    const { data, error } = await dbQuery.limit(limit);

    if (error) {
      console.error("[RAG Search] Text search error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((doc: any) => ({
      document_id: doc.id,
      document_title: doc.title,
      document_type: doc.document_type,
      relevant_chunk: doc.ai_summary || doc.content?.substring(0, 500) || "",
      similarity_score: 0.5, // No real similarity score for text search
    }));
  } catch (error) {
    console.error("[RAG Search] Text search exception:", error);
    return [];
  }
}

/**
 * GET /api/rag/search
 *
 * RAG status endpoint - returns information about the RAG system.
 * Can be used for health checks and n8n diagnostics.
 *
 * Query params:
 *   user_id: string (optional) - Get stats for specific user
 *
 * Headers:
 *   x-webhook-secret: N8N_WEBHOOK_SECRET (required)
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

    const supabase = serviceClient;

    // Get total document count
    let docQuery = supabase
      .from("documents")
      .select("id, status, document_type, updated_at", { count: "exact" });

    if (userId) {
      // Get user's organization first
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (profile?.organization_id) {
        docQuery = docQuery.eq("organization_id", profile.organization_id);
      }
    }

    const { data: documents, count: totalDocuments } = await docQuery;

    // Get documents with embeddings (check document_chunks table)
    let chunkQuery = supabase
      .from("document_chunks")
      .select("document_id, created_at", { count: "exact" });

    const { count: totalChunks, data: chunks } = await chunkQuery;

    // Get unique documents that have been chunked
    const uniqueDocIds = chunks
      ? [...new Set(chunks.map((c: any) => c.document_id))]
      : [];

    // Calculate stats by document type
    const byType: Record<string, number> = {};
    documents?.forEach((doc: any) => {
      const type = doc.document_type || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    });

    // Get last indexed date
    const latestChunk = chunks?.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    // Check if OpenAI API is configured
    const openaiConfigured = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      success: true,
      status: "operational",
      stats: {
        total_documents: totalDocuments || 0,
        documents_with_embeddings: uniqueDocIds.length,
        total_chunks: totalChunks || 0,
        embedding_coverage: totalDocuments
          ? Math.round((uniqueDocIds.length / totalDocuments) * 100)
          : 0,
        by_document_type: byType,
      },
      config: {
        openai_configured: openaiConfigured,
        embedding_model: "text-embedding-3-small",
        embedding_dimensions: 1536,
        vector_search_enabled: true,
        text_search_fallback: true,
      },
      last_indexed_at: latestChunk?.created_at || null,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[RAG Status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
