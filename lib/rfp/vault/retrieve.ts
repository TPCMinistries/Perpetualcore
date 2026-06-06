/**
 * lib/rfp/vault/retrieve.ts — Vault Grounding v1 retrieval helper.
 *
 * Embeds the query, fetches the org's vault chunks via the admin client, and
 * computes cosine similarity in Node. Returns top-k chunks.
 *
 * Why in-Node similarity instead of pgvector's `<=>` operator?
 *  - The Supabase JS client cannot send the `<=>` operator inside a
 *    PostgREST `.select()` projection, and the project does NOT have a
 *    SECURITY DEFINER RPC for rfp_vault_artifacts. Adding one is a
 *    migration, which is forbidden by this task's scope.
 *  - In-Node cosine is correct and adequate for v1: per-doc chunk cap is 200,
 *    so a typical org with 5 docs holds ~500 chunks ≈ 2MB of vector payload
 *    per query. Slow at 50+ docs; Phase 2 should add the RPC.
 *
 * Background/server operation: uses createAdminClient() per CLAUDE.md.
 * The caller is responsible for RLS authorization BEFORE invoking this.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { embedChunks, EMBED_DIMENSIONS } from "./embed";
import type { VaultDocType } from "./upload";

export interface RetrieveOptions {
  /** Top-K to return. Default 8. Capped at 50. */
  k?: number;
  /**
   * Informational only in v1 — passed through for telemetry / future
   * section-type-aware filtering. We do NOT filter by it today because
   * vault docs don't carry section_type semantics yet.
   */
  sectionType?: string;
}

export interface RetrievedChunk {
  /** Row id of the chunk. */
  id: string;
  /** Cosine similarity in [-1, 1]; for OpenAI embeddings practically [0, 1]. */
  similarity_score: number;
  /** Chunk body. */
  text: string;
  /** Doc-level title (denormalized). */
  doc_title: string;
  /** Doc type tag. */
  doc_type: VaultDocType | string;
  /** 0-based chunk index within the doc. */
  chunk_index: number;
  /** Stable per-doc UUID. */
  doc_id: string;
  /** Original row created_at ISO timestamp. */
  created_at: string;
}

interface VaultRow {
  id: string;
  body: string | null;
  type: string;
  title: string;
  embedding: string | null;
  source_metadata: unknown;
  created_at: string;
}

interface ChunkMetadata {
  doc_id?: unknown;
  chunk_index?: unknown;
  doc_title?: unknown;
  doc_type?: unknown;
}

const DEFAULT_K = 8;
const MAX_K = 50;

/** Parse the pgvector string literal "[x,y,z,...]" into number[]. */
function parseVectorLiteral(s: string): number[] {
  // Fast path: trim brackets, split on comma. JSON.parse works for strict
  // numeric arrays without quotes, which is exactly what pgvector returns.
  const trimmed = s.trim();
  if (trimmed.length < 2 || trimmed[0] !== "[" || trimmed[trimmed.length - 1] !== "]") {
    throw new Error("retrieve_bad_vector: pgvector literal missing brackets");
  }
  // JSON.parse is faster and stricter than manual split.
  return JSON.parse(trimmed) as number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `retrieve_dim_mismatch: expected ${a.length} == ${b.length}`,
    );
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Retrieve top-K vault chunks for an org most similar to `query`.
 * Returns an empty array if the org has no vault rows yet.
 */
export async function retrieveVaultChunks(
  orgId: string,
  query: string,
  opts: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  if (!orgId) throw new Error("retrieve_bad_input: orgId required");
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    throw new Error("retrieve_bad_input: query required");
  }
  const k = Math.min(Math.max(opts.k ?? DEFAULT_K, 1), MAX_K);

  // 1) Embed the query (single-item batch).
  const { embeddings } = await embedChunks([query]);
  const qvec = embeddings[0];
  if (qvec.length !== EMBED_DIMENSIONS) {
    throw new Error(
      `retrieve_query_dim_mismatch: got ${qvec.length}, expected ${EMBED_DIMENSIONS}`,
    );
  }

  // 2) Fetch all this org's chunks (with embeddings). RLS is bypassed via
  // the admin client; the CALLER is responsible for authorization.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rfp_vault_artifacts")
    .select("id, body, type, title, embedding, source_metadata, created_at")
    .eq("org_id", orgId);
  if (error) {
    throw new Error(`retrieve_query_failed: ${error.message}`);
  }
  const rows = (data ?? []) as VaultRow[];
  if (rows.length === 0) return [];

  // 3) Score in-process.
  const scored: RetrievedChunk[] = [];
  for (const r of rows) {
    if (!r.embedding || !r.body) continue;
    let vec: number[];
    try {
      vec = parseVectorLiteral(r.embedding);
    } catch {
      // Skip malformed rows rather than blow up the whole query.
      continue;
    }
    if (vec.length !== qvec.length) continue;
    const sim = cosineSimilarity(qvec, vec);
    const meta = (r.source_metadata ?? {}) as ChunkMetadata;
    scored.push({
      id: r.id,
      similarity_score: sim,
      text: r.body,
      doc_title:
        typeof meta.doc_title === "string" ? meta.doc_title : r.title,
      doc_type:
        typeof meta.doc_type === "string" ? meta.doc_type : r.type,
      chunk_index:
        typeof meta.chunk_index === "number" ? meta.chunk_index : 0,
      doc_id: typeof meta.doc_id === "string" ? meta.doc_id : r.id,
      created_at: r.created_at,
    });
  }

  // 4) Top-K by similarity desc.
  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, k);
}
