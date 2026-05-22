/**
 * RFP New-Endpoint Tenant Isolation Tests
 *
 * Companion to tests/rls/rfp-tenant-isolation.test.ts. That suite proves the
 * underlying RLS guarantees on the rfp_* tables. This suite focuses on the
 * route-handler auth gates shipped in this iteration:
 *
 *   1. PATCH /api/rfp/proposals/[proposalId]/status     (owner/writer)
 *   2. PATCH /api/rfp/orgs/[orgId]                       (owner-only)
 *   3. POST  /api/rfp/billing/checkout                   (owner-only, Stripe)
 *   4. POST  /api/rfp/orgs/[orgId]/vault/upload-file     (owner/writer)
 *   5. GET   /admin/rfp page                             (env-var allowlist)
 *
 * Setup mirrors the sibling RLS test:
 *   - Ephemeral users A + B via admin.auth.admin.createUser
 *   - Two orgs (A owner=userA + writer=userC; B owner=userB)
 *   - Real auth tokens; createClient() inside routes is mocked to return a
 *     user-scoped supabase client carrying that token. createAdminClient()
 *     returns the real admin client so the route's own writes go through.
 *
 * External services (Stripe checkout, OpenAI embeddings, PDF text extraction,
 * Resend email) are mocked at the SDK / lib boundary — no real API calls.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createClient as createSupaClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Load real env from .env.local (same pattern as sibling RLS test)
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envVars = loadEnvLocal();

const SUPABASE_URL =
  envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
      "and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

// Make the env values visible to the route modules at import time.
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY;

// ---------------------------------------------------------------------------
// SDK-boundary mocks. These MUST be hoisted above route imports.
// ---------------------------------------------------------------------------

// Hold the active token for the test in flight. Mocked createClient reads it.
let activeAccessToken: string | null = null;

vi.mock("@/lib/supabase/server", async () => {
  const { createClient: createSupa } = await import("@supabase/supabase-js");
  return {
    createClient: async () => {
      const headers: Record<string, string> = activeAccessToken
        ? { Authorization: `Bearer ${activeAccessToken}` }
        : {};
      return createSupa(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers },
        auth: { persistSession: false },
      });
    },
    createAdminClient: () =>
      createSupa(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      }),
  };
});

// Stripe — never hit the live API. The checkout helper depends on
// lib/stripe/client.ts (which throws at import without STRIPE_SECRET_KEY).
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
process.env.RFP_STRIPE_PRICE_PRO =
  process.env.RFP_STRIPE_PRICE_PRO || "price_mock_pro";
process.env.RFP_STRIPE_PRICE_AGENCY =
  process.env.RFP_STRIPE_PRICE_AGENCY || "price_mock_agency";

vi.mock("@/lib/rfp/billing", () => ({
  createRfpCheckoutSession: vi.fn(async () => ({
    url: "https://checkout.stripe.com/c/pay/cs_test_mock",
    session_id: "cs_test_mock",
  })),
}));

// Win-loss sequence enrollment writes to Resend; stub it.
vi.mock("@/lib/rfp/sequences", () => ({
  enrollInSequence: vi.fn(async () => ({ created: true })),
}));

// Vault upload pipeline (chunker → embedder → batch insert) — we only care
// about the route's auth gate. Replace the orchestrator with a stub.
vi.mock("@/lib/rfp/vault/upload", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rfp/vault/upload")>(
    "@/lib/rfp/vault/upload",
  );
  return {
    ...actual,
    uploadDocument: vi.fn(async (input: { orgId: string }) => ({
      doc_id: "doc_test_mock",
      chunk_count: 1,
      total_chars: 500,
      tokens: 100,
      cost_usd: 0,
      model: "text-embedding-3-small",
      orgId: input.orgId,
    })),
  };
});

// PDF extraction — the upload-file route imports `pdf-parse` dynamically.
// Returning a long enough text body lets the route reach the auth gate
// without needing a real PDF.
vi.mock("pdf-parse", () => ({
  default: vi.fn(async () => ({
    text:
      "This is a synthetic extracted PDF body for the tenant isolation test. " +
      "It needs to be at least MIN_DOC_BODY_CHARS long, which is 200 characters. " +
      "We are well beyond that threshold here, so the route will reach the auth check.",
  })),
}));

// ---------------------------------------------------------------------------
// Clients + state
// ---------------------------------------------------------------------------
const admin = createSupaClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let userA: { id: string; access_token: string; email: string };
let userB: { id: string; access_token: string; email: string };
let userC: { id: string; access_token: string; email: string }; // writer on org A
let orgA: string;
let orgB: string;
let proposalA: string;
const testRunId = Date.now();

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeAll(async () => {
  const emailA = `rls-new-a-${testRunId}@test.local`;
  const emailB = `rls-new-b-${testRunId}@test.local`;
  const emailC = `rls-new-c-${testRunId}@test.local`;
  const password = "test-password-12345";

  const aRes = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (aRes.error) throw new Error(`Create user A: ${aRes.error.message}`);
  const bRes = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
  });
  if (bRes.error) throw new Error(`Create user B: ${bRes.error.message}`);
  const cRes = await admin.auth.admin.createUser({
    email: emailC,
    password,
    email_confirm: true,
  });
  if (cRes.error) throw new Error(`Create user C: ${cRes.error.message}`);

  const anon = createSupaClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const sA = await anon.auth.signInWithPassword({ email: emailA, password });
  if (sA.error || !sA.data.session)
    throw new Error(`Sign in A: ${sA.error?.message}`);
  const sB = await anon.auth.signInWithPassword({ email: emailB, password });
  if (sB.error || !sB.data.session)
    throw new Error(`Sign in B: ${sB.error?.message}`);
  const sC = await anon.auth.signInWithPassword({ email: emailC, password });
  if (sC.error || !sC.data.session)
    throw new Error(`Sign in C: ${sC.error?.message}`);

  userA = {
    id: aRes.data.user!.id,
    access_token: sA.data.session.access_token,
    email: emailA,
  };
  userB = {
    id: bRes.data.user!.id,
    access_token: sB.data.session.access_token,
    email: emailB,
  };
  userC = {
    id: cRes.data.user!.id,
    access_token: sC.data.session.access_token,
    email: emailC,
  };

  const oA = await admin
    .from("rfp_orgs")
    .insert({ name: `New-Ep Org A ${testRunId}`, type: "nonprofit" })
    .select()
    .single();
  if (oA.error) throw new Error(`Create Org A: ${oA.error.message}`);
  const oB = await admin
    .from("rfp_orgs")
    .insert({ name: `New-Ep Org B ${testRunId}`, type: "forprofit" })
    .select()
    .single();
  if (oB.error) throw new Error(`Create Org B: ${oB.error.message}`);
  orgA = oA.data!.id;
  orgB = oB.data!.id;

  const mem = await admin.from("rfp_user_orgs").insert([
    { user_id: userA.id, org_id: orgA, role: "owner" },
    { user_id: userC.id, org_id: orgA, role: "writer" },
    { user_id: userB.id, org_id: orgB, role: "owner" },
  ]);
  if (mem.error) throw new Error(`Insert memberships: ${mem.error.message}`);

  // Seed a draft proposal on Org A for status-transition tests.
  const prop = await admin
    .from("rfp_proposals")
    .insert({
      org_id: orgA,
      title: `Test proposal ${testRunId}`,
      status: "draft",
      owner_user_id: userA.id,
    })
    .select()
    .single();
  if (prop.error) throw new Error(`Seed proposal: ${prop.error.message}`);
  proposalA = prop.data!.id;
}, 30000);

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (orgA) await admin.from("rfp_orgs").delete().eq("id", orgA);
  if (orgB) await admin.from("rfp_orgs").delete().eq("id", orgB);
  if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
  if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
  if (userC?.id) await admin.auth.admin.deleteUser(userC.id);
}, 30000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function withToken<T>(token: string, fn: () => Promise<T>): Promise<T> {
  activeAccessToken = token;
  return fn().finally(() => {
    activeAccessToken = null;
  });
}

async function callPatchStatus(
  proposalId: string,
  body: { status: string; notes?: string },
) {
  const { PATCH } = await import(
    "@/app/api/rfp/proposals/[proposalId]/status/route"
  );
  const req = new Request(`http://localhost/api/rfp/proposals/${proposalId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return PATCH(req, { params: Promise.resolve({ proposalId }) });
}

async function callPatchOrg(
  orgId: string,
  body: { name: string; type: string; naics: string[]; capacity_summary?: string | null },
) {
  const { PATCH } = await import("@/app/api/rfp/orgs/[orgId]/route");
  const req = new Request(`http://localhost/api/rfp/orgs/${orgId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return PATCH(req, { params: Promise.resolve({ orgId }) });
}

async function callBillingCheckout(body: { org_id: string; tier: string }) {
  const { POST } = await import("@/app/api/rfp/billing/checkout/route");
  const req = new Request("http://localhost/api/rfp/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

async function callVaultUploadFile(orgId: string) {
  const { POST } = await import(
    "@/app/api/rfp/orgs/[orgId]/vault/upload-file/route"
  );
  // Build a File-like object that:
  //   - passes `instanceof File` (it IS a real File)
  //   - has a working .arrayBuffer() in this test runtime
  //
  // We can't rely on vitest's File polyfill — its .arrayBuffer behavior
  // varies across environments, and the route calls it directly. Override
  // arrayBuffer on the File instance so the route's extractTextFromFile
  // works regardless of polyfill state.
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x0a]);
  const file = new File([bytes], "tenant-iso.pdf", { type: "application/pdf" });
  // Patch arrayBuffer if missing (vitest jsdom / undici inconsistencies).
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      configurable: true,
      writable: true,
    });
  }

  // The route does `const form = await req.formData()` then `form.get("file")`.
  // We bypass NextRequest's multipart parsing (which can lose the boundary in
  // vitest) by exposing a thin shim that returns the FormData directly. The
  // route's downstream auth logic is unchanged because it only depends on the
  // shape of FormData entries.
  const form = new FormData();
  form.set("file", file);
  form.set("doc_title", `tenant-iso-${testRunId}`);
  form.set("doc_type", "past_proposal");

  const fakeReq = {
    formData: async () => form,
  } as unknown as Parameters<typeof POST>[0];

  return POST(fakeReq, { params: Promise.resolve({ orgId }) });
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------
describe("RFP new-endpoint tenant isolation", () => {
  // -------------------------------------------------------------------------
  // 1. Proposal status transitions
  // -------------------------------------------------------------------------
  describe("PATCH /api/rfp/proposals/[proposalId]/status", () => {
    it("User A (owner of org A) can mark their own proposal submitted", async () => {
      // NOTE: We use 'submitted' here (not 'won') because the route's Zod enum
      // (draft|submitted|won|lost|withdrawn) is wider than the DB CHECK
      // constraint on rfp_proposals.status (draft|in_review|compliance|
      // submitted|awarded|lost). 'submitted' + 'lost' + 'draft' are the only
      // statuses currently in BOTH sets. See test below + report.
      const res = await withToken(userA.access_token, () =>
        callPatchStatus(proposalA, { status: "submitted" }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("submitted");
      expect(body.previous_status).toBe("draft");

      // Reset for the next assertions.
      await admin.from("rfp_proposals").update({ status: "draft" }).eq("id", proposalA);
    });

    it("User B (different org) gets 404 — proposal invisible via RLS", async () => {
      const res = await withToken(userB.access_token, () =>
        callPatchStatus(proposalA, { status: "submitted" }),
      );
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("not_found");

      // Confirm the proposal status was NOT mutated.
      const { data } = await admin
        .from("rfp_proposals")
        .select("status")
        .eq("id", proposalA)
        .single();
      expect(data?.status).toBe("draft");
    });

    it("KNOWN GAP: PATCH status='won' currently 500s due to DB CHECK constraint mismatch", async () => {
      // The route accepts 'won', 'withdrawn' (per its Zod enum) but the live
      // rfp_proposals.status CHECK constraint (set in 20260509_rfp_schema.sql)
      // only permits: draft, in_review, compliance, submitted, awarded, lost.
      //
      // Until a migration aligns these vocabularies, marking a proposal as
      // 'won' from the UI returns 500. This test pins the current behavior
      // so the failure mode is visible and the fix can flip the assertion.
      const res = await withToken(userA.access_token, () =>
        callPatchStatus(proposalA, { status: "won" }),
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("update_failed");
      expect(body.detail).toMatch(/rfp_proposals_status_check/);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Org edit (owner-only)
  // -------------------------------------------------------------------------
  describe("PATCH /api/rfp/orgs/[orgId]", () => {
    it("User A (owner of org A) can edit org A's name", async () => {
      const newName = `Renamed Org A ${testRunId}`;
      const res = await withToken(userA.access_token, () =>
        callPatchOrg(orgA, {
          name: newName,
          type: "nonprofit",
          naics: [],
          capacity_summary: null,
        }),
      );
      expect(res.status).toBe(200);

      const { data } = await admin
        .from("rfp_orgs")
        .select("name")
        .eq("id", orgA)
        .single();
      expect(data?.name).toBe(newName);
    });

    it("User B (not a member of org A) gets 404", async () => {
      const res = await withToken(userB.access_token, () =>
        callPatchOrg(orgA, {
          name: "PWNED",
          type: "forprofit",
          naics: [],
          capacity_summary: null,
        }),
      );
      expect(res.status).toBe(404);

      // Confirm the name was NOT changed.
      const { data } = await admin
        .from("rfp_orgs")
        .select("name")
        .eq("id", orgA)
        .single();
      expect(data?.name).not.toBe("PWNED");
    });

    it("User C (writer on org A, not owner) gets 403", async () => {
      const res = await withToken(userC.access_token, () =>
        callPatchOrg(orgA, {
          name: "Writer should not rename",
          type: "nonprofit",
          naics: [],
          capacity_summary: null,
        }),
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("forbidden");

      // Confirm the name was NOT changed.
      const { data } = await admin
        .from("rfp_orgs")
        .select("name")
        .eq("id", orgA)
        .single();
      expect(data?.name).not.toBe("Writer should not rename");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Billing checkout (owner-only, mocked Stripe)
  // -------------------------------------------------------------------------
  describe("POST /api/rfp/billing/checkout", () => {
    it("User A (owner of org A) gets a Stripe URL", async () => {
      const res = await withToken(userA.access_token, () =>
        callBillingCheckout({ org_id: orgA, tier: "pro" }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
      expect(body.session_id).toBeTruthy();
    });

    it("User B (not in org A) gets 404 — no membership", async () => {
      const res = await withToken(userB.access_token, () =>
        callBillingCheckout({ org_id: orgA, tier: "pro" }),
      );
      expect(res.status).toBe(404);
    });

    it("User C (writer on org A, not owner) gets 403", async () => {
      const res = await withToken(userC.access_token, () =>
        callBillingCheckout({ org_id: orgA, tier: "pro" }),
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("forbidden");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Vault file upload (owner/writer)
  // -------------------------------------------------------------------------
  describe("POST /api/rfp/orgs/[orgId]/vault/upload-file", () => {
    it("User C (writer on org A) succeeds", async () => {
      const res = await withToken(userC.access_token, () =>
        callVaultUploadFile(orgA),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.doc_id).toBe("doc_test_mock");
    });

    it("User B (different org) gets 404", async () => {
      const res = await withToken(userB.access_token, () =>
        callVaultUploadFile(orgA),
      );
      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // 5. /admin/rfp page — env-var allowlist
  // -------------------------------------------------------------------------
  describe("GET /admin/rfp page — RFP_PLATFORM_ADMIN_USER_IDS gate", () => {
    it("Non-allowlisted user returns null from getRfpPlatformAdmin (page calls notFound)", async () => {
      // Empty allowlist → fail closed regardless of who's signed in.
      const prev = process.env.RFP_PLATFORM_ADMIN_USER_IDS;
      process.env.RFP_PLATFORM_ADMIN_USER_IDS = "";

      const { getRfpPlatformAdmin } = await import("@/lib/rfp/admin");

      const result = await withToken(userA.access_token, async () =>
        getRfpPlatformAdmin(),
      );
      expect(result).toBeNull();

      process.env.RFP_PLATFORM_ADMIN_USER_IDS = prev;
    });

    it("Signed-in user NOT in the allowlist is rejected", async () => {
      const prev = process.env.RFP_PLATFORM_ADMIN_USER_IDS;
      // Put a random other user on the allowlist.
      process.env.RFP_PLATFORM_ADMIN_USER_IDS = "00000000-0000-0000-0000-000000000000";

      const { getRfpPlatformAdmin } = await import("@/lib/rfp/admin");

      const result = await withToken(userA.access_token, async () =>
        getRfpPlatformAdmin(),
      );
      expect(result).toBeNull();

      process.env.RFP_PLATFORM_ADMIN_USER_IDS = prev;
    });

    it("Signed-in user IN the allowlist is admitted", async () => {
      const prev = process.env.RFP_PLATFORM_ADMIN_USER_IDS;
      process.env.RFP_PLATFORM_ADMIN_USER_IDS = userA.id;

      const { getRfpPlatformAdmin } = await import("@/lib/rfp/admin");

      const result = await withToken(userA.access_token, async () =>
        getRfpPlatformAdmin(),
      );
      expect(result).not.toBeNull();
      expect(result?.user_id).toBe(userA.id);
      expect(result?.email).toBe(userA.email);

      process.env.RFP_PLATFORM_ADMIN_USER_IDS = prev;
    });

    it("Unauthenticated request is rejected even if allowlist is populated", async () => {
      const prev = process.env.RFP_PLATFORM_ADMIN_USER_IDS;
      process.env.RFP_PLATFORM_ADMIN_USER_IDS = userA.id;

      const { getRfpPlatformAdmin } = await import("@/lib/rfp/admin");

      // No token → mocked createClient returns an unauthenticated supabase
      // client; getUser() yields null and the gate returns null.
      activeAccessToken = null;
      const result = await getRfpPlatformAdmin();
      expect(result).toBeNull();

      process.env.RFP_PLATFORM_ADMIN_USER_IDS = prev;
    });
  });
});
