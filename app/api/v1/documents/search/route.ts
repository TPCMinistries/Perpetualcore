import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, APIContext } from "@/lib/api";
import { searchDocuments, buildRAGContext } from "@/lib/documents/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public API v1 - Document Search (RAG)
 * POST /api/v1/documents/search
 *
 * Request body:
 * {
 *   "query": "search query",
 *   "limit": 10,
 *   "threshold": 0.4,
 *   "include_context": false
 * }
 */
async function handleSearch(req: NextRequest, context: APIContext): Promise<Response> {
  try {
    const body = await req.json();
    const {
      query,
      limit = 10,
      threshold = 0.4,
      include_context = false,
    }: {
      query: string;
      limit?: number;
      threshold?: number;
      include_context?: boolean;
    } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required and must be a string" },
        { status: 400 }
      );
    }

    // Search documents
    const results = await searchDocuments(
      query,
      context.organizationId,
      context.userId,
      Math.min(limit, 50), // Max 50 results
      Math.max(0, Math.min(threshold, 1)) // Threshold between 0 and 1
    );

    // Format results
    const formattedResults = results.map((r: any) => ({
      document_id: r.document_id,
      filename: r.filename,
      chunk_index: r.chunk_index,
      content: r.content,
      similarity: r.similarity,
    }));

    // Optionally include formatted context for LLM consumption
    let ragContext: string | undefined;
    if (include_context && results.length > 0) {
      ragContext = buildRAGContext(results);
    }

    return NextResponse.json({
      query,
      results: formattedResults,
      total: formattedResults.length,
      ...(ragContext && { rag_context: ragContext }),
    });
  } catch (error: any) {
    console.error("[API v1] Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        message: error?.message || "Unknown error",
        request_id: context.requestId,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, handleSearch, {
    requiredScopes: ["search:read"],
  });
}
