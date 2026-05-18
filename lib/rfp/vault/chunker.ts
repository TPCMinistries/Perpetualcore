/**
 * lib/rfp/vault/chunker.ts — pure paragraph-aware chunker for Vault Grounding v1.
 *
 * Strategy: paragraphs are the unit of meaning. Greedy-pack paragraphs into
 * ~800-char windows that respect sentence boundaries, with a ~100-char
 * sliding overlap between adjacent chunks so a sentence that spans a
 * boundary is still retrievable from either side.
 *
 * Honest scope:
 *  - Plain text only (Phase 2 adds PDF/Docx parsing).
 *  - We cap at MAX_CHUNKS_PER_DOC and refuse oversize input rather than
 *    silently truncating, so callers get a clear error.
 *  - "Sentence boundary" means the last `. ! ?` followed by whitespace within
 *    the candidate window. If no boundary exists, we hard-break at the cap
 *    rather than overflow.
 *
 * Returns: an array of { index, text, char_start, char_end } where
 * char_start/char_end refer to offsets in the ORIGINAL input string.
 */

export interface Chunk {
  index: number;
  text: string;
  char_start: number;
  char_end: number;
}

export interface ChunkOptions {
  /** Target chunk size in characters. Default 800. */
  targetChars?: number;
  /** Approximate overlap between adjacent chunks. Default 100. */
  overlapChars?: number;
  /** Hard ceiling on chunks emitted per document. Default 200. */
  maxChunks?: number;
}

export const DEFAULT_TARGET_CHARS = 800;
export const DEFAULT_OVERLAP_CHARS = 100;
export const MAX_CHUNKS_PER_DOC = 200;

/** Minimum body length we'll bother chunking. Below this we throw. */
export const MIN_BODY_CHARS = 50;

/** Find the last sentence boundary (".", "!", "?") at or before `end` within
 * `text`. Returns -1 if none exists. The boundary index returned is the
 * position AFTER the punctuation+whitespace, suitable for use as a slice end. */
function lastSentenceBoundary(text: string, start: number, end: number): number {
  // Walk back from end looking for `[.!?]\s` (or `[.!?]` at end of string).
  for (let i = Math.min(end, text.length) - 1; i > start; i--) {
    const ch = text[i];
    if (ch === "." || ch === "!" || ch === "?") {
      // Boundary fires either at end-of-text or before whitespace.
      const next = text[i + 1];
      if (next === undefined || /\s/.test(next)) {
        // Slice end is i+1 (include the punctuation, exclude the whitespace).
        return i + 1;
      }
    }
  }
  return -1;
}

/**
 * Split a document into overlapping ~targetChars chunks that respect paragraph
 * and sentence boundaries.
 *
 * Throws if `text` is shorter than MIN_BODY_CHARS or if the chunking would
 * exceed maxChunks.
 */
export function chunk(text: string, opts: ChunkOptions = {}): Chunk[] {
  const targetChars = opts.targetChars ?? DEFAULT_TARGET_CHARS;
  const overlapChars = opts.overlapChars ?? DEFAULT_OVERLAP_CHARS;
  const maxChunks = opts.maxChunks ?? MAX_CHUNKS_PER_DOC;

  if (typeof text !== "string") {
    throw new Error("chunker_bad_input: text must be a string");
  }
  const trimmed = text.trim();
  if (trimmed.length < MIN_BODY_CHARS) {
    throw new Error(
      `chunker_bad_input: text must be at least ${MIN_BODY_CHARS} chars (got ${trimmed.length})`,
    );
  }
  if (targetChars < 100) {
    throw new Error("chunker_bad_input: targetChars must be >= 100");
  }
  if (overlapChars < 0 || overlapChars >= targetChars) {
    throw new Error("chunker_bad_input: overlapChars must be in [0, targetChars)");
  }

  const out: Chunk[] = [];
  // We operate on the trimmed string to keep char offsets meaningful relative
  // to the persisted body. The original input's leading/trailing whitespace
  // would just be noise in the index.
  const src = trimmed;

  let cursor = 0;
  while (cursor < src.length) {
    if (out.length >= maxChunks) {
      throw new Error(
        `chunker_too_many_chunks: document would produce more than ${maxChunks} chunks; ` +
          `current input length ${src.length} chars. Split before upload.`,
      );
    }

    const remaining = src.length - cursor;
    if (remaining <= targetChars) {
      // Final chunk — take everything left.
      out.push({
        index: out.length,
        text: src.slice(cursor).trim(),
        char_start: cursor,
        char_end: src.length,
      });
      break;
    }

    // Candidate window: cursor .. cursor+targetChars.
    const windowEnd = cursor + targetChars;

    // Prefer the last paragraph break (\n\n) inside the window.
    const paraBreak = src.lastIndexOf("\n\n", windowEnd);
    let boundary: number;
    if (paraBreak > cursor + targetChars / 2) {
      // Use the paragraph break — landing point is right AFTER the \n\n.
      boundary = paraBreak;
    } else {
      // Fall back to the last sentence boundary in the window.
      const sb = lastSentenceBoundary(src, cursor, windowEnd);
      boundary = sb > cursor + targetChars / 2 ? sb : windowEnd;
    }

    out.push({
      index: out.length,
      text: src.slice(cursor, boundary).trim(),
      char_start: cursor,
      char_end: boundary,
    });

    // Advance cursor by (boundary - overlap), but never go backwards.
    const next = boundary - overlapChars;
    cursor = next > cursor ? next : boundary;
  }

  // Strip any empty trimmed chunks that could result from pathological inputs.
  return out.filter((c) => c.text.length > 0).map((c, i) => ({ ...c, index: i }));
}
