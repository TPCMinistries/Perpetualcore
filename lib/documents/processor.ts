import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { chunkText, TextChunk } from "./chunker";
import { generateEmbeddings } from "./embeddings";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
 * Extract text from various file types
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      console.log(`📄 Extracting text from PDF using Claude API: ${fileName}`);

      // Convert buffer to base64 for Claude API
      const base64Pdf = buffer.toString("base64");

      // Use Claude API to extract text from PDF
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
                  media_type: "application/pdf",
                  data: base64Pdf,
                },
              },
              {
                type: "text",
                text: "Please extract ALL the text from this PDF document. Return ONLY the extracted text with no additional commentary, formatting, or explanation. Preserve the original structure and line breaks where meaningful.",
              },
            ],
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";

      console.log(`✅ PDF extraction complete: ${text.length} characters`);

      if (!text || text.trim().length === 0) {
        throw new Error("PDF appears to contain no extractable text. It may be image-based or encrypted.");
      }

      return text.trim();
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      console.log(`📄 Extracting text from DOCX: ${fileName}`);

      try {
        // Try mammoth first (faster and cheaper)
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ buffer });

        if (result.value && result.value.trim().length > 0) {
          console.log(`✅ DOCX extraction complete via mammoth: ${result.value.length} characters`);
          return result.value;
        }

        // If mammoth returns empty, fall through to Claude
        console.log(`⚠️ Mammoth returned empty text, trying Claude API...`);
      } catch (mammothError) {
        console.log(`⚠️ Mammoth failed, falling back to Claude API:`, mammothError);
      }

      // Fallback to Claude API for problematic DOCX files
      console.log(`📄 Using Claude API to extract text from DOCX: ${fileName}`);
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
      console.log(`✅ DOCX extraction complete via Claude: ${text.length} characters`);

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
    console.error("Error extracting text:", error);
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
  const supabase = createClient();

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

    // Generate embeddings for all chunks
    const chunkContents = processed.chunks.map((c) => c.content);
    console.log(`📊 Generating embeddings for ${chunkContents.length} chunks...`);
    const embeddings = await generateEmbeddings(chunkContents);
    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Store chunks with embeddings
    const chunksToInsert = processed.chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[index],
    }));

    console.log(`💾 Inserting ${chunksToInsert.length} chunks into database...`);
    // Use admin client to bypass RLS for background processing
    const adminClient = createAdminClient();
    const { data: insertedChunks, error: chunksError } = await adminClient
      .from("document_chunks")
      .insert(chunksToInsert)
      .select();

    if (chunksError) {
      console.error(`❌ Failed to insert chunks:`, chunksError);
      console.error(`❌ Error code:`, chunksError.code);
      console.error(`❌ Error details:`, chunksError.details);
      console.error(`❌ Error hint:`, chunksError.hint);
      throw new Error(`Failed to store chunks: ${chunksError.message}`);
    }

    console.log(`✅ Successfully inserted ${insertedChunks?.length || 0} chunks`);

    // Update document status to completed
    await supabase
      .from("documents")
      .update({
        status: "completed",
        error_message: null,
      })
      .eq("id", documentId);

    console.log(`Successfully processed document ${documentId}`);
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
