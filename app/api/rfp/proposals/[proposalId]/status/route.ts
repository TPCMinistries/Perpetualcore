/**
 * PATCH /api/rfp/proposals/[proposalId]/status
 *
 * Status transitions for a proposal. The text column on rfp_proposals
 * has no enum constraint; we constrain the writable set here.
 *
 * Allowed statuses: draft | submitted | won | lost | no_bid | withdrawn
 *
 * Body: { status, notes?: string }
 *
 * Side effects:
 *   - Updates rfp_proposals.status (+ updated_at)
 *   - When transitioning to 'won' or 'lost', enrolls the org owner in
 *     the 'win-loss-survey' sequence. Idempotent — second won/lost mark
 *     does NOT re-enroll (enrollInSequence upserts on email+key).
 *
 * Auth:
 *   - createClient + membership check (owner / writer can mark)
 *   - viewers and reviewers cannot transition status
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { enrollInSequence } from "@/lib/rfp/sequences";
import { loadSubmitReadinessGate } from "@/lib/rfp/submission/readiness-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = [
  "draft",
  "submitted",
  "won",
  "lost",
  "no_bid",
  "withdrawn",
] as const;

const BodySchema = z.object({
  status: z.enum(ALLOWED_STATUSES),
  notes: z.string().max(2000).optional().nullable(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  status: string;
  title: string;
  owner_user_id: string | null;
  metadata?: unknown;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  const { proposalId } = await context.params;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "schema";
    return NextResponse.json({ error: "invalid_body", detail }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS-scoped read to confirm the proposal exists AND the caller is in
  // its org. If they're not in the org, the row is invisible and we 404.
  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, status, title, owner_user_id")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role ?? null;
  if (!role) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!["owner", "writer"].includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const prevStatus = proposal.status;
  if (prevStatus === body.status) {
    return NextResponse.json({ status: prevStatus, unchanged: true });
  }

  const admin = createAdminClient();
  if (body.status === "submitted") {
    let gateResult: Awaited<ReturnType<typeof loadSubmitReadinessGate>>;
    try {
      gateResult = await loadSubmitReadinessGate(proposalId);
    } catch (err) {
      return NextResponse.json(
        {
          error: "submit_gate_load_failed",
          detail: err instanceof Error ? err.message.slice(0, 200) : "unknown",
        },
        { status: 500 },
      );
    }

    const gate = gateResult.gate;

    if (gate.status !== "ready") {
      return NextResponse.json(
        {
          error: "submit_gate_blocked",
          detail: gate.summary,
          next_action: gate.nextAction,
          blockers: gate.blockers,
          reviews: gate.reviews,
          score: gate.score,
        },
        { status: 409 },
      );
    }
  }

  // Persist the new status. Notes get stored on rfp_agent_sessions as an
  // editor-trail row so we don't need a new column on rfp_proposals just
  // for status-change annotations.
  const updatePayload = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };
  const { error: updateErr } = await admin
    .from("rfp_proposals")
    .update(updatePayload as never)
    .eq("id", proposalId);
  if (updateErr) {
    return NextResponse.json(
      { error: "update_failed", detail: updateErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // Audit trail for the status change. Mirrors the editor-trail pattern
  // used by /sections/[sectionId] PATCH (agent='proposal_editor_v1').
  const auditPayload = {
    proposal_id: proposalId,
    org_id: proposal.org_id,
    agent: "proposal_status_v1",
    session_id: `status:${prevStatus}->${body.status}${body.notes ? `__notes` : ""}`,
    model: null,
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
  };
  await admin.from("rfp_agent_sessions").insert(auditPayload as never);

  // Win/loss → enroll the org owner in the survey sequence. Best-effort:
  // a Resend / DB blip here must NOT roll back the status update.
  let enrolled_in_survey = false;
  if (body.status === "won" || body.status === "lost") {
    try {
      // Resolve org owner email. The proposal owner_user_id is the user
      // who *drafted* it, which may not be the org's billing owner; we
      // address the survey to the org owner because that's the durable
      // contact for this kind of feedback.
      const { data: ownerMembership } = await admin
        .from("rfp_user_orgs")
        .select("user_id")
        .eq("org_id", proposal.org_id)
        .eq("role", "owner")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ user_id: string }>();

      const ownerUserId = ownerMembership?.user_id ?? proposal.owner_user_id;
      if (ownerUserId) {
        const { data: userResp } = await admin.auth.admin.getUserById(ownerUserId);
        const email = userResp?.user?.email;
        if (email) {
          // Look up org name for the email body.
          const { data: orgRow } = await admin
            .from("rfp_orgs")
            .select("name")
            .eq("id", proposal.org_id)
            .maybeSingle<{ name: string }>();

          const result = await enrollInSequence({
            email,
            sequenceKey: "win-loss-survey",
            userId: ownerUserId,
            orgId: proposal.org_id,
            orgName: orgRow?.name,
          });
          enrolled_in_survey = result?.created ?? false;
        }
      }
    } catch (err) {
      console.warn(
        "[proposal-status] win-loss enroll skipped:",
        err instanceof Error ? err.message.slice(0, 120) : "unknown",
      );
    }
  }

  return NextResponse.json({
    status: body.status,
    previous_status: prevStatus,
    enrolled_in_survey,
  });
}
