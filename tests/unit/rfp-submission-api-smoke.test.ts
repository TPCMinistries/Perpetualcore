import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubmitReadinessGate } from "@/lib/rfp/submission/readiness-gate";

const proposalId = "11111111-1111-4111-8111-111111111111";
const orgId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";

let authenticated = true;
let role = "owner";
let gate: SubmitReadinessGate;

function makeQuery(table: string) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => {
      if (table === "rfp_proposals") {
        return {
          data: {
            id: proposalId,
            org_id: orgId,
            status: "draft",
            title: "Test Proposal",
            owner_user_id: userId,
          },
          error: null,
        };
      }
      if (table === "rfp_user_orgs") {
        return { data: { role }, error: null };
      }
      return { data: null, error: null };
    }),
    update: vi.fn(() => query),
    insert: vi.fn(async () => ({ data: null, error: null })),
  };
  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: authenticated ? { id: userId } : null },
        error: null,
      })),
    },
    from: vi.fn((table: string) => makeQuery(table)),
  })),
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => makeQuery(table)),
  })),
}));

vi.mock("@/lib/rfp/submission/readiness-source", () => ({
  loadSubmitReadinessGate: vi.fn(async () => ({
    generatedAt: "2026-06-05T00:00:00.000Z",
    gate,
  })),
}));

vi.mock("@/lib/rfp/sequences", () => ({
  enrollInSequence: vi.fn(async () => ({ created: false })),
}));

function readyGate(): SubmitReadinessGate {
  return {
    status: "ready",
    score: 100,
    label: "Ready to submit",
    summary: "All deterministic submission gates are clear.",
    nextAction: "Export DOCX, compliance CSV, packet CSV, and submission manifest.",
    blockers: [],
    reviews: [],
    completed: [],
    metrics: {
      blockers: 0,
      reviews: 0,
      completed: 7,
      openTasks: 0,
      criticalTasks: 0,
      missingCompliance: 0,
      missingPacketItems: 0,
      reviewerBlockers: 0,
    },
  };
}

describe("RFP submission API smoke", () => {
  beforeEach(() => {
    authenticated = true;
    role = "owner";
    gate = readyGate();
    vi.clearAllMocks();
  });

  it("returns submit readiness for authenticated org members", async () => {
    const { GET } = await import(
      "@/app/api/rfp/proposals/[proposalId]/submit-readiness/route"
    );

    const res = await GET(new Request("https://test.local"), {
      params: Promise.resolve({ proposalId }),
    });
    const body = (await res.json()) as {
      proposal_id: string;
      can_submit: boolean;
      gate: { status: string; score: number };
    };

    expect(res.status).toBe(200);
    expect(body.proposal_id).toBe(proposalId);
    expect(body.can_submit).toBe(true);
    expect(body.gate).toEqual(expect.objectContaining({ status: "ready", score: 100 }));
  });

  it("blocks submit status when the readiness gate has blockers", async () => {
    gate = {
      ...readyGate(),
      status: "not_ready",
      score: 40,
      label: "Not ready to submit",
      summary: "1 blocker remains before submission.",
      nextAction: "Compliance matrix: 1 missing, 0 needs review.",
      blockers: [
        {
          key: "compliance",
          label: "Compliance matrix",
          severity: "blocker",
          detail: "1 missing, 0 needs review.",
          owner: "Compliance reviewer",
        },
      ],
    };
    const { PATCH } = await import(
      "@/app/api/rfp/proposals/[proposalId]/status/route"
    );

    const res = await PATCH(
      new Request("https://test.local", {
        method: "PATCH",
        body: JSON.stringify({ status: "submitted" }),
      }),
      { params: Promise.resolve({ proposalId }) },
    );
    const body = (await res.json()) as {
      error: string;
      next_action: string;
      score: number;
    };

    expect(res.status).toBe(409);
    expect(body.error).toBe("submit_gate_blocked");
    expect(body.next_action).toContain("Compliance matrix");
    expect(body.score).toBe(40);
  });

  it("rejects signed-out bundle and audit exports", async () => {
    authenticated = false;
    const [{ GET: bundleGet }, { GET: auditGet }] = await Promise.all([
      import("@/app/api/rfp/proposals/[proposalId]/export/bundle-zip/route"),
      import("@/app/api/rfp/proposals/[proposalId]/export/audit-trail-csv/route"),
    ]);

    const [bundleRes, auditRes] = await Promise.all([
      bundleGet(new Request("https://test.local"), {
        params: Promise.resolve({ proposalId }),
      }),
      auditGet(new Request("https://test.local"), {
        params: Promise.resolve({ proposalId }),
      }),
    ]);

    expect(bundleRes.status).toBe(401);
    expect(auditRes.status).toBe(401);
  });
});
