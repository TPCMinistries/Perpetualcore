/**
 * Phase 18-01 — Fit evidence persistence layer.
 *
 * Stores vault artifact citations produced by the vault-grounded scorer into
 * the rfp_fit_evidence table. Keeps rfp_opp_matches.score_breakdown compact for
 * fast feed queries while providing a queryable source of evidence per dimension
 * for the detail pane UI.
 *
 * This module is PURE PERSISTENCE — no LLM calls, no embedding, no vault
 * retrieval. Evidence rows are written here after the caller has already
 * retrieved and scored vault chunks.
 *
 * Phase 18-03: database.types.ts has been regenerated (Plan 03 is the single
 * owner of the Phase 18 types regen). The temporary `as unknown as` casts used
 * in Plan 18-01 have been removed now that rfp_fit_evidence is properly typed.
 */

import { createAdminClient } from '@/lib/supabase/server';

// ── Public types ──────────────────────────────────────────────────────────────

export type FitEvidenceDimension =
  | 'mission_fit'
  | 'eligibility'
  | 'track_record'
  | 'capacity'
  | 'funder_relationship';

export interface FitEvidenceRow {
  opp_id: string;
  org_id: string;
  scored_version: number;
  dimension: FitEvidenceDimension;
  artifact_id: string;       // rfp_vault_artifacts.id (NOT FK — artifact may be deleted)
  artifact_doc_id: string;   // source_metadata.doc_id from vault artifact
  artifact_title: string;
  artifact_type: string;
  excerpt: string;           // truncated to 200 chars at write time by upsertFitEvidence
  similarity: number;
}

export interface UpsertFitEvidenceResult {
  upserted: number;
  error: string | null;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Max excerpt length stored in rfp_fit_evidence. */
const MAX_EXCERPT_CHARS = 200;

/**
 * Truncate excerpt to MAX_EXCERPT_CHARS.
 * Caller may pass arbitrary-length chunk text; DB column stores ≤200 chars.
 */
function truncateExcerpt(text: string): string {
  return text.length > MAX_EXCERPT_CHARS ? text.slice(0, MAX_EXCERPT_CHARS) : text;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upsert a batch of fit evidence rows and prune superseded (lower-version) rows.
 *
 * Behaviour:
 *  - Empty `rows` → returns { upserted: 0, error: null } immediately.
 *    Handles the empty-vault case (new org has no uploaded documents).
 *    See 18-RESEARCH.md Pitfall 1.
 *  - Each `excerpt` is truncated to 200 chars before insert.
 *  - Upsert conflict key: (opp_id, org_id, scored_version, artifact_id, dimension).
 *  - After upsert, deletes rfp_fit_evidence rows for each (opp_id, org_id) pair
 *    where scored_version < the version just written. This prunes evidence left
 *    over from earlier scoring runs for the same pair.
 *    See 18-RESEARCH.md Open Question 4.
 *  - Uses createAdminClient() (service_role) — required for cron/background writes.
 *    Per ~/CLAUDE.md: "background/server operations: ALWAYS use createAdminClient()".
 *
 * @param rows Evidence rows to persist. All rows must share the same
 *             scored_version per (opp_id, org_id) pair for prune to work correctly.
 * @returns Count of rows upserted and any error string (never throws).
 */
export async function upsertFitEvidence(
  rows: FitEvidenceRow[]
): Promise<UpsertFitEvidenceResult> {
  // Short-circuit on empty input — handles orgs with no vault artifacts.
  if (rows.length === 0) {
    return { upserted: 0, error: null };
  }

  // Truncate excerpts at write time to enforce the ≤200-char column contract.
  const prepared = rows.map((r) => ({
    ...r,
    excerpt: truncateExcerpt(r.excerpt),
  }));

  const admin = createAdminClient();

  // Upsert with the full unique constraint as the conflict key.
  // ignoreDuplicates: false — update in place on rescore to refresh excerpt/similarity.
  // rfp_fit_evidence is now in database.types.ts (Plan 18-03 regen); no casts needed.
  const { data, error: upsertError } = await admin
    .from('rfp_fit_evidence')
    .upsert(prepared, {
      onConflict: 'opp_id,org_id,scored_version,artifact_id,dimension',
      ignoreDuplicates: false,
    })
    .select('opp_id');

  if (upsertError) {
    return { upserted: 0, error: upsertError.message };
  }

  const upserted = data?.length ?? prepared.length;

  // Prune superseded rows: for each distinct (opp_id, org_id) pair, delete rows
  // with scored_version < the version we just wrote.
  // Group by (opp_id, org_id) to emit one delete per pair.
  const pairVersionMap = new Map<string, { opp_id: string; org_id: string; scored_version: number }>();
  for (const r of prepared) {
    const key = `${r.opp_id}::${r.org_id}`;
    const existing = pairVersionMap.get(key);
    if (!existing || r.scored_version > existing.scored_version) {
      pairVersionMap.set(key, {
        opp_id: r.opp_id,
        org_id: r.org_id,
        scored_version: r.scored_version,
      });
    }
  }

  for (const { opp_id, org_id, scored_version } of pairVersionMap.values()) {
    const { error: pruneError } = await admin
      .from('rfp_fit_evidence')
      .delete()
      .eq('opp_id', opp_id)
      .eq('org_id', org_id)
      .lt('scored_version', scored_version);

    if (pruneError) {
      // Non-fatal — log and continue. Stale rows are hidden by scored_version
      // filter at read time; prune failure doesn't affect correctness.
      console.warn(
        `[scoring/evidence-store] prune failed for opp=${opp_id} org=${org_id}: ${pruneError.message}`
      );
    }
  }

  return { upserted, error: null };
}
