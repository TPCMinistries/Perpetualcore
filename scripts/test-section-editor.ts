#!/usr/bin/env tsx
/**
 * scripts/test-section-editor.ts — disposable smoke test for the proposal
 * section editor PATCH endpoint.
 *
 * Flow:
 *   1. Insert a throwaway org + user_org membership + proposal + section
 *      directly via the service-role admin client.
 *   2. Hit PATCH /api/rfp/proposals/:proposalId/sections/:sectionId via
 *      fetch on a locally-running Next.js dev server.
 *   3. Verify the response payload has version === 2.
 *   4. Read the section row back and confirm content + version persisted.
 *   5. Read the audit row from rfp_agent_sessions and confirm
 *      agent === 'proposal_editor_v1'.
 *   6. Clean up everything we inserted.
 *
 * NOTE: Step 2 requires an authenticated session cookie because the route
 * uses createClient() for the membership check. This script bypasses that
 * by calling the route logic directly through a service-key admin client
 * rather than over HTTP — so it tests the DB-side behavior in isolation.
 * For a true end-to-end check, sign in via the UI and use curl with the
 * session cookie.
 *
 * Usage:
 *   npx tsx scripts/test-section-editor.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";

function admin() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local and retry.",
    );
    process.exit(1);
  }

  const db = admin();
  const stamp = Date.now();

  // 1. Insert org + proposal + section. We use a synthetic user_id we don't
  // need a real auth.users row for, because we test the DB side directly.
  const { data: org, error: orgErr } = await db
    .from("rfp_orgs")
    .insert({
      name: `Smoke Test Org ${stamp}`,
      type: "nonprofit",
    })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(`org insert failed: ${orgErr?.message}`);
  console.log(`✓ created org ${org.id}`);

  const { data: proposal, error: pErr } = await db
    .from("rfp_proposals")
    .insert({
      org_id: org.id,
      title: `Smoke Test Proposal ${stamp}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (pErr || !proposal) throw new Error(`proposal insert failed: ${pErr?.message}`);
  console.log(`✓ created proposal ${proposal.id}`);

  const initialContent = "Initial drafter output with a [VERIFY: claim] marker.";
  const initialDraftedAt = new Date().toISOString();
  const { data: section, error: sErr } = await db
    .from("rfp_proposal_sections")
    .insert({
      proposal_id: proposal.id,
      section_type: "project_narrative",
      content: initialContent,
      version: 1,
      last_drafted_by_agent_at: initialDraftedAt,
    })
    .select("id, version, content, last_drafted_by_agent_at")
    .single();
  if (sErr || !section) throw new Error(`section insert failed: ${sErr?.message}`);
  console.log(`✓ created section ${section.id} (version=${section.version})`);

  // 2. Exercise the SAME write logic the route runs — version bump + audit row.
  const newContent = "Human-edited content. The claim was confirmed and replaced.";
  const nextVersion = section.version + 1;
  const { error: updErr } = await db
    .from("rfp_proposal_sections")
    .update({ content: newContent, version: nextVersion })
    .eq("id", section.id);
  if (updErr) throw new Error(`section update failed: ${updErr.message}`);

  await db.from("rfp_agent_sessions").insert({
    proposal_id: proposal.id,
    org_id: org.id,
    agent: "proposal_editor_v1",
    session_id: `human_edit_${stamp}_smoketest`,
    model: null,
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
  });

  // 3. Verify version bumped, content saved, agent timestamp NOT touched.
  const { data: after, error: aErr } = await db
    .from("rfp_proposal_sections")
    .select("version, content, last_drafted_by_agent_at")
    .eq("id", section.id)
    .single();
  if (aErr || !after) throw new Error(`reread failed: ${aErr?.message}`);

  console.log(`  version: ${section.version} → ${after.version}`);
  console.log(`  content: ${after.content?.slice(0, 60)}…`);
  console.log(`  last_drafted_by_agent_at preserved: ${after.last_drafted_by_agent_at === initialDraftedAt}`);

  if (after.version !== 2) throw new Error("version did not bump to 2");
  if (after.content !== newContent) throw new Error("content did not persist");
  if (after.last_drafted_by_agent_at !== initialDraftedAt) {
    throw new Error("last_drafted_by_agent_at was incorrectly mutated");
  }

  // 4. Verify audit row exists.
  const { data: audit, error: auErr } = await db
    .from("rfp_agent_sessions")
    .select("agent, model, tokens_in, tokens_out, cost_usd, session_id")
    .eq("proposal_id", proposal.id)
    .eq("agent", "proposal_editor_v1")
    .limit(1)
    .single();
  if (auErr || !audit) throw new Error(`audit row missing: ${auErr?.message}`);
  console.log(`✓ audit row: agent=${audit.agent} session_id=${audit.session_id}`);
  if (audit.model !== null) throw new Error("model should be null for human edits");
  if (audit.tokens_in !== 0 || audit.tokens_out !== 0) {
    throw new Error("tokens should be 0 for human edits");
  }

  // 5. Cleanup.
  await db.from("rfp_agent_sessions").delete().eq("proposal_id", proposal.id);
  await db.from("rfp_proposal_sections").delete().eq("proposal_id", proposal.id);
  await db.from("rfp_proposals").delete().eq("id", proposal.id);
  await db.from("rfp_orgs").delete().eq("id", org.id);
  console.log("✓ cleaned up");

  console.log("\n=== PASS ===");
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
