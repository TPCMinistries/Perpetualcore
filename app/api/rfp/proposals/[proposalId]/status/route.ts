/**
 * PATCH /api/rfp/proposals/[proposalId]/status
 *
 * Status transitions for a proposal. The text column on rfp_proposals
 * has no enum constraint; we constrain the writable set here.
 *
 * Allowed statuses: draft | submitted | won | lost | withdrawn
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
import { SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import {
  REVIEWER_FINDINGS_SECTION_TYPE,
  ReviewerResultSchema,
} from "@/lib/rfp/review/rubric";
import { buildSubmitReadinessGate } from "@/lib/rfp/submission/readiness-gate";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = [
  "draft",
  "submitted",
  "won",
  "lost",
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

interface SectionRow {
  section_type: string;
  content: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseComplianceMatrix(value: unknown): ComplianceMatrixArtifact | null {
  if (!isObject(value) || value.kind !== "compliance_matrix_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as ComplianceMatrixArtifact;
}

function parsePacketChecklist(value: unknown): PacketChecklistArtifact | null {
  if (!isObject(value) || value.kind !== "packet_checklist_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as PacketChecklistArtifact;
}

function countVerifyMarkers(sections: SectionRow[]): number {
  return sections.reduce((total, section) => {
    const matches = section.content?.match(/\[VERIFY:?\s*[^\]]+\]/g) ?? [];
    return total + matches.length;
  }, 0);
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
    const [sectionsRes, checksRes, tasksRes] = await Promise.all([
      admin
        .from("rfp_proposal_sections")
        .select("section_type, content")
        .eq("proposal_id", proposalId)
        .returns<SectionRow[]>(),
      admin
        .from("rfp_compliance_checks")
        .select("check_type, details_json")
        .eq("proposal_id", proposalId)
        .in("check_type", [
          "compliance_matrix_v1",
          "packet_checklist_v1",
        ])
        .order("created_at", { ascending: false })
        .returns<ComplianceCheckRow[]>(),
      admin
        .from("rfp_submission_tasks")
        .select("status, priority, title, owner_label")
        .eq("proposal_id", proposalId)
        .returns<Pick<SubmissionTaskRow, "status" | "priority" | "title" | "owner_label">[]>(),
    ]);

    if (sectionsRes.error || checksRes.error || tasksRes.error) {
      return NextResponse.json(
        {
          error: "submit_gate_load_failed",
          detail: (sectionsRes.error ?? checksRes.error ?? tasksRes.error)?.message.slice(0, 200),
        },
        { status: 500 },
      );
    }

    const checksByType = new Map<string, unknown>();
    for (const row of checksRes.data ?? []) {
      if (!checksByType.has(row.check_type)) {
        checksByType.set(row.check_type, row.details_json);
      }
    }
    const sections = sectionsRes.data ?? [];
    const canonicalSections = sections.filter((section) =>
      SECTION_TYPES.includes(section.section_type as SectionType),
    );
    const reviewerSection = sections.find(
      (section) => section.section_type === REVIEWER_FINDINGS_SECTION_TYPE,
    );
    let reviewerResult = null;
    if (reviewerSection?.content) {
      try {
        reviewerResult = ReviewerResultSchema.parse(JSON.parse(reviewerSection.content));
      } catch {
        reviewerResult = null;
      }
    }
    const gate = buildSubmitReadinessGate({
      sectionCount: canonicalSections.length,
      verifyMarkerCount: countVerifyMarkers(canonicalSections),
      complianceMatrix: parseComplianceMatrix(checksByType.get("compliance_matrix_v1")),
      packetChecklist: parsePacketChecklist(checksByType.get("packet_checklist_v1")),
      reviewerResult,
      tasks: tasksRes.data ?? [],
    });

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
