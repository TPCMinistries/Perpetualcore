/**
 * Funder Dossier endpoint.
 *
 * GET  /api/rfp/orgs/[orgId]/funder-dossier?opportunityId=...
 *   → whatever dossier is currently on file for that opportunity's funder,
 *     or { dossier: null }. Read-only — never creates rows, never spends budget.
 *
 * POST /api/rfp/orgs/[orgId]/funder-dossier   body: { opportunityId: string, force?: boolean }
 *   → builds (or returns the cached) dossier for that opportunity's funder.
 *     Runs one agentic web-search session when the cache is stale/absent/forced.
 *
 * Auth: same pattern as the research route — request-scoped createClient() +
 * getOrgForUser; non-members get 404 (no membership probing).
 *
 * Cost: POST may run one guarded LLM session (Phase 17) — BudgetExceededError
 * maps to a 402 via budgetExceededResponse.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import { BudgetExceededError, budgetExceededResponse } from "@/lib/rfp/ai/guardrail";
import { buildFunderDossier, getFunderDossierStatus } from "@/lib/rfp/research/funder-dossier";

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
  req: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const org = await requireMemberOrg(params.orgId);
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const opportunityId = req.nextUrl.searchParams.get("opportunityId");
  if (!opportunityId) {
    return NextResponse.json(
      { error: "bad_request", message: "opportunityId query param is required" },
      { status: 400 }
    );
  }

  const status = await getFunderDossierStatus(params.orgId, opportunityId);
  return NextResponse.json({ dossier: status.dossier });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const org = await requireMemberOrg(params.orgId);
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: { opportunityId?: string; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // empty body tolerated; validated below
  }
  if (!body.opportunityId || typeof body.opportunityId !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "body.opportunityId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await buildFunderDossier(params.orgId, body.opportunityId, {
      force: body.force === true,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const message = err instanceof Error ? err.message : "funder_dossier_failed";
    console.error("[api/funder-dossier] run failed:", message.slice(0, 300));
    return NextResponse.json({ error: "funder_dossier_failed" }, { status: 500 });
  }
}
