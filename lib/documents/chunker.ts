import { get_encoding } from "tiktoken";

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

/**
 * Split text into chunks with token limits and overlap
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
  // Initialize tiktoken encoder for OpenAI models
  const encoding = get_encoding("cl100k_base");

  try {
    // Clean and normalize text
    const cleanedText = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double
      .trim();

    // Split into sentences (rough approach)
    const sentences = cleanedText.split(/(?<=[.!?])\s+/);

    const chunks: TextChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokenCount = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const sentenceTokens = encoding.encode(sentence);
      const sentenceTokenCount = sentenceTokens.length;

      // If single sentence exceeds max tokens, split it further
      if (sentenceTokenCount > maxTokens) {
        // Save current chunk if it has content
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.join(" ").trim(),
            index: chunkIndex++,
            tokenCount: currentTokenCount,
          });
          currentChunk = [];
          currentTokenCount = 0;
        }

        // Split large sentence by words
        const words = sentence.split(/\s+/);
        let wordChunk: string[] = [];
        let wordTokenCount = 0;

        for (const word of words) {
          const wordTokens = encoding.encode(word + " ");
          const wordTokenLen = wordTokens.length;

          if (wordTokenCount + wordTokenLen > maxTokens) {
            chunks.push({
              content: wordChunk.join(" ").trim(),
              index: chunkIndex++,
              tokenCount: wordTokenCount,
            });
            wordChunk = [word];
            wordTokenCount = wordTokenLen;
          } else {
            wordChunk.push(word);
            wordTokenCount += wordTokenLen;
          }
        }

        if (wordChunk.length > 0) {
          chunks.push({
            content: wordChunk.join(" ").trim(),
            index: chunkIndex++,
            tokenCount: wordTokenCount,
          });
        }

        continue;
      }

      // If adding this sentence would exceed max tokens, save current chunk
      if (currentTokenCount + sentenceTokenCount > maxTokens && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.join(" ").trim(),
          index: chunkIndex++,
          tokenCount: currentTokenCount,
        });

        // Start new chunk with overlap from previous chunk
        if (overlapTokens > 0 && chunks.length > 0) {
          const previousChunk = chunks[chunks.length - 1].content;
          const previousTokens = encoding.encode(previousChunk);

          // Take last N tokens from previous chunk for overlap
          const overlapStart = Math.max(0, previousTokens.length - overlapTokens);
          const overlapTokenArray = previousTokens.slice(overlapStart);
          const overlapText = new TextDecoder().decode(
            encoding.decode(overlapTokenArray)
          );

          // Start new chunk with overlap
          currentChunk = [overlapText];
          currentTokenCount = overlapTokenArray.length;
        } else {
          currentChunk = [];
          currentTokenCount = 0;
        }
      }

      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentTokenCount += sentenceTokenCount;
    }

    // Add final chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join(" ").trim(),
        index: chunkIndex,
        tokenCount: currentTokenCount,
      });
    }

    return chunks;
  } finally {
    // Free the encoding
    encoding.free();
  }
}

/**
 * Estimate token count for text
 */
export function estimateTokenCount(text: string): number {
  const encoding = get_encoding("cl100k_base");
  try {
    const tokens = encoding.encode(text);
    return tokens.length;
  } finally {
    encoding.free();
  }
}
