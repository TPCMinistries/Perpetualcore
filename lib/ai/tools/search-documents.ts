/**
 * Document Search Tool
 * Allows AI to search through user's uploaded documents using existing RAG
 */

import { Tool, ToolExecutionContext } from "./schema";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export const searchDocumentsTool: Tool = {
  name: "search_documents",
  description:
    "Search through the user's uploaded documents and knowledge base. Use this when the user asks about information that might be in their documents, files, or previously uploaded content. Examples: 'what does my contract say about', 'find information about X in my documents', 'search my files for'.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The search query. Be specific about what information you're looking for. Examples: 'payment terms', 'project timeline', 'team contact information'",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of document chunks to return (default: 5, max: 10)",
      },
    },
    required: ["query"],
  },
};

export async function executeSearchDocuments(
  params: {
    query: string;
    limit?: number;
  },
  context: ToolExecutionContext
): Promise<string> {
  try {
    const supabase = await createClient();

    if (!process.env.OPENAI_API_KEY) {
      return "Error: OpenAI API key not configured.";
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Validate query
    if (!params.query || params.query.trim().length === 0) {
      return "Error: Search query cannot be empty.";
    }

    const limit = Math.min(params.limit || 5, 10);

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: params.query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar document chunks using pgvector
    // Function: search_document_chunks with 8 parameters for context-aware search
    const { data: chunks, error } = await supabase.rpc(
      "search_document_chunks",
      {
        query_embedding: queryEmbedding,
        org_id: context.organizationId,
        requesting_user_id: context.userId,
        match_threshold: 0.3,
        match_count: limit,
        search_scope: 'all',
        conversation_id: null,
        space_id: null,
      }
    );

    if (error) {
      console.error("Error searching documents:", error);
      return `Error searching documents: ${error.message}`;
    }

    // Format results
    if (!chunks || chunks.length === 0) {
      return `No relevant information found in your documents for: "${params.query}". Try rephrasing your query or upload relevant documents first.`;
    }

    let formattedResults = `Found ${chunks.length} relevant document section(s) for "${params.query}":\n\n`;

    chunks.forEach((chunk: any, index: number) => {
      formattedResults += `${index + 1}. From "${chunk.document_title || "Untitled Document"}":\n`;
      formattedResults += `   ${chunk.content}\n`;
      formattedResults += `   (Relevance: ${Math.round(chunk.similarity * 100)}%)\n\n`;
    });

    return formattedResults;
  } catch (error: any) {
    console.error("Unexpected error in executeSearchDocuments:", error);
    return `Error searching documents: ${error.message || "Unknown error"}`;
  }
}
