/**
 * Deep Research endpoint.
 *
 * GET  /api/rfp/orgs/[orgId]/research
 *   → the org's research plan (vertical keys + labels) so the client can
 *     render progress and iterate. 409 when the capture profile is empty.
 *
 * POST /api/rfp/orgs/[orgId]/research   body: { vertical: string, final?: boolean }
 *   → runs ONE vertical synchronously (60–150s; maxDuration 300) and returns
 *     its VerticalRunResult. The client calls once per vertical, passing
 *     final=true on the last call so the rescore fires exactly once.
 *
 * Auth: same pattern as recompute-scores — request-scoped createClient() +
 * getOrgForUser; non-members get 404 (no membership probing).
 *
 * Cost: each POST is one guarded LLM session (Phase 17) — BudgetExceededError
 * maps to a 402 via budgetExceededResponse.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import {
  BudgetExceededError,
  budgetExceededResponse,
} from "@/lib/rfp/ai/guardrail";
import { loadResearchPlan, runDeepResearch } from "@/lib/rfp/research/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireMemberOrg(orgId: string) {
  // getOrgForUser is RLS-scoped to the session user — returns null for both
  // "not a member" and "doesn't exist" (no membership probing).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getOrgForUser(orgId);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const org = await requireMemberOrg(params.orgId);
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const loaded = await loadResearchPlan(params.orgId);
  if (!loaded) {
    return NextResponse.json(
      {
        error: "profile_incomplete",
        message:
          "Deep research needs a capture profile with capacity keywords. Complete your profile, then retry.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    verticals: loaded.plan.map((v) => ({ key: v.key, label: v.label })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const org = await requireMemberOrg(params.orgId);
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: { vertical?: string; final?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // empty body tolerated; validated below
  }
  if (!body.vertical || typeof body.vertical !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "body.vertical is required" },
      { status: 400 }
    );
  }

  try {
    const summary = await runDeepResearch(params.orgId, {
      verticalKey: body.vertical,
      skipRescore: body.final !== true,
    });
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const message = err instanceof Error ? err.message : "research_failed";
    if (message.startsWith("research_plan_unavailable")) {
      return NextResponse.json(
        { error: "profile_incomplete", message },
        { status: 409 }
      );
    }
    if (message.startsWith("unknown_vertical")) {
      return NextResponse.json({ error: "bad_request", message }, { status: 400 });
    }
    console.error("[api/research] run failed:", message.slice(0, 300));
    return NextResponse.json({ error: "research_failed" }, { status: 500 });
  }
}
