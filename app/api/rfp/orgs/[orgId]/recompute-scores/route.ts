/**
 * Phase 05-03 — Per-org recompute endpoint.
 *
 * POST /api/rfp/orgs/[orgId]/recompute-scores
 *
 * Called by Phase 6 (Capture Profile) when:
 *   - NAICS / capacity_keywords land for the first time
 *   - Voice fingerprint or capacity facts mutate
 *   - User adds/removes a vault doc that changes capacity_keywords
 *
 * Auth: request-scoped createClient() — caller's session cookie is used to
 * verify org membership via getOrgForUser. If the caller is not a member,
 * the RLS-keyed read returns null and we 404 (we deliberately don't
 * distinguish "not a member" from "doesn't exist" — prevents probing).
 *
 * Body (optional): { ai_summaries?: boolean } — defaults to false.
 *
 * Pattern: 202 Accepted + fire-and-forget recompute.
 *
 *   Next.js 14 in this codebase does NOT expose the `after()` API yet
 *   (Next 15+). We use the documented fire-and-forget alternative: kick
 *   off the recompute with `void` so the promise is intentionally not
 *   awaited, then return the 202 immediately. recomputeAllForOrg is
 *   idempotent (upserts keyed on (opp_id, org_id)), so a serverless
 *   timeout midway through is safe — the next call resumes cleanly.
 *
 * GET: 405 with Allow: POST.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import { recomputeAllForOrg } from "@/lib/rfp/scoring/recompute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed. Use POST." }),
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
): Promise<NextResponse> {
  const orgId = params.orgId;
  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "Invalid orgId" }, { status: 400 });
  }

  // Authn / authz — request-scoped client uses the caller's session cookie.
  // getOrgForUser reads through RLS, so non-members get null back.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOrgForUser(orgId);
  if (!org) {
    // Deliberately 404 (not 403) — prevents probing for valid org IDs.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Optional body — { ai_summaries?: boolean }
  let aiSummaries = false;
  try {
    const body = (await request.json().catch(() => null)) as {
      ai_summaries?: unknown;
    } | null;
    if (body && typeof body.ai_summaries === "boolean") {
      aiSummaries = body.ai_summaries;
    }
  } catch {
    // Empty body or invalid JSON → use defaults; not an error.
  }

  // Fire-and-forget. We deliberately do NOT await recomputeAllForOrg here.
  //
  // Why void: this Next.js version (14.x in package.json) doesn't ship the
  // stable `after()` runtime API yet. The recompute is idempotent — upserts
  // keyed on (opp_id, org_id) — so a serverless lifecycle interruption is
  // safe; the next call simply rescores. The endpoint returns 202 immediately
  // so the caller (Phase 6 capture profile flow) doesn't block on the work.
  //
  // We attach a `.catch` so the unhandled rejection doesn't show up in logs
  // as a bare promise rejection — it's expected that errors are logged
  // inside recomputeAllForOrg itself.
  void recomputeAllForOrg(orgId, { aiSummaries }).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `[recompute-scores] background recompute failed for org=${orgId}: ${msg}`
    );
  });

  return NextResponse.json(
    {
      ok: true,
      message: "Recompute scheduled",
      org_id: orgId,
      ai_summaries: aiSummaries,
    },
    { status: 202 }
  );
}
