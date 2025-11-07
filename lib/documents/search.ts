import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SearchResult {
  content: string;
  similarity: number;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
}

/**
 * Perform semantic search on user's document chunks
 * Uses OpenAI embeddings + Supabase pgvector for similarity search
 */
export async function searchDocuments(
  query: string,
  userId: string,
  options: {
    topK?: number;
    similarityThreshold?: number;
  } = {}
): Promise<SearchResult[]> {
  const { topK = 5, similarityThreshold = 0.7 } = options;

  try {
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search document chunks using pgvector similarity
    const supabase = createClient();

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile || !profile.organization_id) {
      return [];
    }

    // Perform vector similarity search
    // Using RPC function for pgvector cosine similarity
    const { data: chunks, error } = await supabase.rpc(
      "search_document_chunks",
      {
        query_embedding: queryEmbedding,
        org_id: profile.organization_id,
        match_threshold: similarityThreshold,
        match_count: topK,
      }
    );

    if (error) {
      console.error("Error searching documents:", error);
      return [];
    }

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Map results to SearchResult interface
    return chunks.map((chunk: any) => ({
      content: chunk.content,
      similarity: chunk.similarity,
      documentId: chunk.document_id,
      documentTitle: chunk.document_title,
      chunkIndex: chunk.chunk_index,
    }));
  } catch (error) {
    console.error("Error in searchDocuments:", error);
    return [];
  }
}

/**
 * Format search results for injection into AI context
 */
export function formatContextForAI(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const documentGroups = results.reduce((acc, result) => {
    if (!acc[result.documentTitle]) {
      acc[result.documentTitle] = [];
    }
    acc[result.documentTitle].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  let context = "# Relevant Information from User's Documents\n\n";

  for (const [docTitle, chunks] of Object.entries(documentGroups)) {
    context += `## From: ${docTitle}\n\n`;
    chunks.forEach((chunk, idx) => {
      context += `### Excerpt ${idx + 1} (Relevance: ${(chunk.similarity * 100).toFixed(1)}%)\n`;
      context += `${chunk.content}\n\n`;
    });
  }

  return context;
}

/**
 * Get list of documents referenced in search results
 */
export function getReferencedDocuments(results: SearchResult[]): Array<{
  id: string;
  title: string;
}> {
  const uniqueDocs = new Map<string, string>();

  results.forEach((result) => {
    uniqueDocs.set(result.documentId, result.documentTitle);
  });

  return Array.from(uniqueDocs.entries()).map(([id, title]) => ({
    id,
    title,
  }));
}
