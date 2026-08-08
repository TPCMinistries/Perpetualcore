#!/usr/bin/env tsx
/**
 * scripts/verify-rfp-ai-budget.ts — Live-DB AI budget guardrail verification (BILL-04).
 *
 * Proves all three Phase 17 success criteria against the REAL rfp_entitlements +
 * rfp_agent_sessions schema on the CORE DB (hgxxxmtfmvguotkowxbu):
 *
 *   SC-1  ($0 blocks, zero tokens): guardedLLMCall with monthly_ai_budget_usd=0
 *         throws BudgetExceededError and fn() is NEVER called.
 *   SC-2  (success records ledger row): guardedLLMCall with ample budget inserts
 *         exactly one rfp_agent_sessions row with the call's cost_usd.
 *   SC-3  (mid-session crossing blocks): inserting ledger rows that fill the limit
 *         causes the next guardedLLMCall to throw BudgetExceededError; fn() not called.
 *   SC-4  (NULL = unlimited): monthly_ai_budget_usd=null resolves even with high spend.
 *
 * Safety (/db-safe):
 *   - All seeded rows use a VERIFY- prefixed org name for easy audit.
 *   - The throwaway org_id scopes all inserts; only rows created in this run
 *     are ever deleted.
 *   - Cleanup is guaranteed in a finally block; zero residue after exit.
 *   - Uses createAdminClient() per CLAUDE.md mandate for background operations.
 *
 * Run:
 *   npx tsx scripts/verify-rfp-ai-budget.ts
 *
 * Exit codes:
 *   0 — all criteria PASS
 *   1 — one or more criteria FAIL (or fatal error)
 *
 * Env (loaded from .env.local / .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from "dotenv";
import * as path from "node:path";
import * as process from "node:process";

// Load env BEFORE anything that reads process.env at import time.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/server";
import {
  guardedLLMCall,
  BudgetExceededError,
  type LLMCallMeta,
} from "../lib/rfp/ai/guardrail";

// ── Helpers ────────────────────────────────────────────────────────────────

let failCount = 0;

function pass(label: string): void {
  console.log(`  [PASS] ${label}`);
}

function fail(label: string, detail?: string): void {
  failCount++;
  console.error(`  [FAIL] ${label}${detail ? `: ${detail}` : ""}`);
}

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

// ── Calendar-month start in UTC (mirrors guardrail.ts logic) ───────────────

function monthStart(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  ).toISOString();
}

// ── Helpers to set entitlement budget ─────────────────────────────────────

async function setBudget(
  orgId: string,
  limitUsd: number | null
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("rfp_entitlements")
    .update({ monthly_ai_budget_usd: limitUsd })
    .eq("org_id", orgId);
  if (error) {
    throw new Error(`setBudget failed: ${error.message}`);
  }
}

// ── Count rfp_agent_sessions rows this month for org ──────────────────────

async function countSessionRows(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rfp_agent_sessions")
    .select("id")
    .eq("org_id", orgId)
    .gte("created_at", monthStart());
  if (error) throw new Error(`countSessionRows failed: ${error.message}`);
  return (data ?? []).length;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const ts = Date.now();
  const orgName = `VERIFY-ai-budget-${ts}`;

  console.log("=== verify-rfp-ai-budget: BILL-04 live-DB proof ===");
  console.log(`  org name: ${orgName}`);
  console.log(`  DB:       ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(env missing)"}`);

  const admin = createAdminClient();

  // Seeded IDs — captured here so the finally block can clean up precisely
  let orgId: string | null = null;
  const sessionIdsCreated: string[] = [];

  try {
    // ── Step 1: Seed rfp_orgs row ────────────────────────────────────────

    console.log("\n[step 1] seeding VERIFY- rfp_orgs row...");

    const { data: orgRow, error: orgErr } = await admin
      .from("rfp_orgs")
      .insert({ name: orgName, type: "nonprofit" })
      .select("id")
      .single();

    if (orgErr || !orgRow) {
      throw new Error(`rfp_orgs insert failed: ${orgErr?.message ?? "no row"}`);
    }
    orgId = orgRow.id;
    console.log(`  org_id: ${orgId}`);

    // ── Step 2: Seed rfp_entitlements row ($0 budget to start) ───────────

    console.log("[step 2] seeding rfp_entitlements with $0 budget...");

    const { error: entErr } = await admin.from("rfp_entitlements").insert({
      org_id: orgId,
      monthly_ai_budget_usd: 0,
    });
    if (entErr) {
      throw new Error(`rfp_entitlements insert failed: ${entErr.message}`);
    }

    // ── SC-1: $0 budget blocks; fn() never invoked ────────────────────────

    console.log("\n[SC-1] $0 budget — expect BudgetExceededError, fn NOT called");

    let sc1FnCalled = false;
    const sc1Fn = async (): Promise<LLMCallMeta> => {
      sc1FnCalled = true;
      return {
        agent: "verify_v1",
        model: "gpt-4o",
        tokensIn: 100,
        tokensOut: 200,
        costUsd: 0.01,
      };
    };

    let sc1Threw = false;
    let sc1ErrorIsCorrectType = false;
    try {
      await guardedLLMCall(orgId, sc1Fn);
    } catch (err) {
      sc1Threw = true;
      sc1ErrorIsCorrectType = err instanceof BudgetExceededError;
    }

    assert(sc1Threw, "SC-1: guardedLLMCall throws");
    assert(sc1ErrorIsCorrectType, "SC-1: error is BudgetExceededError");
    assert(!sc1FnCalled, "SC-1: fn() was NEVER called (zero token usage)");

    // ── SC-2: Successful call records one ledger row ───────────────────────

    console.log("\n[SC-2] $10 budget — expect fn called, one session row inserted");

    await setBudget(orgId, 10.0);

    const beforeCount = await countSessionRows(orgId);

    const sc2Meta: LLMCallMeta = {
      agent: "verify_v1",
      model: "gpt-4o",
      tokensIn: 100,
      tokensOut: 200,
      costUsd: 0.01,
    };
    const sc2Fn = async (): Promise<LLMCallMeta> => sc2Meta;

    let sc2Result: LLMCallMeta | null = null;
    let sc2Error: unknown = null;
    try {
      sc2Result = await guardedLLMCall(orgId, sc2Fn);
    } catch (err) {
      sc2Error = err;
    }

    assert(sc2Error === null, "SC-2: guardedLLMCall resolves (no throw)");
    assert(sc2Result?.agent === "verify_v1", "SC-2: result.agent is verify_v1");

    const afterCount = await countSessionRows(orgId);
    const newRowCount = afterCount - beforeCount;
    assert(newRowCount === 1, `SC-2: exactly one new session row inserted (delta=${newRowCount})`);

    // Capture the IDs of rows we just created for cleanup
    const { data: newRows, error: newRowsErr } = await admin
      .from("rfp_agent_sessions")
      .select("id, cost_usd, agent")
      .eq("org_id", orgId)
      .gte("created_at", monthStart())
      .order("created_at", { ascending: false })
      .limit(1);

    if (newRowsErr) {
      fail("SC-2: could not read back inserted row", newRowsErr.message);
    } else if (newRows && newRows.length > 0) {
      const row = newRows[0];
      sessionIdsCreated.push(row.id);
      assert(
        Number(row.cost_usd) === 0.01,
        `SC-2: session row has correct cost_usd (got ${row.cost_usd})`
      );
      assert(row.agent === "verify_v1", `SC-2: session row agent=verify_v1 (got ${row.agent})`);
    } else {
      fail("SC-2: no session row found after successful call");
    }

    // ── SC-3: Mid-session limit crossing blocks next call ─────────────────

    console.log("\n[SC-3] filling spend to limit — next call should be blocked");

    // Insert ledger rows that push total spend to >= 10.00
    // We already have 0.01 from SC-2; add 9.99 to hit the ceiling.
    const { data: fillRow, error: fillErr } = await admin
      .from("rfp_agent_sessions")
      .insert({
        org_id: orgId,
        agent: "verify_fill_v1",
        model: "gpt-4o",
        tokens_in: 0,
        tokens_out: 0,
        cost_usd: 9.99,
      })
      .select("id")
      .single();

    if (fillErr || !fillRow) {
      throw new Error(`SC-3 fill insert failed: ${fillErr?.message ?? "no row"}`);
    }
    sessionIdsCreated.push(fillRow.id);
    console.log(`  [step] fill row inserted (${fillRow.id}), spend now >= $10.00`);

    let sc3FnCalled = false;
    const sc3Fn = async (): Promise<LLMCallMeta> => {
      sc3FnCalled = true;
      return {
        agent: "verify_v1",
        model: "gpt-4o",
        tokensIn: 100,
        tokensOut: 200,
        costUsd: 0.01,
      };
    };

    let sc3Threw = false;
    let sc3ErrorIsCorrectType = false;
    try {
      await guardedLLMCall(orgId, sc3Fn);
    } catch (err) {
      sc3Threw = true;
      sc3ErrorIsCorrectType = err instanceof BudgetExceededError;
    }

    assert(sc3Threw, "SC-3: next call throws after limit crossed");
    assert(sc3ErrorIsCorrectType, "SC-3: error is BudgetExceededError");
    assert(!sc3FnCalled, "SC-3: fn() was NOT called (zero token usage)");

    // ── SC-4: NULL = unlimited ────────────────────────────────────────────

    console.log("\n[SC-4] NULL budget — expect fn called regardless of prior spend");

    // Reset entitlement to NULL (unlimited)
    await setBudget(orgId, null);

    let sc4FnCalled = false;
    const sc4Fn = async (): Promise<LLMCallMeta> => {
      sc4FnCalled = true;
      return {
        agent: "verify_v1",
        model: "gpt-4o",
        tokensIn: 50,
        tokensOut: 100,
        costUsd: 0.002,
      };
    };

    let sc4Error: unknown = null;
    try {
      await guardedLLMCall(orgId, sc4Fn);
    } catch (err) {
      sc4Error = err;
    }

    // Track the new row(s) for cleanup
    const { data: sc4Rows } = await admin
      .from("rfp_agent_sessions")
      .select("id")
      .eq("org_id", orgId)
      .gte("created_at", monthStart())
      .order("created_at", { ascending: false })
      .limit(1);
    if (sc4Rows && sc4Rows.length > 0) {
      sessionIdsCreated.push(sc4Rows[0].id);
    }

    assert(sc4Error === null, "SC-4: NULL budget resolves (no throw)");
    assert(sc4FnCalled, "SC-4: fn() was called when budget is NULL");

    // ── Final summary ──────────────────────────────────────────────────────

    console.log("");
    if (failCount === 0) {
      console.log("ALL CRITERIA PASS");
    } else {
      console.error(`FAILURES: ${failCount}`);
    }
  } finally {
    // ── Cleanup — always runs; never deletes non-VERIFY rows ─────────────

    console.log("\n[cleanup] removing seeded rows...");

    if (orgId) {
      // Delete rfp_agent_sessions rows we created
      if (sessionIdsCreated.length > 0) {
        const { error: sessDel } = await admin
          .from("rfp_agent_sessions")
          .delete()
          .eq("org_id", orgId)
          .in("id", sessionIdsCreated);
        if (sessDel) {
          console.error(`  [cleanup] session rows delete error: ${sessDel.message}`);
        } else {
          console.log(`  [cleanup] ${sessionIdsCreated.length} session row(s) deleted`);
        }
      }

      // Delete rfp_entitlements row
      const { error: entDel } = await admin
        .from("rfp_entitlements")
        .delete()
        .eq("org_id", orgId);
      if (entDel) {
        console.error(`  [cleanup] entitlements delete error: ${entDel.message}`);
      } else {
        console.log("  [cleanup] entitlements row deleted");
      }

      // Delete rfp_orgs row (only VERIFY- rows)
      const { error: orgDel } = await admin
        .from("rfp_orgs")
        .delete()
        .eq("id", orgId)
        .like("name", "VERIFY-%");
      if (orgDel) {
        console.error(`  [cleanup] org delete error: ${orgDel.message}`);
      } else {
        console.log("  [cleanup] org row deleted");
      }
    }

    // Residue check — confirm zero VERIFY- org rows remain
    const { data: residue, error: residueErr } = await admin
      .from("rfp_orgs")
      .select("id, name")
      .like("name", "VERIFY-ai-budget-%");

    if (residueErr) {
      console.error(`  [cleanup] residue check error: ${residueErr.message}`);
    } else if ((residue ?? []).length > 0) {
      console.error(
        `  [cleanup] WARNING: ${residue!.length} VERIFY- org(s) remain — manual cleanup needed:`
      );
      for (const r of residue!) {
        console.error(`    - ${r.name} (${r.id})`);
      }
    } else {
      console.log("  [cleanup] zero residue confirmed");
    }
  }

  // Exit non-zero if any criterion failed
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : err);
  process.exit(1);
});
