/**
 * Rich Profile Builder endpoint.
 *
 * POST /api/rfp/orgs/[orgId]/research/profile
 *   → runs ONE agentic web-search session to upgrade the org's starter
 *     capture profile into a rich one (mission, programs, past funders,
 *     capacity narrative). Synchronous; can take up to ~2 minutes.
 *
 * Auth: same pattern as the deep-research endpoint — request-scoped
 * createClient() + getOrgForUser; non-members get 404 (no membership
 * probing).
 *
 * Cost: one guarded LLM session (Phase 17) — BudgetExceededError maps to a
 * 402 via budgetExceededResponse.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import {
  BudgetExceededError,
  budgetExceededResponse,
} from "@/lib/rfp/ai/guardrail";
import { buildRichProfile } from "@/lib/rfp/research/profile-builder";

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

export async function POST(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const org = await requireMemberOrg(params.orgId);
  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const result = await buildRichProfile(params.orgId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const message = err instanceof Error ? err.message : "profile_build_failed";
    console.error("[api/research/profile] build failed:", message.slice(0, 300));
    return NextResponse.json({ error: "profile_build_failed" }, { status: 500 });
  }
}
