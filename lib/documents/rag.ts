import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface RelevantDocument {
  documentId: string;
  documentTitle: string;
  documentVisibility: string;
  chunkContent: string;
  similarity: number;
  isPersonal: boolean;
  isShared: boolean;
  sharedInConversation: boolean;
  spaceName?: string;
}

export interface SearchOptions {
  scope?: 'personal' | 'team' | 'organization' | 'all';
  conversationId?: string;
  spaceId?: string;
}

/**
 * Search for relevant document chunks based on a query using vector similarity
 * Now supports context-aware search with visibility, spaces, and conversation context
 */
export async function searchDocuments(
  query: string,
  organizationId: string,
  userId: string,
  topK: number = 5,
  similarityThreshold: number = 0.7,
  options?: SearchOptions
): Promise<RelevantDocument[]> {
  try {
    console.log("🔍 [RAG] Generating embedding for query:", query.substring(0, 50) + "...");

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log("🔍 [RAG] Embedding generated. Length:", queryEmbedding.length, "dimensions");
    console.log("🔍 [RAG] First 5 values:", queryEmbedding.slice(0, 5));

    // Query Supabase for similar chunks using pgvector
    const supabase = createClient();

    console.log("🔍 [RAG] Calling enhanced search_document_chunks with params:");
    console.log("  - org_id:", organizationId);
    console.log("  - requesting_user_id:", userId);
    console.log("  - match_threshold:", similarityThreshold);
    console.log("  - match_count:", topK);
    console.log("  - search_scope:", options?.scope || 'all');
    console.log("  - conversation_id:", options?.conversationId || 'null');
    console.log("  - space_id:", options?.spaceId || 'null');
    console.log("  - embedding dimensions:", queryEmbedding.length);

    // Enhanced RAG function with 8 parameters for context-aware search
    // Supports visibility filtering, team spaces, and conversation context
    const { data, error } = await supabase.rpc("search_document_chunks", {
      query_embedding: queryEmbedding,
      org_id: organizationId,
      requesting_user_id: userId,
      match_threshold: similarityThreshold,
      match_count: topK,
      search_scope: options?.scope || 'all',
      conversation_id: options?.conversationId || null,
      space_id: options?.spaceId || null,
    });

    if (error) {
      console.error("❌ [RAG] Error from search_document_chunks:", error);
      console.error("❌ [RAG] Error details:", JSON.stringify(error, null, 2));
      return [];
    }

    console.log("✅ [RAG] RPC call succeeded. Results:", data?.length || 0);
    if (data && data.length > 0) {
      console.log("✅ [RAG] First result:", {
        title: data[0].document_title,
        similarity: data[0].similarity,
        contentPreview: data[0].content?.substring(0, 100) + "..."
      });
    } else {
      console.log("⚠️ [RAG] RPC returned but data is empty or null:", data);
    }

    return (
      data?.map((row: any) => ({
        documentId: row.document_id,
        documentTitle: row.document_title,
        documentVisibility: row.document_visibility || 'organization',
        chunkContent: row.content,
        similarity: row.similarity,
        isPersonal: row.is_personal || false,
        isShared: row.is_shared || false,
        sharedInConversation: row.shared_in_conversation || false,
        spaceName: row.space_name || undefined,
      })) || []
    );
  } catch (error) {
    console.error("❌ [RAG] Exception in searchDocuments:", error);
    if (error instanceof Error) {
      console.error("❌ [RAG] Error stack:", error.stack);
    }
    return [];
  }
}

/**
 * Build context string from relevant documents to inject into AI prompt
 * Now includes visibility and sharing context
 */
export function buildRAGContext(documents: RelevantDocument[]): string {
  if (documents.length === 0) return "";

  const contextParts = documents.map((doc, index) => {
    let metadata = `[Document ${index + 1}: ${doc.documentTitle}]`;

    // Add context about document source
    if (doc.spaceName) {
      metadata += ` (from ${doc.spaceName} workspace)`;
    } else if (doc.isPersonal) {
      metadata += ` (personal document)`;
    } else if (doc.isShared) {
      metadata += ` (shared with you)`;
    }

    if (doc.sharedInConversation) {
      metadata += ` [actively discussed]`;
    }

    return `${metadata}\n${doc.chunkContent}\n`;
  });

  return `You have access to the following relevant documents from the knowledge base. Use this information to provide accurate, context-aware responses:

---
${contextParts.join("\n---\n")}
---

Please reference these documents when relevant to the user's question. Cite the document name when using information from it. If the information isn't in the documents, you can still use your general knowledge.`;
}

/**
 * Determine if a query should trigger RAG
 * Philosophy: Check documents for almost everything, let the AI decide relevance
 * This mimics NotebookLM's simple, automatic behavior
 */
export function shouldUseRAG(query: string): boolean {
  const trimmed = query.trim();

  // Only skip extremely short or greeting-only queries
  if (trimmed.length < 5) {
    return false;
  }

  // Skip single-word greetings
  const skipPatterns = [
    /^(hi|hello|hey|thanks|ok|yes|no|cool)$/i,
  ];

  if (skipPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // For everything else, check documents
  // Let the AI decide if the retrieved context is relevant
  return true;
}
