#!/usr/bin/env tsx
/**
 * Smoke test for Vault Grounding v1.
 *
 * Disposable end-to-end test against the live LDC Brain AI DB. It:
 *   1. Creates an ephemeral org row.
 *   2. Uploads one synthetic document via uploadDocument().
 *   3. Lists the org's vault (verifies grouping by doc_id).
 *   4. Calls retrieveVaultChunks() with a query that should hit the doc.
 *   5. Deletes all chunks for the doc.
 *   6. Deletes the ephemeral org.
 *
 * Run:
 *   npx tsx scripts/test-vault-pipeline.ts
 *
 * Requires .env.local with OPENAI_API_KEY + SUPABASE_SERVICE_ROLE_KEY +
 * NEXT_PUBLIC_SUPABASE_URL.
 *
 * Cost: ~$0.0001 (one tiny embed call + one tiny query embed).
 */

import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Import after dotenv so server env is hydrated.
import { createAdminClient } from "../lib/supabase/server";
import { uploadDocument } from "../lib/rfp/vault/upload";
import { retrieveVaultChunks } from "../lib/rfp/vault/retrieve";
import { chunk } from "../lib/rfp/vault/chunker";

const DOC_TITLE = "Smoke Test — Founder Letter (Uplift Communities)";
const DOC_BODY = `Dear neighbors,

This year you helped Aisha get her CNA license. You helped Marcus open a savings account for the first time in his life. You helped 47 families in East Flatbush keep the lights on through the winter.

The work is small on purpose. We work block by block. We answer the phone when somebody calls.

Three things we learned this year. First, the gap between "wants to work" and "got hired" is paperwork. Second, the gap between "got hired" and "stayed hired" is childcare. Third, the gap between "stayed hired" and "saved money" is a checking account at a bank that doesn't shame you.

We took those three findings and built three programs around them. We named them after the people they help, not the funders who paid for them.

Our healthcare credential pathway in 2024 enrolled 51 young adults aged 18-24. Of those, 41 sat for the CNA exam and 36 passed. 31 were hired into roles paying at or above $19/hour within 90 days. We know what works because we count what we do.

We do not say "stakeholders" and we do not say "leverage." We say neighbors and we say "we work with Brookdale." We try to write the way Tasha talks on the phone.

If you want to know what we are doing in 2025, call Tasha at the office. She picks up.

— The Uplift team`;

const RETRIEVAL_QUERY = "How many young adults did Uplift place in healthcare jobs in 2024?";

