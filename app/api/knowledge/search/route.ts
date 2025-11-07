import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * POST /api/knowledge/search
 * Semantic search across documents using natural language
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { query, limit = 10 } = body;

    if (!query || typeof query !== "string") {
      return new Response("Query is required", { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response("No organization found", { status: 403 });
    }

    console.log(`🔍 Semantic search query: "${query}"`);

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Use Supabase's vector search to find similar documents
    // Note: This requires pgvector extension and a function in the database
    const { data: results, error: searchError } = await supabase.rpc(
      "search_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit,
        org_id: profile.organization_id,
      }
    );

    if (searchError) {
      console.error("Semantic search error:", searchError);
      // Fallback to basic text search if vector search fails
      const { data: fallbackResults } = await supabase
        .from("documents")
        .select("id, title, document_type, summary, content, created_at")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(limit);

      console.log(`📝 Fallback to text search, found ${fallbackResults?.length || 0} results`);

      return Response.json({
        results: fallbackResults || [],
        fallback: true,
        message: "Using text-based search (vector search unavailable)",
      });
    }

    console.log(`✅ Found ${results?.length || 0} semantic matches`);

    return Response.json({
      results: results || [],
      fallback: false,
    });
  } catch (error: any) {
    console.error("Knowledge search error:", error);
    return new Response(`Failed to search knowledge base: ${error.message}`, {
      status: 500,
    });
  }
}
