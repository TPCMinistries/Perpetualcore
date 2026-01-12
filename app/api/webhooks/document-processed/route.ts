import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { generateEmbeddings } from "@/lib/documents/embeddings";
import { chunkText } from "@/lib/documents/chunker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Service role client for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/webhooks/document-processed
 * Called by n8n after processing a document with AI
 * Creates document with embeddings for RAG search
 *
 * Expected payload:
 * {
 *   user_id: string (required)
 *   title: string
 *   content: string (the full text content)
 *   summary?: string
 *   document_type?: string (document, meeting_transcript, notes, etc.)
 *   source?: string (n8n, manual, import, etc.)
 *   key_points?: string[]
 *   entities?: Array<{name, type, context}>
 *   topics?: string[]
 *   tags?: string[]
 *   metadata?: object
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify webhook secret or API key
    const apiKey = req.headers.get("x-api-key");
    const webhookSecret = req.headers.get("x-webhook-secret");

    if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET && apiKey !== process.env.WEBHOOK_API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Validate required fields
    if (!payload.user_id) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }
    if (!payload.content || payload.content.length < 10) {
      return Response.json({ error: "content is required and must be at least 10 characters" }, { status: 400 });
    }

    // Get user's organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", payload.user_id)
      .single();

    const organizationId = profile?.organization_id || payload.user_id;

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        user_id: payload.user_id,
        title: payload.title || "Untitled Document",
        content: payload.content,
        document_type: payload.document_type || "document",
        source: payload.source || "n8n",
        status: "processing",
        metadata: {
          summary: payload.summary,
          key_points: payload.key_points,
          entities: payload.entities,
          topics: payload.topics,
          tags: payload.tags,
          ...payload.metadata,
          processed_by: "n8n-webhook",
          processed_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (docError) {
      console.error("Failed to create document:", docError);
      return Response.json({
        error: "Failed to create document",
        details: docError.message
      }, { status: 500 });
    }

    // Chunk the content for RAG
    const textChunks = await chunkText(payload.content, 1000, 100);
    console.log(`[webhook] Created ${textChunks.length} chunks for document ${document.id}`);

    // Generate embeddings for chunks
    const chunkContents = textChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);
    console.log(`[webhook] Generated ${embeddings.length} embeddings`);

    // Insert chunks with embeddings
    const chunksToInsert = textChunks.map((chunk, i) => ({
      document_id: document.id,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    // Insert in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error(`[webhook] Error inserting chunk batch:`, insertError);
        throw new Error(`Failed to insert document chunks: ${insertError.message}`);
      }
    }

    // Update document status
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "completed",
        metadata: {
          ...document.metadata,
          wordCount: payload.content.split(/\s+/).length,
          charCount: payload.content.length,
          chunkCount: textChunks.length,
          embeddingsGenerated: true,
        },
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("Failed to update document status:", updateError);
    }

    // Log the automation
    const executionTime = Date.now() - startTime;
    await supabase.from("automation_logs").insert({
      user_id: payload.user_id,
      workflow_name: "document-processor",
      workflow_type: "document_processor",
      status: "success",
      input_summary: `Document: ${payload.title}`,
      output_summary: `Created document with ${textChunks.length} chunks and embeddings`,
      execution_time_ms: executionTime,
      source_type: "document",
      source_id: document.id,
      metadata: {
        document_id: document.id,
        chunks_created: textChunks.length,
        document_type: payload.document_type,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Also add to user memory if it's significant content
    if (payload.content.length > 500) {
      await supabase.from("user_ai_memory").insert({
        user_id: payload.user_id,
        memory_type: "context",
        content: payload.summary || `Document: ${payload.title}`,
        key: `document_${document.id}`,
        value: {
          document_id: document.id,
          title: payload.title,
          topics: payload.topics,
          key_points: payload.key_points,
        },
        source: "document_import",
        confidence: 0.9,
      });
    }

    return Response.json({
      success: true,
      document_id: document.id,
      chunks_created: textChunks.length,
      embeddings_generated: embeddings.length,
      execution_time_ms: executionTime,
    });

  } catch (error: any) {
    console.error("document-processed webhook error:", error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/document-processed
 * Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    endpoint: "document-processed",
    description: "POST document data after n8n AI processing to create embeddings for RAG",
    required_fields: ["user_id", "content"],
    optional_fields: ["title", "summary", "document_type", "source", "key_points", "entities", "topics", "tags", "metadata"],
  });
}
