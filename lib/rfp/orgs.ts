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
    .insert({ name: input.name, type: input.type, naics: input.naics })
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
