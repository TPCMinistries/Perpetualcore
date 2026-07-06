/**
 * RFP Tenant Isolation Test Suite
 * Phase 04-01: Foundations & Salvage Port
 *
 * Proves that no cross-tenant read or write is possible via RLS.
 * Runs against the LIVE LDC Brain AI database (hgxxxmtfmvguotkowxbu).
 * Self-cleaning: beforeAll creates ephemeral users/orgs, afterAll tears them down.
 *
 * IMPORTANT: Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The service role key is used ONLY for setup/teardown (admin.auth.admin.*)
 * and for seeding test data. All assertion calls use user-scoped clients (RLS applies).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Load real env from .env.local (bypasses the global test setup mock)
// ---------------------------------------------------------------------------
function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envVars = loadEnvLocal();

const SUPABASE_URL =
  envVars.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const SUPABASE_SERVICE_ROLE_KEY =
  envVars.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "RLS test requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, " +
    "and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------
let userA: { id: string; access_token: string };
let userB: { id: string; access_token: string };
let orgA: string;
let orgB: string;
const testRunId = Date.now();

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeAll(async () => {
  // Create two ephemeral users via admin (email_confirm: true skips confirmation)
  const emailA = `rls-test-a-${testRunId}@test.local`;
  const emailB = `rls-test-b-${testRunId}@test.local`;
  const password = "test-password-12345";

  const aResult = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (aResult.error) throw new Error(`Failed to create user A: ${aResult.error.message}`);

  const bResult = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
  });
  if (bResult.error) throw new Error(`Failed to create user B: ${bResult.error.message}`);

  // Sign each user in to get a real JWT (so RLS applies via auth.uid())
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const sA = await anonClient.auth.signInWithPassword({ email: emailA, password });
  if (sA.error || !sA.data.session)
    throw new Error(`Failed to sign in user A: ${sA.error?.message}`);

  const sB = await anonClient.auth.signInWithPassword({ email: emailB, password });
  if (sB.error || !sB.data.session)
    throw new Error(`Failed to sign in user B: ${sB.error?.message}`);

  userA = { id: aResult.data.user!.id, access_token: sA.data.session.access_token };
  userB = { id: bResult.data.user!.id, access_token: sB.data.session.access_token };

  // Admin creates two orgs (bypasses RLS — service role)
  const oAResult = await admin
    .from("rfp_orgs")
    .insert({ name: `Test Org A - ${testRunId}`, type: "nonprofit" })
    .select()
    .single();
  if (oAResult.error) throw new Error(`Failed to create Org A: ${oAResult.error.message}`);

  const oBResult = await admin
    .from("rfp_orgs")
    .insert({ name: `Test Org B - ${testRunId}`, type: "forprofit" })
    .select()
    .single();
  if (oBResult.error) throw new Error(`Failed to create Org B: ${oBResult.error.message}`);

  orgA = oAResult.data!.id;
  orgB = oBResult.data!.id;

  // Admin assigns memberships: User A → Org A (owner), User B → Org B (owner)
  const membershipResult = await admin.from("rfp_user_orgs").insert([
    { user_id: userA.id, org_id: orgA, role: "owner" },
    { user_id: userB.id, org_id: orgB, role: "owner" },
  ]);
  if (membershipResult.error)
    throw new Error(`Failed to insert memberships: ${membershipResult.error.message}`);

  // Seed a vault artifact in each org via admin
  const artifactResult = await admin.from("rfp_vault_artifacts").insert([
    { org_id: orgA, type: "past_proposal", title: "A-secret", body: "Org A confidential content" },
    { org_id: orgB, type: "past_proposal", title: "B-secret", body: "Org B confidential content" },
  ]);
  if (artifactResult.error)
    throw new Error(`Failed to seed artifacts: ${artifactResult.error.message}`);
}, 30000);

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------
afterAll(async () => {
  // Delete orgs (CASCADE deletes: rfp_user_orgs, rfp_vault_artifacts, etc.)
  if (orgA) await admin.from("rfp_orgs").delete().eq("id", orgA);
  if (orgB) await admin.from("rfp_orgs").delete().eq("id", orgB);

  // Delete ephemeral users
  if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
  if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
}, 30000);

// ---------------------------------------------------------------------------
// Helper: create a user-scoped Supabase client (RLS applies)
// ---------------------------------------------------------------------------
function clientFor(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------
describe("RFP tenant isolation", () => {
  it("User A cannot read Org B vault artifacts", async () => {
    const c = clientFor(userA.access_token);
    const { data, error } = await c
      .from("rfp_vault_artifacts")
      .select("*")
      .eq("org_id", orgB);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("User A reads only their own Org A vault artifacts", async () => {
    const c = clientFor(userA.access_token);
    const { data, error } = await c.from("rfp_vault_artifacts").select("*");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((r) => r.org_id === orgA)).toBe(true);
  });

  it("User A cannot insert into Org B (RLS blocks cross-tenant write)", async () => {
    const c = clientFor(userA.access_token);
    const { error } = await c.from("rfp_vault_artifacts").insert({
      org_id: orgB,
      type: "partner_letter",
      title: "sneak-insert",
      body: "should be blocked",
    });

    expect(error).not.toBeNull();
  });

  it("User A cannot update Org B rows (RLS hides or blocks)", async () => {
    const c = clientFor(userA.access_token);
    const { error, data } = await c
      .from("rfp_vault_artifacts")
      .update({ title: "pwned" })
      .eq("org_id", orgB)
      .select();

    // RLS either returns an error OR returns empty (rows hidden from UPDATE target)
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  it("User B sees their own org in rfp_orgs but not Org A", async () => {
    const c = clientFor(userB.access_token);
    const { data, error } = await c.from("rfp_orgs").select("id, name");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.find((o) => o.id === orgB)).toBeTruthy();
    expect(data!.find((o) => o.id === orgA)).toBeUndefined();
  });

  it("rfp_opportunities is globally readable for authenticated users", async () => {
    // Seed a test opportunity via admin
    const oppResult = await admin
      .from("rfp_opportunities")
      .insert({
        source: "sam_gov",
        source_id: `test-opp-${testRunId}`,
        title: "Public test opportunity",
        deadline: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    if (oppResult.error) throw new Error(`Failed to seed opportunity: ${oppResult.error.message}`);
    const oppId = oppResult.data!.id;

    try {
      const cA = clientFor(userA.access_token);
      const cB = clientFor(userB.access_token);

      const rA = await cA.from("rfp_opportunities").select("*").eq("id", oppId).single();
      const rB = await cB.from("rfp_opportunities").select("*").eq("id", oppId).single();

      expect(rA.data?.id).toBe(oppId);
      expect(rB.data?.id).toBe(oppId);
    } finally {
      // Clean up the seeded opportunity
      await admin.from("rfp_opportunities").delete().eq("id", oppId);
    }
  });
});
