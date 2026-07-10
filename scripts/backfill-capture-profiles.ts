#!/usr/bin/env tsx
/**
 * scripts/backfill-capture-profiles.ts — One-time backfill for orgs missing
 * a starter rfp_capture_profiles row.
 *
 * Bug: createOrgWithOwner() never wrote a capture profile until the fix in
 * lib/rfp/orgs.ts, so every org created before that fix has ZERO rows in
 * rfp_capture_profiles and scores 0 on every opportunity (profile-pending
 * path in lib/rfp/scoring/score.ts). This script finds those orgs, inserts
 * a starter profile (lib/rfp/research/starter-profile.ts), and recomputes
 * fit scores so the Discovery feed populates.
 *
 * Skips demo orgs ("Demo Org · ..." from scripts/seed-rfp-demo-org.ts) —
 * those are throwaway seed data, not real tenants.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/backfill-capture-profiles.ts
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * NOT RUN as part of this change — review the printed org list before
 * running this against any real database.
 */

import { createAdminClient } from "../lib/supabase/server";
import { buildStarterProfileJson } from "../lib/rfp/research/starter-profile";
import { recomputeAllForOrg } from "../lib/rfp/scoring/recompute";
import type { Json } from "../lib/supabase/database.types";

interface OrgRow {
  id: string;
  name: string;
  type: string;
  naics: string[] | null;
  capacity_summary: string | null;
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  const { data: orgs, error: orgsErr } = await admin
    .from("rfp_orgs")
    .select("id, name, type, naics, capacity_summary");
  if (orgsErr) {
    throw new Error(`orgs_load_failed: ${orgsErr.message}`);
  }

  const { data: existingProfiles, error: profilesErr } = await admin
    .from("rfp_capture_profiles")
    .select("org_id");
  if (profilesErr) {
    throw new Error(`profiles_load_failed: ${profilesErr.message}`);
  }

  const hasProfile = new Set(
    (existingProfiles ?? []).map((row) => row.org_id as string)
  );

  const targets = ((orgs ?? []) as OrgRow[]).filter(
    (org) => !hasProfile.has(org.id) && !org.name.startsWith("Demo Org · ")
  );

  console.log(`[backfill] ${targets.length} org(s) missing a capture profile`);

  for (const org of targets) {
    console.log(`[backfill] ${org.name} (${org.id})`);

    const profile_json = buildStarterProfileJson({
      name: org.name,
      type: org.type,
      naics: org.naics ?? [],
      capacity_summary: org.capacity_summary,
    });

    const { error: insertErr } = await admin.from("rfp_capture_profiles").insert({
      org_id: org.id,
      version: 1,
      profile_json: profile_json as unknown as Json,
      voice_examples: [],
    });
    if (insertErr) {
      console.error(`[backfill]   profile insert failed: ${insertErr.message}`);
      continue;
    }

    try {
      const { scored } = await recomputeAllForOrg(org.id, { aiSummaries: false });
      console.log(`[backfill]   recomputed ${scored} opportunity match(es)`);
    } catch (err) {
      console.error(
        `[backfill]   recompute failed: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  console.log("[backfill] done.");
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : err);
  process.exit(1);
});
