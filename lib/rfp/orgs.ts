/**
 * lib/rfp/orgs.ts — Server-side helpers for rfp_orgs tenant management.
 *
 * CLAUDE.md rule: "Background/server operations: ALWAYS use createAdminClient(),
 * never createClient()." This file's createOrgWithOwner() follows that rule for
 * the bootstrap insert that must atomically write two RLS-protected tables before
 * the org+membership relationship exists to satisfy those policies.
 *
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { enrollInSequence } from "./sequences";
import { recomputeAllForOrg } from "./scoring/recompute";
import { buildStarterProfileJson } from "./research/starter-profile";
import { buildRichProfile } from "./research/profile-builder";
import type { Json } from "@/lib/supabase/database.types";

// ── RFP domain types ─────────────────────────────────────────────────────────

export type OrgType = "nonprofit" | "forprofit" | "dual";
export type OrgRole = "owner" | "writer" | "reviewer" | "viewer";

export interface RfpOrg {
  id: string;
  name: string;
  type: OrgType;
  naics: string[];
  voice_fingerprint: string | null;
  capacity_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface RfpUserOrg {
  user_id: string;
  org_id: string;
  role: OrgRole;
  created_at: string;
}

export interface CreateOrgInput {
  name: string;
  type: OrgType;
  naics: string[];
  capacity_summary?: string | null;
}

// ── Server helpers ────────────────────────────────────────────────────────────

/**
 * Creates an org and immediately assigns the calling user as owner.
 *
 * Uses createAdminClient() per CLAUDE.md mandate for server-side operations.
 * Justification: the org does not exist yet when we insert it, so the
 * rfp_user_orgs membership row (which normally allows owner inserts) cannot
 * satisfy RLS. A manual compensating delete fires if the membership insert fails,
 * ensuring we never leave an orphaned org.
 *
 * The RLS recursion fix from Plan 04-01 (SECURITY DEFINER helper functions) means
 * subsequent user-scoped queries work correctly once this bootstrap completes.
 */
export async function createOrgWithOwner(
  input: CreateOrgInput,
  userId: string
): Promise<RfpOrg> {
  // Background/server operation — use admin client per CLAUDE.md rule.
  const admin = createAdminClient();

  // Step 1: insert the org
  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .insert({
      name: input.name,
      type: input.type,
      naics: input.naics,
      capacity_summary: input.capacity_summary?.trim() || null,
    })
    .select()
    .single();

  if (orgErr || !org) {
    throw new Error(`org_create_failed: ${orgErr?.message ?? "no data returned"}`);
  }

  // Step 2: insert the owner membership
  const { error: memErr } = await admin
    .from("rfp_user_orgs")
    .insert({ user_id: userId, org_id: org.id, role: "owner" });

  if (memErr) {
    // Compensating delete — roll back the orphaned org
    await admin.from("rfp_orgs").delete().eq("id", org.id);
    throw new Error(`org_membership_failed: ${memErr.message}`);
  }

  // Enroll the owner in the trial-onboarding sequence. Best-effort — a
  // failure here does NOT block org creation; the user can be enrolled
  // later by re-running this code path or via a backfill script.
  try {
    const { data: userResp } = await admin.auth.admin.getUserById(userId);
    const email = userResp?.user?.email;
    if (email) {
      await enrollInSequence({
        email,
        sequenceKey: "trial-onboarding",
        userId,
        orgId: org.id,
        orgName: org.name,
      });
    }
  } catch (err) {
    console.warn(
      "[orgs] trial-onboarding enroll skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  }

  // Seed a starter capture profile so the recompute below has something to
  // score against — without this, rfp_capture_profiles has no row for the
  // org, scoreOpportunity() takes the profile-pending path, and every
  // opportunity scores 0 (dead Discovery feed). Best-effort like the
  // trial-onboarding enroll above: a failure here must not block org
  // creation, and recompute should still fire (it just degrades to
  // profile-pending until a real profile is saved later).
  try {
    await admin.from("rfp_capture_profiles").insert({
      org_id: org.id,
      version: 1,
      profile_json: buildStarterProfileJson({
        name: org.name,
        type: org.type,
        naics: org.naics,
        capacity_summary: org.capacity_summary,
      }) as unknown as Json,
      voice_examples: [],
    });
  } catch (err) {
    console.warn(
      "[orgs] starter capture profile insert skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  }

  // Fire-and-forget: upgrade the heuristic starter profile with an agentic
  // web-researched one (website + public filings). Runs async so org creation
  // stays fast; on success it inserts profile v2 and triggers its own rescore.
  void buildRichProfile(org.id).catch((err) => {
    console.warn(
      "[orgs] rich profile build skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  });

  // Fire-and-forget: score the org against all current opportunities so the
  // Discovery feed isn't empty the first time the user lands on it. Idempotent
  // (upserts by opp_id, org_id) so a serverless timeout mid-pass is safe — a
  // subsequent recompute resumes cleanly. We swallow errors here so a scoring
  // failure never blocks org creation.
  void recomputeAllForOrg(org.id).catch((err) => {
    console.warn(
      "[orgs] initial recompute failed:",
      err instanceof Error ? err.message.slice(0, 200) : "unknown",
    );
  });

  return org as RfpOrg;
}

/**
 * Fetches a single org by ID, scoped to the current user via RLS.
 * Returns null if the org doesn't exist or the user lacks membership.
 *
 * Uses the anon-keyed createClient() so RLS runs through the
 * rfp_my_org_ids() SECURITY DEFINER helper (Plan 04-01).
 */
export async function getOrgForUser(orgId: string): Promise<RfpOrg | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfp_orgs")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  return (data as RfpOrg | null) ?? null;
}

/**
 * Lists all orgs the current user belongs to, ordered newest-first.
 * Returns the membership role alongside each org (useful for UI badging).
 *
 * RLS on rfp_user_orgs ensures only rows for the current user are returned.
 */
export async function listUserOrgs(): Promise<
  Array<{ role: OrgRole; rfp_orgs: RfpOrg }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfp_user_orgs")
    .select("role, rfp_orgs(id, name, type, naics, created_at, updated_at)")
    .order("created_at", { ascending: false });
  return (data as unknown as Array<{ role: OrgRole; rfp_orgs: RfpOrg }>) ?? [];
}
