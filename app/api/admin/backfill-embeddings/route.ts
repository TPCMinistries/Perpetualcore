import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chunkText } from "@/lib/documents/chunker";
import { generateEmbeddings } from "@/lib/documents/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch processing

// Service role client for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BackfillResult {
  document_id: string;
  title: string;
  status: "success" | "error" | "skipped";
  chunks_created?: number;
  error?: string;
}

/**
 * POST /api/admin/backfill-embeddings
 *
 * Backfill embeddings for documents that don't have them.
 * Designed for one-time migration of existing documents.
 *
 * Headers:
 *   x-admin-secret: ADMIN_SECRET or N8N_WEBHOOK_SECRET (required)
 *
 * Body (optional):
 *   document_ids?: string[] - Specific documents to process (default: all without embeddings)
 *   batch_size?: number - Documents per batch (default: 5)
 *   dry_run?: boolean - Preview without making changes (default: false)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin access
    const adminSecret = req.headers.get("x-admin-secret");
    const webhookSecret = req.headers.get("x-webhook-secret");

    const isAuthorized =
      adminSecret === process.env.ADMIN_SECRET ||
      webhookSecret === process.env.N8N_WEBHOOK_SECRET;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { document_ids, batch_size = 5, dry_run = false } = body;

    console.log("[Backfill] Starting embeddings backfill...");
    console.log("[Backfill] Options:", { document_ids, batch_size, dry_run });

    // Find documents that need embeddings
    let documentsQuery = supabase
      .from("documents")
      .select("id, title, content, status")
      .eq("status", "completed")
      .not("content", "is", null);

    if (document_ids && document_ids.length > 0) {
      documentsQuery = documentsQuery.in("id", document_ids);
    }

    const { data: allDocuments, error: fetchError } = await documentsQuery;

    if (fetchError) {
      console.error("[Backfill] Error fetching documents:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    if (!allDocuments || allDocuments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No documents to process",
        results: [],
        stats: { total: 0, success: 0, errors: 0, skipped: 0 },
      });
    }

    // Check which documents already have chunks
    const { data: existingChunks } = await supabase
      .from("document_chunks")
      .select("document_id");

    const documentsWithChunks = new Set(
      existingChunks?.map((c) => c.document_id) || []
    );

    // Filter to documents without embeddings
    const documentsToProcess = allDocuments.filter(
      (doc) => !documentsWithChunks.has(doc.id)
    );

    console.log(`[Backfill] Found ${documentsToProcess.length} documents without embeddings`);

    if (documentsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All documents already have embeddings",
        results: [],
        stats: {
          total: allDocuments.length,
          success: 0,
          errors: 0,
          skipped: allDocuments.length
        },
      });
    }

    if (dry_run) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        message: `Would process ${documentsToProcess.length} documents`,
        documents: documentsToProcess.map((d) => ({
          id: d.id,
          title: d.title,
          content_length: d.content?.length || 0,
        })),
      });
    }

    // Process documents in batches
    const results: BackfillResult[] = [];

    for (let i = 0; i < documentsToProcess.length; i += batch_size) {
      const batch = documentsToProcess.slice(i, i + batch_size);
      console.log(`[Backfill] Processing batch ${Math.floor(i / batch_size) + 1}...`);

      for (const doc of batch) {
        const result = await processDocumentEmbeddings(doc.id, doc.title, doc.content);
        results.push(result);
      }

      // Small delay between batches to avoid rate limits
      if (i + batch_size < documentsToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Calculate stats
    const stats = {
      total: allDocuments.length,
      processed: results.length,
      success: results.filter((r) => r.status === "success").length,
      errors: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      already_embedded: documentsWithChunks.size,
    };

    const executionTime = Date.now() - startTime;
    console.log(`[Backfill] Completed in ${executionTime}ms:`, stats);

    return NextResponse.json({
      success: true,
      message: `Processed ${stats.processed} documents`,
      stats,
      results,
      execution_time_ms: executionTime,
    });
  } catch (error) {
    console.error("[Backfill] Error:", error);
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
 * Process a single document: chunk content and generate embeddings
 */
async function processDocumentEmbeddings(
  documentId: string,
  title: string,
  content: string
): Promise<BackfillResult> {
  try {
    if (!content || content.length < 10) {
      return {
        document_id: documentId,
        title,
        status: "skipped",
        error: "Content too short or empty",
      };
    }

    console.log(`[Backfill] Processing: ${title} (${content.length} chars)`);

    // Chunk the content
    const textChunks = await chunkText(content, 1000, 100);

    if (textChunks.length === 0) {
      return {
        document_id: documentId,
        title,
        status: "skipped",
        error: "No chunks generated",
      };
    }

    // Generate embeddings
    const chunkContents = textChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);

    // Insert chunks with embeddings
    const chunksToInsert = textChunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    // Insert in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      }
    }

    console.log(`[Backfill] ✓ ${title}: ${chunksToInsert.length} chunks`);

    return {
      document_id: documentId,
      title,
      status: "success",
      chunks_created: chunksToInsert.length,
    };
  } catch (error) {
    console.error(`[Backfill] ✗ ${title}:`, error);
    return {
      document_id: documentId,
      title,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * GET /api/admin/backfill-embeddings
 *
 * Get status of documents and their embedding coverage
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const adminSecret = req.headers.get("x-admin-secret");
    const webhookSecret = req.headers.get("x-webhook-secret");

    const isAuthorized =
      adminSecret === process.env.ADMIN_SECRET ||
      webhookSecret === process.env.N8N_WEBHOOK_SECRET;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all completed documents
    const { data: documents, count: totalDocs } = await supabase
      .from("documents")
      .select("id, title, status, created_at", { count: "exact" })
      .eq("status", "completed");

    // Get documents with chunks
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("document_id");

    const documentsWithChunks = new Set(
      chunks?.map((c) => c.document_id) || []
    );

    // Categorize documents
    const withEmbeddings = documents?.filter((d) => documentsWithChunks.has(d.id)) || [];
    const withoutEmbeddings = documents?.filter((d) => !documentsWithChunks.has(d.id)) || [];

    return NextResponse.json({
      success: true,
      stats: {
        total_documents: totalDocs || 0,
        with_embeddings: withEmbeddings.length,
        without_embeddings: withoutEmbeddings.length,
        coverage_percent: totalDocs
          ? Math.round((withEmbeddings.length / totalDocs) * 100)
          : 0,
      },
      documents_needing_embeddings: withoutEmbeddings.map((d) => ({
        id: d.id,
        title: d.title,
        created_at: d.created_at,
      })),
    });
  } catch (error) {
    console.error("[Backfill Status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
