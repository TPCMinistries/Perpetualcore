/**
 * lib/rfp/vault/retrieve.ts — Vault Grounding v1 retrieval helper.
 *
 * Embeds the query, calls the match_vault_docs() Postgres RPC (HNSW-backed,
 * SECURITY DEFINER, tenant-isolated), and returns top-k chunks.
 *
 * Primary path (Phase 14+): calls match_vault_docs() RPC via admin client.
 * Fallback path (local dev / RPC unavailable): fetches all org chunks and
 * computes cosine similarity in Node. The fallback is RETAINED — do not
 * remove it. It degrades gracefully when the RPC is not yet deployed.
 *
 * Why the RPC replaced in-Node cosine as the primary path?
 *  - At >50 docs/org the old path fetched MB-scale embedding payloads per
 *    query. The HNSW RPC executes the ANN search inside Postgres and returns
 *    only the top-k matching rows.
 *  - Phase 18 scoring depends on this RPC being the authoritative retrieval
 *    path. Phase 14 (FND-03) is the foundational gate.
 *
 * Note on database.types.ts: the match_vault_docs RPC is not yet reflected in
 * database.types.ts (Plan 14-04 regenerates types). The rpc() call is cast via
 * `as unknown as` to avoid the unknown-rpc compile error; 14-04 regen will
 * remove that cast.
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

/** Row shape returned by the match_vault_docs() Postgres RPC. */
interface MatchVaultDocsRow {
  id: string;
  body: string | null;
  title: string;
  type: string;
  source_metadata: Record<string, unknown> | null;
  similarity: number;
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

  const admin = createAdminClient();

  // ─── Primary path: match_vault_docs RPC (HNSW in Postgres) ──────────────
  // 14-04 will regenerate database.types.ts to include this RPC; until then
  // we cast through unknown to suppress the "unknown rpc" compile error.
  const { data: rpcData, error: rpcError } = await (
    (admin as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{
        data: MatchVaultDocsRow[] | null;
        error: { message: string } | null;
      }>;
    }).rpc("match_vault_docs", {
      org_id: orgId,
      query_embedding: qvec,
      match_count: k,
    })
  );

  if (!rpcError && rpcData !== null) {
    return rpcData.map((row) => {
      const meta = (row.source_metadata ?? {}) as ChunkMetadata;
      return {
        id: row.id,
        similarity_score: row.similarity,
        text: row.body ?? "",
        doc_title:
          typeof meta.doc_title === "string" ? meta.doc_title : row.title,
        doc_type:
          typeof meta.doc_type === "string" ? meta.doc_type : row.type,
        chunk_index:
          typeof meta.chunk_index === "number" ? meta.chunk_index : 0,
        doc_id: typeof meta.doc_id === "string" ? meta.doc_id : row.id,
        // RPC does not return created_at — return empty string; callers treat
        // this as informational only.
        created_at: "",
      };
    });
  }

  // Log the RPC error so it is visible in Vercel logs, then fall through.
  if (rpcError) {
    console.error(
      "[retrieve] match_vault_docs RPC error — falling back to in-Node cosine:",
      rpcError.message,
    );
  }

  // ─── Fallback path: in-Node cosine (local dev / RPC unavailable) ─────────
  // Retained from Phase 13. Not removed — provides safe degradation when the
  // RPC is not yet deployed or when running against a local Supabase stack
  // that hasn't had the migration applied.
  const { data, error } = await admin
    .from("rfp_vault_artifacts")
    .select("id, body, type, title, embedding, source_metadata, created_at")
    .eq("org_id", orgId);
  if (error) {
    throw new Error(`retrieve_query_failed: ${error.message}`);
  }
  const rows = (data ?? []) as VaultRow[];
  if (rows.length === 0) return [];

  // Score in-process.
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

  // Top-K by similarity desc.
  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, k);
}
