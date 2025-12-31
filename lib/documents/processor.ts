import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { chunkText } from "./chunker";
import { createAdminClient } from "@/lib/supabase/server";
import { generateEmbeddings } from "./embeddings";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface ProcessedDocument {
  content: string;
  chunks: DocumentChunk[];
  metadata: {
    pageCount?: number;
    wordCount: number;
    charCount: number;
  };
}

/**
 * Extract text from PDF using pdf.js-extract (fallback method)
 */
async function extractPdfWithPdfJs(buffer: Buffer, fileName: string): Promise<string | null> {
  try {
    const { PDFExtract } = await import("pdf.js-extract");
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(buffer, {});

    const textParts: string[] = [];
    for (const page of data.pages) {
      const pageText = page.content
        .map((item: any) => item.str)
        .join(" ");
      textParts.push(pageText);
    }

    const text = textParts.join("\n\n");
    if (text.trim().length > 50) {
      return text.trim();
    }
    return null;
  } catch (error: any) {
    console.error(`pdf.js-extract failed for ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Extract text from PDF using pdf-parse library (fallback)
 */
async function extractPdfWithPdfParse(buffer: Buffer, fileName: string): Promise<string | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer, { max: 0 });
    const text = data.text || "";

    if (text.trim().length > 50) {
      return text.trim();
    }
    return null;
  } catch (error: any) {
    console.error(`pdf-parse failed for ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Extract text from various file types
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      // Use Claude's native PDF understanding - most reliable for serverless
      const base64Pdf = buffer.toString("base64");

      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64Pdf,
                  },
                },
                {
                  type: "text",
                  text: "Extract ALL text content from this PDF document. Return ONLY the extracted text, preserving the original structure and formatting as much as possible. Do not add any commentary or explanations.",
                },
              ],
            },
          ],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (claudeError: any) {
        console.error(`Claude PDF extraction failed for ${fileName}:`, claudeError.message);
      }

      // Fallback to local PDF extraction
      const pdfJsText = await extractPdfWithPdfJs(buffer, fileName);
      if (pdfJsText) {
        return pdfJsText;
      }

      const pdfParseText = await extractPdfWithPdfParse(buffer, fileName);
      if (pdfParseText) {
        return pdfParseText;
      }

      throw new Error(`Could not extract text from PDF "${fileName}". The PDF may be image-based, encrypted, or corrupted.`);
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        // Try mammoth first (faster and cheaper)
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.extractRawText({ buffer });

        if (result.value && result.value.trim().length > 0) {
          return result.value;
        }
      } catch (mammothError: any) {
        console.error(`Mammoth failed for ${fileName}:`, mammothError.message);
      }

      // Fallback to Claude API for problematic DOCX files
      const base64Doc = buffer.toString("base64");

      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  data: base64Doc,
                },
              },
              {
                type: "text",
                text: "Please extract ALL the text from this Word document. Return ONLY the extracted text with no additional commentary, formatting, or explanation. Preserve the original structure and line breaks where meaningful.",
              },
            ],
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      if (!text || text.trim().length === 0) {
        throw new Error("Document appears to contain no extractable text.");
      }

      return text.trim();
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType === "text/csv"
    ) {
      return buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from ${fileName}`);
  }
}

/**
 * Clean and normalize extracted text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/ +/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .trim();
}

/**
 * Process a document: extract text, chunk it (without embeddings for now)
 */
export async function processDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ProcessedDocument> {
  // Extract text
  const rawText = await extractText(buffer, mimeType, fileName);

  // Clean text
  const content = cleanText(rawText);

  if (!content || content.length < 10) {
    throw new Error("Document appears to be empty or contains insufficient text");
  }

  // Create chunks using tiktoken-based chunker
  const textChunks = await chunkText(content, 1000, 100);

  // Convert to DocumentChunk format (without embeddings yet)
  const chunks: DocumentChunk[] = textChunks.map((chunk) => ({
    content: chunk.content,
    chunkIndex: chunk.index,
  }));

  // Calculate metadata
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;

  return {
    content,
    chunks,
    metadata: {
      wordCount,
      charCount,
    },
  };
}

/**
 * Process and store document with embeddings in database
 * This function is called asynchronously after document upload
 */
export async function processAndStoreDocument(
  documentId: string
): Promise<void> {
  // Use admin client since this runs as background task without user session
  const supabase = createAdminClient();

  try {
    // Get document from database
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      throw new Error("Document not found");
    }

    // Update status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.file_url!);

    if (downloadError || !fileData) {
      throw new Error("Failed to download file from storage");
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process document
    const processed = await processDocument(
      buffer,
      document.file_type!,
      document.title
    );

    // Update document with content
    await supabase
      .from("documents")
      .update({
        content: processed.content,
        metadata: {
          wordCount: processed.metadata.wordCount,
          charCount: processed.metadata.charCount,
          chunkCount: processed.chunks.length,
        },
      })
      .eq("id", documentId);

    // Generate embeddings for chunks
    console.log(`[Processor] Generating embeddings for ${processed.chunks.length} chunks...`);
    const chunkContents = processed.chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkContents);
    console.log(`[Processor] Generated ${embeddings.length} embeddings`);

    // Delete any existing chunks for this document (in case of reprocessing)
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    // Insert chunks with embeddings into document_chunks table
    const chunksToInsert = processed.chunks.map((chunk, i) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    // Insert in batches of 50 to avoid payload size limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error(`[Processor] Error inserting chunk batch:`, insertError);
        throw new Error(`Failed to insert document chunks: ${insertError.message}`);
      }
    }
    console.log(`[Processor] Inserted ${chunksToInsert.length} chunks with embeddings`);

    // Update document status to completed
    await supabase
      .from("documents")
      .update({
        status: "completed",
        error_message: null,
      })
      .eq("id", documentId);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    // Update document status to failed
    await supabase
      .from("documents")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown processing error",
      })
      .eq("id", documentId);

    throw error;
  }
}

/**
 * Perform semantic search on document chunks
 */
export async function semanticSearch(
  query: string,
  documentEmbeddings: { content: string; embedding: number[] }[],
  topK: number = 5
): Promise<{ content: string; similarity: number }[]> {
  // Generate embedding for the query
  const queryEmbeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    dimensions: 1536,
  });

  const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

  // Calculate cosine similarity for each chunk
  const similarities = documentEmbeddings.map((doc) => ({
    content: doc.content,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by similarity and return top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
