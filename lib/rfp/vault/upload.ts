/**
 * lib/rfp/vault/upload.ts — Vault Grounding v1 upload orchestrator.
 *
 * One "document" → many chunks. We mint a `doc_id` UUID, chunk the body,
 * embed the chunks in a single OpenAI call, then insert all chunk rows in
 * one batch insert against `rfp_vault_artifacts`. Each row shares the same
 * `source_metadata.doc_id` so the doc can later be listed (grouped) and
 * deleted (cascade-by-doc-id).
 *
 * Background/server operation: uses createAdminClient() per CLAUDE.md.
 * The caller is responsible for RLS authorization BEFORE invoking this.
 */

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import { chunk, MAX_CHUNKS_PER_DOC } from "./chunker";
import { embedChunks } from "./embed";

export const VAULT_DOC_TYPES = [
  "past_proposal",
  "annual_report",
  "founder_letter",
  "case_study",
  "policy",
  "other",
] as const;
export type VaultDocType = (typeof VAULT_DOC_TYPES)[number];

export interface UploadDocumentInput {
  orgId: string;
  docTitle: string;
  docType: VaultDocType;
  body: string;
}

export interface UploadResult {
  doc_id: string;
  chunk_count: number;
  total_chars: number;
  tokens: number;
  cost_usd: number;
  model: string;
}

/** Minimum doc body length. Below this, chunking is pointless. */
export const MIN_DOC_BODY_CHARS = 200;
/** Hard ceiling on raw body length. Beyond this we refuse before chunking
 * to avoid surprising the operator with a 200-chunk error mid-flow. */
export const MAX_DOC_BODY_CHARS = 200_000;

type VaultArtifactInsert =
  Database["public"]["Tables"]["rfp_vault_artifacts"]["Insert"];

/**
 * The Json type uses an index signature; our concrete metadata interface
 * doesn't. Round-trip through JSON to satisfy the type checker without
 * weakening static safety elsewhere. Mirrors the pattern in voice/train.
 */
function toJsonb(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

/**
 * pgvector accepts a string literal of the form `[0.1, 0.2, ...]` for vector
 * columns over PostgREST. The generated `embedding` type is `string | null`
 * to reflect this serialization.
 */
function vectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

export async function uploadDocument(input: UploadDocumentInput): Promise<UploadResult> {
  if (!input.orgId || typeof input.orgId !== "string") {
    throw new Error("upload_bad_input: orgId required");
  }
  if (!input.docTitle || typeof input.docTitle !== "string") {
    throw new Error("upload_bad_input: docTitle required");
  }
  if (input.docTitle.length > 200) {
    throw new Error("upload_bad_input: docTitle too long (max 200 chars)");
  }
  if (!VAULT_DOC_TYPES.includes(input.docType)) {
    throw new Error(`upload_bad_input: invalid docType ${input.docType}`);
  }
  if (typeof input.body !== "string") {
    throw new Error("upload_bad_input: body must be a string");
  }
  const bodyLen = input.body.trim().length;
  if (bodyLen < MIN_DOC_BODY_CHARS) {
    throw new Error(
      `upload_bad_input: body must be at least ${MIN_DOC_BODY_CHARS} chars (got ${bodyLen})`,
    );
  }
  if (bodyLen > MAX_DOC_BODY_CHARS) {
    throw new Error(
      `upload_bad_input: body exceeds ${MAX_DOC_BODY_CHARS} chars (got ${bodyLen}). Split before upload.`,
    );
  }

  // 1) Chunk.
  const chunks = chunk(input.body); // throws if > MAX_CHUNKS_PER_DOC
  if (chunks.length === 0) {
    throw new Error("upload_failed: chunker produced 0 chunks");
  }

  // 2) Embed.
  const embedded = await embedChunks(chunks.map((c) => c.text));

  // 3) Persist as one batch.
  const doc_id = randomUUID();
  const created_at_iso = new Date().toISOString();
  const rows: VaultArtifactInsert[] = chunks.map((c, i) => ({
    org_id: input.orgId,
    type: input.docType,
    title: input.docTitle,
    body: c.text,
    embedding: vectorLiteral(embedded.embeddings[i]),
    source_metadata: toJsonb({
      doc_id,
      chunk_index: c.index,
      total_chunks: chunks.length,
      doc_title: input.docTitle,
      doc_type: input.docType,
      char_start: c.char_start,
      char_end: c.char_end,
      embed_model: embedded.model,
      uploaded_at: created_at_iso,
    }),
  }));

  const admin = createAdminClient();
  const { error: insertErr } = await admin.from("rfp_vault_artifacts").insert(rows);
  if (insertErr) {
    throw new Error(`upload_insert_failed: ${insertErr.message}`);
  }

  return {
    doc_id,
    chunk_count: chunks.length,
    total_chars: chunks.reduce((acc, c) => acc + c.text.length, 0),
    tokens: embedded.tokens,
    cost_usd: embedded.cost_usd,
    model: embedded.model,
  };
}

// Re-export for callers that want the cap constant.
export { MAX_CHUNKS_PER_DOC };
