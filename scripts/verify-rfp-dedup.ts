#!/usr/bin/env tsx
/**
 * scripts/verify-rfp-dedup.ts — Live-DB dedup verification script (FND-02).
 *
 * Proves that ingesting the same opportunity from two different sources results
 * in ONE canonical row with TWO aliases, not two canonicals.
 *
 * Steps:
 *  1. Insert two rfp_opportunities rows representing the same logical opp
 *     from two sources (grants_gov + nsf_grants) sharing a grants_gov numeric ID.
 *  2. Call persistCanonicalAliases([rowA, rowB]).
 *  3. Assert: 1 canonical, 2 aliases.
 *  4. Print PASS/FAIL. Exit 0 on PASS, 1 on FAIL.
 *  5. CLEANUP (in finally): delete aliases → canonical → opportunities.
 *     Script is safe to re-run (idempotent via VERIFY- prefixed source_ids).
 *
 * /db-safe: writes to shared CORE brain DB (hgxxxmtfmvguotkowxbu).
 *   - All seeded rows use source_id prefixed with "VERIFY-" for easy audit.
 *   - Cleanup runs in a finally block; residue is impossible on normal exit.
 *
 * Run:
 *   npm run verify:rfp-dedup
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from "dotenv";
import * as path from "node:path";
import * as process from "node:process";

// Load env BEFORE importing anything that reads process.env at import time.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/server";
import {
  persistCanonicalAliases,
  type OpportunityRowWithId,
} from "../lib/rfp/ingest/canonicalize";

// ── constants ──────────────────────────────────────────────────────────────

/** Shared grants.gov numeric ID that causes both rows to collapse to one key. */
const GRANTS_GOV_ID = "353936";
const SOURCE_ID_A = `VERIFY-${GRANTS_GOV_ID}`;   // grants_gov side
const SOURCE_ID_B = "VERIFY-24-569";               // nsf_grants cross-post

// ── helpers ────────────────────────────────────────────────────────────────

function pass(msg: string): void {
  console.log(`[PASS] ${msg}`);
}

