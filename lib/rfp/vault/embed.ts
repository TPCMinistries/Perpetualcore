/**
 * lib/rfp/vault/embed.ts — OpenAI embeddings for Vault Grounding v1.
 *
 * Single batched call to `text-embedding-3-large` with `dimensions: 1024`,
 * matching the existing `rfp_vault_artifacts.embedding vector(1024)` column.
 *
 * Pricing (USD per 1M input tokens): $0.13 for text-embedding-3-large.
 *
 * Honest guardrails:
 *  - Each input is truncated to MAX_INPUT_CHARS chars (~8K, well under the
 *    8192-token model context cap with room to spare for tokenizer variance).
 *  - We bail out if any input is empty after trim.
 *  - One network call regardless of batch size; OpenAI accepts up to 2048
 *    inputs in a single request, and our per-doc chunker caps at 200.
 */

import OpenAI from "openai";

export const EMBED_MODEL = "text-embedding-3-large";
export const EMBED_DIMENSIONS = 1024;

/** Hard per-input cap. ~8000 chars ≈ ~2000 tokens for English; leaves
 * headroom under the 8192-token model limit even with bumpy tokenization. */
export const MAX_INPUT_CHARS = 8000;

/** USD per million input tokens for text-embedding-3-large. */
const PRICE_PER_M_INPUT = 0.13;

export interface EmbedResult {
  embeddings: number[][];
  tokens: number;
  cost_usd: number;
  model: string;
}

function truncate(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_INPUT_CHARS) return t;
  return t.slice(0, MAX_INPUT_CHARS);
}

/**
 * Embed an array of texts with one batch call. Returns embeddings in the same
 * order as inputs. Throws on any empty input or on API error.
 */
export async function embedChunks(texts: string[]): Promise<EmbedResult> {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("embed_bad_input: texts must be a non-empty array");
  }
  const prepared = texts.map((t, i) => {
    if (typeof t !== "string") {
      throw new Error(`embed_bad_input: texts[${i}] is not a string`);
    }
    const out = truncate(t);
    if (out.length === 0) {
      throw new Error(`embed_bad_input: texts[${i}] is empty after trim`);
    }
    return out;
  });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    dimensions: EMBED_DIMENSIONS,
    input: prepared,
  });

  if (res.data.length !== prepared.length) {
    throw new Error(
      `embed_response_mismatch: expected ${prepared.length} embeddings, got ${res.data.length}`,
    );
  }

  // OpenAI returns data sorted by index, but we sort defensively.
  const sorted = [...res.data].sort((a, b) => a.index - b.index);
  const embeddings = sorted.map((d) => d.embedding);

  // Sanity: every embedding must have EMBED_DIMENSIONS elements.
  for (let i = 0; i < embeddings.length; i++) {
    if (embeddings[i].length !== EMBED_DIMENSIONS) {
      throw new Error(
        `embed_dim_mismatch: embedding[${i}] has ${embeddings[i].length} dims, expected ${EMBED_DIMENSIONS}`,
      );
    }
  }

  const tokens = res.usage?.prompt_tokens ?? 0;
  const cost_usd = (tokens / 1_000_000) * PRICE_PER_M_INPUT;

  return {
    embeddings,
    tokens,
    cost_usd,
    model: EMBED_MODEL,
  };
}
