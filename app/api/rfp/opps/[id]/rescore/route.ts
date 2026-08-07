/**
 * POST /api/rfp/opps/[id]/rescore?org_id=<uuid>
 *   or POST with body { org_id: "<uuid>" }
 *
 * On-demand v2 re-score for a single (opp, org) pair. Runs the full Phase 18
 * vault-grounded scoring path (vault retrieval + disqualifiers + dimensions +
 * cited summary) for the caller's org and persists the updated match row +
 * fit evidence.
 *
 * This is the demo path: show a user their first vault-grounded score
 * immediately without waiting for the next cron run.
 *
 * Auth / authz:
 *   - createClient() to authenticate the caller (getUser).
 *   - Membership check via RLS-scoped rfp_user_orgs read: caller must be
 *     a member of org_id. Returns 404 on non-member (same shape as GET route —
 *     attackers can't probe for valid (opp, org) combinations).
 *   - createAdminClient() for all scoring writes (cron-level writes need
 *     service_role per CLAUDE.md rule: background/server operations ALWAYS use
 *     createAdminClient). TRUST-02 convention: no service-role in the user-auth
 *     gate (only in the write path AFTER auth).
 *
 * Budget:
 *   - On BudgetExceededError, returns 402 via budgetExceededResponse().
 *   - Caller can retry when budget is refreshed or increased.
 *
 * Response (200):
 *   {
 *     opp_id, org_id, fit_score,
 *     dimensions: { mission_fit, eligibility, track_record, capacity, funder_relationship },
 *     disqualifiers: DisqualifierFlag[],
 *     vault_hit_count,
 *     cited_artifact_ids,
 *     summary
 *   }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  loadLatestProfile,
  loadExistingScoredVersions,
  scoreOnePairV2,
  type OppRowExtended,
} from '@/lib/rfp/scoring/recompute';
import { upsertFitEvidence } from '@/lib/rfp/scoring/evidence-store';
import {
  BudgetExceededError,
  budgetExceededResponse,
} from '@/lib/rfp/ai/guardrail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  org_id: z.string().uuid(),
});

/** Helper to parse org_id from body OR query string. */
async function resolveOrgId(
  req: Request
): Promise<{ org_id: string } | { error: string; status: number }> {
  // Try body first (POST body)
  try {
    const body = await req.clone().json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (parsed.success) return { org_id: parsed.data.org_id };
  } catch {
    // fall through to query
  }
  // Fallback: query param
  const url = new URL(req.url);
  const parsed = BodySchema.safeParse({ org_id: url.searchParams.get('org_id') ?? '' });
  if (parsed.success) return { org_id: parsed.data.org_id };
  return { error: 'missing_org_id', status: 400 };
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: oppId } = await context.params;

  // Validate path param
  if (!/^[0-9a-f-]{36}$/i.test(oppId)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  // ── Auth gate (createClient — NOT admin) ────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // ── Resolve org_id from body or query ──────────────────────────────────────
  const orgIdResult = await resolveOrgId(req);
  if ('error' in orgIdResult) {
    return NextResponse.json(
      { error: orgIdResult.error, detail: 'org_id (uuid) is required' },
      { status: orgIdResult.status }
    );
  }
  const { org_id: orgId } = orgIdResult;

  // ── Membership check via RLS-scoped read ───────────────────────────────────
  // 404 (not 403) on non-member: consistent with GET route — no enumeration attack.
  const { data: membership, error: memErr } = await supabase
    .from('rfp_user_orgs')
    .select('org_id, role')
    .eq('org_id', orgId)
    .maybeSingle();

  if (memErr || !membership) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // ── Load opp + org using admin client (scoring writes need service_role) ───
  const admin = createAdminClient() as unknown as { from: (t: string) => any };

  const [{ data: oppData, error: oppErr }, org] = await Promise.all([
    admin
      .from('rfp_opportunities')
      .select(
        'id, source, title, agency, amount_min, amount_max, deadline, brief, keywords, geo, set_aside_code, eligibility_types, naics_codes'
      )
      .eq('id', oppId)
      .maybeSingle(),
    loadLatestProfile(orgId),
  ]);

  if (oppErr || !oppData) {
    return NextResponse.json({ error: 'opportunity_not_found' }, { status: 404 });
  }

  // Normalize keyword/array fields and cast to the scorer input type.
  const oppRaw = oppData as Record<string, unknown>;
  const opp: OppRowExtended = {
    id: oppRaw.id as string,
    source: oppRaw.source as string,
    title: oppRaw.title as string,
    agency: (oppRaw.agency as string | null) ?? null,
    amount_min: (oppRaw.amount_min as number | null) ?? null,
    amount_max: (oppRaw.amount_max as number | null) ?? null,
    deadline: (oppRaw.deadline as string | null) ?? null,
    brief: (oppRaw.brief as string | null) ?? null,
    keywords: Array.isArray(oppRaw.keywords) ? (oppRaw.keywords as string[]) : [],
    geo: (oppRaw.geo as string | null) ?? null,
    set_aside_code: (oppRaw.set_aside_code as string | null) ?? null,
    eligibility_types: Array.isArray(oppRaw.eligibility_types)
      ? (oppRaw.eligibility_types as string[])
      : null,
    naics_codes: Array.isArray(oppRaw.naics_codes)
      ? (oppRaw.naics_codes as string[])
      : null,
  };

  // Determine next scored_version for this pair
  const existing = await loadExistingScoredVersions([orgId], [oppId]);
  const prev = existing.get(`${oppId}::${orgId}`);
  const scoredVersion = (prev?.scored_version ?? 0) + 1;

  // ── Score with Phase 18 v2 path (budget-guarded) ───────────────────────────
  try {
    const result = await scoreOnePairV2(opp, org, scoredVersion);

    // Upsert match row
    const matchRow = {
      ...result.row,
      score_breakdown: result.row.score_breakdown as unknown as never,
    };
    const { error: upsertErr } = await (
      admin
        .from('rfp_opp_matches')
        .upsert([matchRow], { onConflict: 'opp_id,org_id', ignoreDuplicates: false })
        .select('opp_id')
    ) as { error: { message: string } | null };

    if (upsertErr) {
      console.error('[/rescore] match upsert failed:', upsertErr.message);
      return NextResponse.json({ error: 'upsert_failed' }, { status: 500 });
    }

    // Upsert evidence rows (non-fatal on error)
    if (result.evidenceRows.length > 0) {
      const { error: evErr } = await upsertFitEvidence(result.evidenceRows);
      if (evErr) {
        console.warn('[/rescore] evidence upsert failed (non-fatal):', evErr);
      }
    }

    // Return the fresh v2 score for optimistic UI refresh
    const bd = result.row.score_breakdown;
    return NextResponse.json({
      opp_id: oppId,
      org_id: orgId,
      fit_score: result.row.fit_score,
      scored_version: scoredVersion,
      dimensions: bd.dimensions,
      disqualifiers: bd.disqualifiers,
      vault_hit_count: bd.vault_hit_count,
      scored_at_v2: bd.scored_at_v2,
      cited_artifact_ids: result.evidenceRows.map((r) => r.artifact_doc_id),
      summary: result.row.summary,
      skipped_budget: result.skippedBudget,
    });
  } catch (err: unknown) {
    if (err instanceof BudgetExceededError) {
      return budgetExceededResponse(err);
    }
    console.error('[/rescore] unexpected error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'scoring_failed' }, { status: 500 });
  }
}
