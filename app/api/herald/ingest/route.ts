import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/documents/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/herald/ingest
 *
 * Herald-specific endpoint for ingesting documents into the RAG.
 * Auth: HERALD_API_SECRET bearer token (simple shared secret).
 *
 * This bypasses the full API key infrastructure (api_keys table not yet migrated)
 * and directly processes content into document_chunks with embeddings.
 *
 * Payload:
 * {
 *   "title": "Meeting title",
 *   "content": "Full transcript text",
 *   "file_type": "transcript" | "document" | "conversation" | "meeting",
 *   "source": "herald-plaud" | "herald-skill" | "herald-sync",
 *   "metadata": { ... optional extra metadata }
 * }
 *
 * Returns:
 * {
 *   "success": true,
 *   "document_id": "uuid",
 *   "chunks": N,
 *   "embeddings": N,
 *   "status": "completed"
 * }
 */
export async function POST(req: NextRequest) {
  // Auth: simple shared secret
  const secret = process.env.HERALD_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "HERALD_API_SECRET not configured on server" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  // Also accept query param for Zapier compatibility
  const { searchParams } = new URL(req.url);
  const queryToken = searchParams.get("token") || "";

  if (token !== secret && queryToken !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const body = await req.json();
    const { title, content, file_type, source, metadata } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    // Step 1: Create document record
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        title,
        content,
        file_type: file_type || "transcript",
        file_size: content.length,
        status: "processing",
        source: source || "herald",
        doc_type: file_type || "transcript",
        metadata: {
          ...metadata,
          ingested_by: "herald",
          ingested_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Herald/ingest] Document insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create document", message: insertError.message },
        { status: 500 }
      );
    }

    const documentId = document.id;

    // Step 2: Chunk the content
    const chunks = await chunkText(content);
    console.log(
      `[Herald/ingest] Document ${documentId}: ${chunks.length} chunks`
    );

    // Step 3: Generate embeddings
    const chunkContents = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);
    console.log(
      `[Herald/ingest] Generated ${embeddings.length} embeddings`
    );

    // Step 4: Insert chunks with embeddings
    const chunksToInsert = chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (chunkError) {
        console.error("[Herald/ingest] Chunk insert error:", chunkError);
        throw new Error(`Failed to insert chunks: ${chunkError.message}`);
      }
    }

    // Step 5: Mark document as completed
    await supabase
      .from("documents")
      .update({
        status: "completed",
        error_message: null,
        metadata: {
          ...metadata,
          ingested_by: "herald",
          ingested_at: new Date().toISOString(),
          wordCount: content.split(/\s+/).length,
          charCount: content.length,
          chunkCount: chunks.length,
        },
      })
      .eq("id", documentId);

    console.log(
      `[Herald/ingest] Complete: ${documentId} — ${chunks.length} chunks embedded`
    );

    return NextResponse.json(
      {
        success: true,
        document_id: documentId,
        chunks: chunks.length,
        embeddings: embeddings.length,
        status: "completed",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Herald/ingest] Error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", message: error?.message },
      { status: 500 }
    );
  }
}