function fail(msg: string): never {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

function assert(condition: boolean, label: string): void {
  if (!condition) {
    fail(label);
  }
  pass(label);
}

// ── main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== verify-rfp-dedup: FND-02 live-DB dedup proof ===");
  console.log(`  canonical key target: grants_gov:${GRANTS_GOV_ID}`);
  console.log(`  source A: grants_gov / ${SOURCE_ID_A}`);
  console.log(`  source B: nsf_grants  / ${SOURCE_ID_B}`);

  const admin = createAdminClient();

  // Track seeded IDs so cleanup can target them precisely even if
  // the assertions fail mid-way.
  let oppIdA: string | null = null;
  let oppIdB: string | null = null;
  let canonicalKey: string | null = null;

  try {
    // ── Step 1: Seed two rfp_opportunities rows ──────────────────────────

    // Clean up any leftover VERIFY- rows from a previous failed run.
    await admin
      .from("rfp_opportunities")
      .delete()
      .in("source_id", [SOURCE_ID_A, SOURCE_ID_B]);

    const now = new Date().toISOString();

    const { data: insertedA, error: errA } = await admin
      .from("rfp_opportunities")
      .insert({
        source: "grants_gov",
        source_id: SOURCE_ID_A,
        title: "VERIFY: Mathematical Foundations of AI",
        agency: "National Science Foundation",
        type: "posted",
        keywords: [],
        geo: "US",
        url: `https://www.grants.gov/search-results-detail/${GRANTS_GOV_ID}`,
        needs_review: false,
        last_seen_at: now,
        raw_json: { id: Number(GRANTS_GOV_ID), _verify: true },
      })
      .select("id")
      .single();

    if (errA || !insertedA) {
      fail(`grants_gov insert failed: ${errA?.message ?? "no row returned"}`);
    }
    oppIdA = insertedA.id;
    console.log(`  [step 1a] seeded grants_gov opp: ${oppIdA}`);

    const { data: insertedB, error: errB } = await admin
      .from("rfp_opportunities")
      .insert({
        source: "nsf_grants",
        source_id: SOURCE_ID_B,
        title: "VERIFY: AI Foundations (NSF cross-post)",
        agency: "National Science Foundation",
        type: "posted",
        keywords: [],
        geo: "US",
        url: null,
        needs_review: false,
        last_seen_at: now,
        // raw_json.id matches the grants_gov numeric ID — this is how the
        // canonicalizer detects it as the same opportunity.
        raw_json: { id: Number(GRANTS_GOV_ID), number: "24-569", _verify: true },
      })
      .select("id")
      .single();

    if (errB || !insertedB) {
      fail(`nsf_grants insert failed: ${errB?.message ?? "no row returned"}`);
    }
    oppIdB = insertedB.id;
    console.log(`  [step 1b] seeded nsf_grants opp: ${oppIdB}`);

    // ── Step 2: Build OpportunityRowWithId objects ───────────────────────

    const rowA: OpportunityRowWithId = {
      id: oppIdA,
      source: "grants_gov",
      source_id: SOURCE_ID_A,
      title: "VERIFY: Mathematical Foundations of AI",
      agency: "National Science Foundation",
      type: "posted",
      amount_min: null,
      amount_max: null,
      deadline: null,
      posted_at: null,
      brief: null,
      keywords: [],
      geo: "US",
      url: `https://www.grants.gov/search-results-detail/${GRANTS_GOV_ID}`,
      needs_review: false,
      last_seen_at: now,
      raw_json: { id: Number(GRANTS_GOV_ID), _verify: true },
    };

    const rowB: OpportunityRowWithId = {
      id: oppIdB,
      source: "nsf_grants",
      source_id: SOURCE_ID_B,
      title: "VERIFY: AI Foundations (NSF cross-post)",
      agency: "National Science Foundation",
      type: "posted",
      amount_min: null,
      amount_max: null,
      deadline: null,
      posted_at: null,
      brief: null,
      keywords: [],
      geo: "US",
      url: null,
      needs_review: false,
      last_seen_at: now,
      raw_json: { id: Number(GRANTS_GOV_ID), number: "24-569", _verify: true },
    };

    // ── Step 3: Call persistCanonicalAliases ─────────────────────────────

    console.log("  [step 3] calling persistCanonicalAliases([rowA, rowB])...");
    const result = await persistCanonicalAliases([rowA, rowB]);

    if (result.errors.length > 0) {
      fail(`persistCanonicalAliases returned errors: ${result.errors.join("; ")}`);
    }
    console.log(
      `  [step 3] result: canonicals_seen=${result.canonicals_seen}, aliases_upserted=${result.aliases_upserted}`,
    );

    // ── Step 4: Assert counts ────────────────────────────────────────────

    assert(result.canonicals_seen === 1, "canonicals_seen === 1");
    assert(result.aliases_upserted === 2, "aliases_upserted === 2");

    // Query the DB directly to double-check
    canonicalKey = `grants_gov:${GRANTS_GOV_ID}`;

    const { data: canonicalRows, error: cErr } = await admin
      .from("rfp_opportunity_canonicals")
      .select("id, canonical_key")
      .eq("canonical_key", canonicalKey);

    if (cErr) fail(`canonical query failed: ${cErr.message}`);
    assert(
      (canonicalRows ?? []).length === 1,
      `DB: exactly 1 canonical row for key=${canonicalKey}`,
    );

    const canonicalId = canonicalRows![0].id;
    const { data: aliasRows, error: aErr } = await admin
      .from("rfp_opportunity_aliases")
      .select("opp_id, source")
      .eq("canonical_id", canonicalId)
      .in("opp_id", [oppIdA, oppIdB]);

    if (aErr) fail(`alias query failed: ${aErr.message}`);
    assert(
      (aliasRows ?? []).length === 2,
      `DB: exactly 2 alias rows pointing at canonical ${canonicalId}`,
    );

    const sources = (aliasRows ?? []).map((r) => r.source).sort();
    assert(
      JSON.stringify(sources) === JSON.stringify(["grants_gov", "nsf_grants"]),
      `DB: aliases cover both sources (${sources.join(", ")})`,
    );

    console.log("\n=== 1 canonical / 2 aliases — PASS ===\n");
  } finally {
    // ── Step 5: Cleanup — always runs ────────────────────────────────────

    console.log("  [cleanup] removing seeded rows...");

    // Delete aliases first (FK → canonicals)
    if (oppIdA || oppIdB) {
      const oppIds = [oppIdA, oppIdB].filter((id): id is string => id !== null);
      const { error: aliasDelErr } = await admin
        .from("rfp_opportunity_aliases")
        .delete()
        .in("opp_id", oppIds);
      if (aliasDelErr) {
        console.error(`  [cleanup] alias delete error: ${aliasDelErr.message}`);
      } else {
        console.log("  [cleanup] aliases deleted");
      }
    }

    // Delete canonical (key-based so it's idempotent)
    if (canonicalKey) {
      const { error: canonDelErr } = await admin
        .from("rfp_opportunity_canonicals")
        .delete()
        .eq("canonical_key", canonicalKey)
        // Extra guard: only delete our test row by checking primary_opp_id is one of ours
        .in("primary_opp_id", [oppIdA, oppIdB].filter((id): id is string => id !== null));
      if (canonDelErr) {
        console.error(`  [cleanup] canonical delete error: ${canonDelErr.message}`);
      } else {
        console.log("  [cleanup] canonical deleted");
      }
    }

    // Delete the rfp_opportunities rows
    {
      const { error: oppDelErr } = await admin
        .from("rfp_opportunities")
        .delete()
        .in("source_id", [SOURCE_ID_A, SOURCE_ID_B]);
      if (oppDelErr) {
        console.error(`  [cleanup] opportunities delete error: ${oppDelErr.message}`);
      } else {
        console.log("  [cleanup] opportunities deleted");
      }
    }

    // Verify zero residue
    const { data: residue, error: residueErr } = await admin
      .from("rfp_opportunities")
      .select("id, source_id")
      .like("source_id", "VERIFY-%");

    if (residueErr) {
      console.error(`  [cleanup] residue check error: ${residueErr.message}`);
    } else if ((residue ?? []).length > 0) {
      console.error(
        `  [cleanup] WARNING: ${residue!.length} VERIFY- row(s) remain — manual cleanup may be needed`,
      );
      for (const row of residue!) {
        console.error(`    - ${row.source_id} (${row.id})`);
      }
    } else {
      console.log("  [cleanup] zero residue confirmed");
    }
  }
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : err);
  process.exit(1);
});
