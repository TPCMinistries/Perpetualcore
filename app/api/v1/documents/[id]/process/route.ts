import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, APIContext } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/documents/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for processing

/**
 * POST /api/v1/documents/[id]/process
 * Process a document that was uploaded via the v1 API.
 * Chunks the content, generates embeddings, and stores in document_chunks.
 * Unlike /api/documents/process, this uses API key auth (not session auth)
 * and works with documents that have content stored directly (not in storage).
 */
async function handlePost(
  req: NextRequest,
  context: APIContext,
  params: { id: string }
): Promise<Response> {
  const supabase = createAdminClient();
  const documentId = params.id;

  try {
    // Fetch the document
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("organization_id", context.organizationId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found", message: fetchError?.message },
        { status: 404 }
      );
    }

    // Get content — either from content column or from storage
    let content = document.content;

    if (!content && document.file_url) {
      // Fallback: download from storage if content column is empty
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_url);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: "No content available", message: "Document has no content and file download failed" },
          { status: 400 }
        );
      }

      content = await fileData.text();
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Document has no content to process" },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Chunk the content
    const chunks = await chunkText(content);
    console.log(`[v1/process] Document ${documentId}: ${chunks.length} chunks`);

    // Generate embeddings
    const chunkContents = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);
    console.log(`[v1/process] Generated ${embeddings.length} embeddings`);

    // Delete existing chunks (for reprocessing)
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    // Insert chunks with embeddings in batches
    const chunksToInsert = chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error(`[v1/process] Chunk insert error:`, insertError);
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }

    // Update document metadata and status
    await supabase
      .from("documents")
      .update({
        status: "completed",
        error_message: null,
        metadata: {
          wordCount: content.split(/\s+/).length,
          charCount: content.length,
          chunkCount: chunks.length,
          processedBy: "herald-v1-api",
          processedAt: new Date().toISOString(),
        },
      })
      .eq("id", documentId);

    console.log(`[v1/process] Document ${documentId} complete: ${chunks.length} chunks embedded`);

    return NextResponse.json({
      success: true,
      documentId,
      chunks: chunks.length,
      embeddings: embeddings.length,
      status: "completed",
    });
  } catch (error: any) {
    console.error(`[v1/process] Error processing ${documentId}:`, error);

    // Mark document as failed
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: error?.message || "Processing failed",
      })
      .eq("id", documentId);

    return NextResponse.json(
      { error: "Processing failed", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withApiAuth(
    req,
    (req, context) => handlePost(req, context, resolvedParams),
    { requiredScopes: ["documents:write"] }
  );
}
