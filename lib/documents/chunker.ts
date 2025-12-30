export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

/**
 * Estimate token count using character-based approximation
 * Average of ~4 characters per token for English text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into chunks with token limits and overlap
 * Uses character-based approximation to avoid tiktoken WASM issues in serverless
 * @param text - The text to chunk
 * @param maxTokens - Maximum tokens per chunk (default: 1000)
 * @param overlapTokens - Number of tokens to overlap between chunks (default: 100)
 * @returns Array of text chunks
 */
export async function chunkText(
  text: string,
  maxTokens: number = 1000,
  overlapTokens: number = 100
): Promise<TextChunk[]> {
  // Clean and normalize text
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Approximate max characters per chunk (4 chars per token)
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  // Split into paragraphs first, then sentences
  const paragraphs = cleanedText.split(/\n\n+/);

  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // Split paragraph into sentences
    const sentences = paragraph.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      // If adding this sentence exceeds limit, save current chunk
      if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          tokenCount: estimateTokens(currentChunk),
        });

        // Start new chunk with overlap
        if (overlapChars > 0 && currentChunk.length > overlapChars) {
          currentChunk = currentChunk.slice(-overlapChars) + " " + sentence;
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }

    // Add paragraph break
    if (currentChunk && !currentChunk.endsWith("\n\n")) {
      currentChunk += "\n\n";
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      tokenCount: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

/**
 * Estimate token count for text (character-based approximation)
 */
export function estimateTokenCount(text: string): number {
  return estimateTokens(text);
}