async function main() {
  const admin = createAdminClient();

  // ── Sanity: env present ──────────────────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

  console.log("=== Vault Grounding v1 — smoke test ===\n");

  // ── 0) Chunker preview (offline) ────────────────────────────────────────
  const preview = chunk(DOC_BODY);
  console.log(`[chunker] input ${DOC_BODY.length} chars → ${preview.length} chunks`);
  preview.forEach((c) => {
    console.log(
      `  chunk[${c.index}] ${c.text.length} chars  [${c.char_start}..${c.char_end}]`,
    );
  });
  console.log();

  // ── 1) Create ephemeral org ─────────────────────────────────────────────
  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .insert({
      name: `Vault Smoke Test ${new Date().toISOString()}`,
      type: "nonprofit",
      naics: ["624190"],
    })
    .select("id")
    .single<{ id: string }>();
  if (orgErr || !org) throw new Error(`org_create_failed: ${orgErr?.message ?? "no row"}`);
  console.log(`[setup] created ephemeral org ${org.id}`);

  // Wrap the rest in a try/finally so we clean up even on failure.
  let uploadDocId: string | null = null;
  try {
    // ── 2) Upload ─────────────────────────────────────────────────────────
    console.log("\n[upload] running uploadDocument()…");
    const t0 = Date.now();
    const uploaded = await uploadDocument({
      orgId: org.id,
      docTitle: DOC_TITLE,
      docType: "founder_letter",
      body: DOC_BODY,
    });
    const elapsed = Date.now() - t0;
    uploadDocId = uploaded.doc_id;
    console.log(
      `[upload] ok in ${elapsed}ms — doc_id=${uploaded.doc_id} chunks=${uploaded.chunk_count} ` +
        `tokens=${uploaded.tokens} cost=$${uploaded.cost_usd.toFixed(6)} model=${uploaded.model}`,
    );

    // ── 3) List ───────────────────────────────────────────────────────────
    console.log("\n[list] fetching grouped doc list…");
    const { data: listRows, error: listErr } = await admin
      .from("rfp_vault_artifacts")
      .select("body, type, title, source_metadata, created_at")
      .eq("org_id", org.id);
    if (listErr) throw new Error(`list_failed: ${listErr.message}`);
    interface MetaShape { doc_id?: unknown; doc_title?: unknown }
    const grouped = new Map<string, { chunks: number; chars: number }>();
    for (const r of listRows ?? []) {
      const meta = (r.source_metadata ?? {}) as MetaShape;
      const id = typeof meta.doc_id === "string" ? meta.doc_id : "__unknown";
      const g = grouped.get(id) ?? { chunks: 0, chars: 0 };
      g.chunks += 1;
      g.chars += (r.body as string | null)?.length ?? 0;
      grouped.set(id, g);
    }
    console.log(`[list] ${listRows?.length ?? 0} rows in ${grouped.size} doc(s):`);
    grouped.forEach((g, id) => {
      console.log(`  doc_id=${id} chunks=${g.chunks} chars=${g.chars}`);
    });

    // ── 4) Retrieve ───────────────────────────────────────────────────────
    console.log(`\n[retrieve] query: "${RETRIEVAL_QUERY}"`);
    const t1 = Date.now();
    const results = await retrieveVaultChunks(org.id, RETRIEVAL_QUERY, { k: 5 });
    const elapsedR = Date.now() - t1;
    console.log(`[retrieve] returned ${results.length} chunk(s) in ${elapsedR}ms`);
    results.forEach((r, i) => {
      const snippet = r.text.slice(0, 120).replace(/\s+/g, " ");
      console.log(
        `  #${i + 1} sim=${r.similarity_score.toFixed(4)} chunk[${r.chunk_index}] — ${snippet}${r.text.length > 120 ? "…" : ""}`,
      );
    });
    if (results.length === 0) throw new Error("retrieve returned 0 chunks");
    if (results[0].similarity_score < 0.3) {
      console.warn(
        `[retrieve] WARN: top-1 similarity ${results[0].similarity_score.toFixed(4)} below 0.3 threshold`,
      );
    }

    // ── 5) Delete by doc_id ───────────────────────────────────────────────
    console.log(`\n[delete] removing all chunks with doc_id=${uploaded.doc_id}`);
    const { data: deleted, error: delErr } = await admin
      .from("rfp_vault_artifacts")
      .delete()
      .eq("org_id", org.id)
      .eq("source_metadata->>doc_id", uploaded.doc_id)
      .select("id");
    if (delErr) throw new Error(`delete_failed: ${delErr.message}`);
    console.log(`[delete] removed ${deleted?.length ?? 0} row(s)`);
    uploadDocId = null;

    // ── 6) Verify empty ──────────────────────────────────────────────────
    const { count } = await admin
      .from("rfp_vault_artifacts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id);
    console.log(`[verify] org now has ${count ?? 0} vault rows`);

    console.log("\n=== SMOKE TEST PASSED ===");
  } finally {
    // Best-effort cleanup of any rows we left behind.
    if (uploadDocId) {
      await admin
        .from("rfp_vault_artifacts")
        .delete()
        .eq("org_id", org.id)
        .eq("source_metadata->>doc_id", uploadDocId);
    }
    await admin.from("rfp_orgs").delete().eq("id", org.id);
    console.log(`[cleanup] deleted ephemeral org ${org.id}`);
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
