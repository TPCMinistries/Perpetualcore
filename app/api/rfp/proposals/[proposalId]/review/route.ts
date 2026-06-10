/**
 * POST /api/rfp/proposals/:proposalId/review
 *
 * Run the Reviewer Agent v1 — a single Opus pass that reads the drafted
 * sections against the funder's opportunity brief and persists structured
 * findings.
 *
 * Auth + RLS:
 *   - createClient() to authenticate the caller via cookies and verify
 *     membership in the proposal's org via rfp_user_orgs (RLS-enforced read).
 *   - Reviewer-pass is treated as read-only critique, so role membership of
 *     owner / writer / reviewer is allowed. (The draft endpoint requires
 *     owner / writer because it WRITES new sections; here we only insert a
 *     single findings row that does not mutate authored content.)
 *   - createAdminClient() for the actual writes after authorization passes,
 *     per CLAUDE.md "Background/server operations: ALWAYS use createAdminClient()."
 *
 * Side effects:
 *   - INSERT into rfp_proposal_sections with section_type='reviewer_findings_v1'
 *     and content = JSON.stringify(ReviewerResult). The proposal page filters
 *     this section_type out of the canonical render loop.
 *   - If a prior findings row exists for the proposal, we DELETE it before
 *     inserting the new one so re-running the reviewer doesn't accumulate
 *     stale critiques. Stack of historical reviews is a Phase 2 question.
 *   - INSERT into rfp_agent_sessions with agent='reviewer_v1' carrying
 *     model/tokens/cost. Encrypted prompt/response is Phase 7 of the broader
 *     RFP roadmap — same gate as the drafter.
 *
 * Returns: ReviewerResult on success, { error, detail? } on failure.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateReview } from "@/lib/rfp/review/generate";
import {
  MAX_PERSISTED_BYTES,
  REVIEWER_AGENT,
  REVIEWER_FINDINGS_SECTION_TYPE,
  type ReviewerResult,
  type RubricCriterion,
} from "@/lib/rfp/review/rubric";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["owner", "writer", "reviewer"]);

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  opp_id: string | null;
}

interface OppRow {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

interface SectionRow {
  section_type: string;
  content: string | null;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  let params: z.infer<typeof ParamsSchema>;
  try {
    params = ParamsSchema.parse(await ctx.params);
  } catch {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-scoped read of the proposal. If the caller can't see it, treat as 404
  // (privacy-preserving — matches the /api/rfp/opps/[id] pattern).
  const { data: proposal, error: pErr } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, opp_id")
    .eq("id", params.proposalId)
    .maybeSingle<ProposalRow>();
  if (pErr || !proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Role check — reviewer is allowed here even though it's not on the drafter
  // endpoint. Critique-without-authorship is a deliberate separate gate.
  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .maybeSingle<{ role: string }>();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ALLOWED_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Authorization passed — switch to admin client for the multi-table write.
  const admin = createAdminClient();

  // Load the linked opportunity. If the proposal isn't tied to one (manual
  // upload flow, future), bail with a clear error rather than letting the
  // reviewer hallucinate funder priorities.
  if (!proposal.opp_id) {
    return NextResponse.json(
      {
        error: "no_linked_opportunity",
        detail:
          "Reviewer v1 needs the opportunity brief to score against the rubric.",
      },
      { status: 422 },
    );
  }
  const { data: opp, error: oppErr } = await admin
    .from("rfp_opportunities")
    .select("title, agency, brief, amount_min, amount_max, deadline, url")
    .eq("id", proposal.opp_id)
    .maybeSingle<OppRow>();
  if (oppErr || !opp) {
    return NextResponse.json({ error: "opp_not_found" }, { status: 404 });
  }

  // Phase 19-02: Load rubric criteria for this opp (if any).
  // Criteria extraction only happens at package upload (solicitation_mode) — we
  // never re-extract here. Zero criteria = v1 generic-rubric behavior.
  const { data: rawCriteria } = await admin
    .from("rfp_rubric_criteria" as unknown as "rfp_opportunities")
    .select("id, section_ref, criterion_text, max_points, weight")
    .eq("opp_id", proposal.opp_id)
    .order("created_at");
  const criteriaRows = (rawCriteria ?? []) as unknown as Array<{
    id: string;
    section_ref: string;
    criterion_text: string;
    max_points: number | null;
    weight: number | null;
  }>;
  const rubricCriteria: RubricCriterion[] = criteriaRows.map((r) => ({
    id: r.id,
    section_ref: r.section_ref,
    criterion_text: r.criterion_text,
    max_points: r.max_points,
    weight: r.weight,
  }));

  // Load drafted sections. Filter out any prior reviewer rows so the model
  // doesn't critique its own past output.
  const { data: rawSections, error: sErr } = await admin
    .from("rfp_proposal_sections")
    .select("section_type, content")
    .eq("proposal_id", proposal.id)
    .returns<SectionRow[]>();
  if (sErr) {
    return NextResponse.json(
      { error: "sections_load_failed", detail: sErr.message.slice(0, 200) },
      { status: 500 },
    );
  }
  const draftedSections = (rawSections ?? [])
    .filter(
      (r) =>
        r.section_type !== REVIEWER_FINDINGS_SECTION_TYPE &&
        typeof r.content === "string" &&
        r.content.length > 0,
    )
    .map((r) => ({ section_type: r.section_type, content: r.content as string }));

  if (draftedSections.length === 0) {
    return NextResponse.json(
      {
        error: "no_draft_to_review",
        detail: "Proposal has no drafted sections yet — run the drafter first.",
      },
      { status: 422 },
    );
  }

  // Call Opus — gated by per-tenant AI budget (Phase 17).
  // guardedLLMCall runs checkBudget() BEFORE generateReview fires, so an
  // over-budget org never reaches the model. recordCost() is called by the
  // wrapper after the review returns; the inline rfp_agent_sessions insert
  // that used to live below has been removed to avoid double-counting.
  //
  // We do NOT spread the ReviewerResult into the returned meta object to keep
  // the response shape unchanged. Instead the meta is built from scalar fields
  // only; the full `result` is captured in the outer `review` variable.
  let review: ReviewerResult;
  try {
    let capturedReview: ReviewerResult | undefined;
    await guardedLLMCall(proposal.org_id, async () => {
      const result = await generateReview({
        opportunity: opp,
        sections: draftedSections,
        rubric_criteria: rubricCriteria.length > 0 ? rubricCriteria : undefined,
      });
      capturedReview = result;
      return {
        agent: REVIEWER_AGENT,
        model: result.model,
        tokensIn: result.tokens_in,
        tokensOut: result.tokens_out,
        costUsd: result.cost_usd,
        sessionId: result.session_id,
        proposalId: proposal.id,
      };
    });
    if (!capturedReview) {
      throw new Error("review result was not captured");
    }
    review = capturedReview;
  } catch (err) {
    if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "review_failed", detail: msg.slice(0, 200) },
      { status: 502 },
    );
  }

  // Persist findings as a single rfp_proposal_sections row. Replace any prior
  // findings row for this proposal so re-runs don't accumulate.
  const payload = JSON.stringify(review);
  if (Buffer.byteLength(payload, "utf8") > MAX_PERSISTED_BYTES) {
    return NextResponse.json(
      {
        error: "findings_too_large",
        detail: `Findings exceed ${MAX_PERSISTED_BYTES} bytes; tighten the prompt or cap findings.`,
      },
      { status: 500 },
    );
  }

  const { error: delErr } = await admin
    .from("rfp_proposal_sections")
    .delete()
    .eq("proposal_id", proposal.id)
    .eq("section_type", REVIEWER_FINDINGS_SECTION_TYPE);
  if (delErr) {
    return NextResponse.json(
      { error: "findings_clear_failed", detail: delErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const { error: insErr } = await admin.from("rfp_proposal_sections").insert({
    proposal_id: proposal.id,
    section_type: REVIEWER_FINDINGS_SECTION_TYPE,
    content: payload,
    version: 1,
    last_drafted_by_agent_at: new Date().toISOString(),
  });
  if (insErr) {
    return NextResponse.json(
      { error: "findings_insert_failed", detail: insErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // The rfp_agent_sessions audit row is recorded by guardedLLMCall → recordCost
  // (wrapper owns the single insert). No inline insert here.

  return NextResponse.json({ ...review, rubric_criteria_count: rubricCriteria.length });
}
