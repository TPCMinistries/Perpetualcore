/**
 * Proposal view — read-only v1.
 *
 * Renders the five drafted sections from rfp_proposal_sections plus the
 * audit metadata from rfp_agent_sessions (model, tokens, cost). Honest
 * scaffolding: no inline editing yet, no version diffing, no reviewer
 * pass. Phase 6 (editing) and Phase 7 (reviewer + voice fingerprint) will
 * layer on top of this view.
 *
 * Auth: createClient → RLS-scoped. If the caller is not a member of the
 * org the proposal belongs to, every join returns null and we render the
 * "not found" state, matching the /api/rfp/opps/[id] privacy pattern.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import { ReviewButton } from "@/components/rfp/ReviewButton";
import { ReviewerFindingsPanel } from "@/components/rfp/ReviewerFindingsPanel";
import { ProposalSectionEditor } from "@/components/rfp/ProposalSectionEditor";
import { ProposalStatusControl } from "@/components/rfp/ProposalStatusControl";
import { CaptureReadinessButton } from "@/components/rfp/CaptureReadinessButton";
import { CaptureCommandCenter } from "@/components/rfp/CaptureCommandCenter";
import { ExportProposalButton } from "@/components/rfp/ExportProposalButton";
import { SubmissionReadinessPanel } from "@/components/rfp/SubmissionReadinessPanel";
import { SubmissionPlanPanel } from "@/components/rfp/SubmissionPlanPanel";
import { SubmissionWorkroom } from "@/components/rfp/SubmissionWorkroom";
import type { CitationChunk } from "@/components/rfp/MarkupRenderer";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";
import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import {
  REVIEWER_FINDINGS_SECTION_TYPE,
  ReviewerResultSchema,
  type ReviewerFinding,
  type ReviewerResult,
} from "@/lib/rfp/review/rubric";

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
  created_at: string;
  vault_chunks_used: unknown;
}

/**
 * Drafter persists vault_chunks_used as an ordered jsonb array. We treat
 * unknown shapes as "no citations available" rather than 500 the page —
 * resilient to schema changes and to proposals drafted before Wave 1.
 */
function parseVaultChunks(raw: unknown): CitationChunk[] {
  if (!Array.isArray(raw)) return [];
  const out: CitationChunk[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.doc_title !== "string" || typeof o.text_preview !== "string") {
      continue;
    }
    out.push({
      id: typeof o.id === "string" ? o.id : undefined,
      doc_id: typeof o.doc_id === "string" ? o.doc_id : undefined,
      doc_title: o.doc_title,
      doc_type: typeof o.doc_type === "string" ? o.doc_type : "document",
      chunk_index:
        typeof o.chunk_index === "number" ? o.chunk_index : undefined,
      text_preview: o.text_preview,
      similarity_score:
        typeof o.similarity_score === "number" ? o.similarity_score : undefined,
    });
  }
  return out;
}

interface SectionRow {
  id: string;
  section_type: string;
  content: string | null;
  version: number;
  last_drafted_by_agent_at: string | null;
}

interface AgentSessionRow {
  agent: string;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | string | null;
  created_at: string;
  session_id: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
  created_at: string;
}

/**
 * The drafter encodes voice_applied as a suffix on session_id:
 *   `<short_id>__voice=true` or `__voice=false`.
 * We parse it here rather than introduce a new column. Unknown when no
 * suffix is present (older draft rows pre Voice Fingerprint v1).
 */
function readVoiceApplied(session_id: string | null): boolean | null {
  if (!session_id) return null;
  // Accept both "__voice=X" (legacy) and "__voice=X__vault=N" (current).
  const m = session_id.match(/__voice=(true|false)(?:__|$)/);
  if (!m) return null;
  return m[1] === "true";
}

/**
 * Parse the vault chunks used count from a drafter session_id suffix.
 * Format: "<orig>__voice=<true|false>__vault=<N>". Returns 0 when no suffix
 * is present (pre Vault Grounding v1 rows).
 */
function readVaultChunksUsed(session_id: string | null): number {
  if (!session_id) return 0;
  const m = session_id.match(/__vault=(\d+)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fmtCost(c: number | string | null): string {
  if (c === null || c === undefined) return "—";
  const n = typeof c === "string" ? parseFloat(c) : c;
  if (Number.isNaN(n)) return "—";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBidNoBid(value: unknown): BidNoBidArtifact | null {
  if (!isObject(value) || value.kind !== "bid_no_bid_v1") return null;
  if (
    value.recommendation !== "pursue" &&
    value.recommendation !== "maybe" &&
    value.recommendation !== "pass"
  ) {
    return null;
  }
  if (typeof value.score !== "number") return null;
  return value as unknown as BidNoBidArtifact;
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
  return sections.reduce((count, section) => {
    const matches = section.content?.match(/\[VERIFY:/g) ?? [];
    return count + matches.length;
  }, 0);
}

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; proposalId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgId, proposalId } = await params;
  const sp = await searchParams;
  const pursuitStatus =
    sp.pursuit === "ready" || sp.pursuit === "partial" ? sp.pursuit : null;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, title, status, due_date, opp_id, created_at, vault_chunks_used")
    .eq("id", proposalId)
    .eq("org_id", orgId)
    .maybeSingle<ProposalRow>();
  if (!proposal) notFound();

  const vaultChunks = parseVaultChunks(proposal.vault_chunks_used);

  // Resolve caller's role on this org so we can gate the status control.
  // Owners and writers can mark submitted/won/lost/withdrawn; reviewers
  // and viewers see status read-only.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase
        .from("rfp_user_orgs")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const role = (membership as { role: string } | null)?.role ?? null;
  const canEditStatus = role === "owner" || role === "writer";
  const canEditSubmissionTasks =
    role === "owner" || role === "writer" || role === "reviewer";

  const { data: sections } = await supabase
    .from("rfp_proposal_sections")
    .select("id, section_type, content, version, last_drafted_by_agent_at")
    .eq("proposal_id", proposalId)
    .order("section_type")
    .returns<SectionRow[]>();

  // Pull the most recent DRAFTER session specifically — proposal_editor_v1
  // rows would otherwise win the limit(1) ordering after any human edit and
  // collapse the voice/vault metadata badges back to null.
  const { data: session } = await supabase
    .from("rfp_agent_sessions")
    .select("agent, model, tokens_in, tokens_out, cost_usd, created_at, session_id")
    .eq("proposal_id", proposalId)
    .eq("agent", "drafter_v1")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AgentSessionRow>();

  const { data: complianceRows } = await supabase
    .from("rfp_compliance_checks")
    .select("check_type, details_json, created_at")
    .eq("proposal_id", proposalId)
    .in("check_type", [
      "bid_no_bid_v1",
      "compliance_matrix_v1",
      "packet_checklist_v1",
    ])
    .order("created_at", { ascending: false })
    .returns<ComplianceCheckRow[]>();

  const { data: submissionTasks } = await supabase
    .from("rfp_submission_tasks")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("status")
    .order("priority")
    .order("created_at", { ascending: true })
    .returns<SubmissionTaskRow[]>();

  const checksByType = new Map<string, unknown>();
  for (const row of complianceRows ?? []) {
    if (!checksByType.has(row.check_type)) {
      checksByType.set(row.check_type, row.details_json);
    }
  }
  const bidNoBid = parseBidNoBid(checksByType.get("bid_no_bid_v1"));
  const complianceMatrix = parseComplianceMatrix(
    checksByType.get("compliance_matrix_v1"),
  );
  const packetChecklist = parsePacketChecklist(
    checksByType.get("packet_checklist_v1"),
  );

  const voiceApplied = readVoiceApplied(session?.session_id ?? null);
  const vaultChunksUsed = readVaultChunksUsed(session?.session_id ?? null);

  const sectionByType = new Map<string, SectionRow>(
    (sections ?? []).map((s) => [s.section_type, s]),
  );
  const visibleSections = (sections ?? []).filter((section) =>
    SECTION_TYPES.includes(section.section_type as SectionType),
  );
  const verifyMarkerCount = countVerifyMarkers(visibleSections);

  // Parse persisted reviewer findings, if any. We swallow malformed rows
  // rather than 500 the whole proposal view — the reviewer pass can always
  // be re-run from the button.
  let reviewerResult: ReviewerResult | null = null;
  const reviewerRow = sectionByType.get(REVIEWER_FINDINGS_SECTION_TYPE);
  if (reviewerRow?.content) {
    try {
      reviewerResult = ReviewerResultSchema.parse(JSON.parse(reviewerRow.content));
    } catch {
      reviewerResult = null;
    }
  }

  // Split findings into global vs per-section. Global findings keep their
  // home in the top ReviewerFindingsPanel (alongside the score + summary);
  // section-specific findings render inline under each section. This
  // eliminates the redundancy of showing the same finding twice.
  const findingsBySection = new Map<string, ReviewerFinding[]>();
  const globalFindings: ReviewerFinding[] = [];
  for (const f of reviewerResult?.findings ?? []) {
    if (f.section_type === "global") {
      globalFindings.push(f);
    } else {
      const arr = findingsBySection.get(f.section_type) ?? [];
      arr.push(f);
      findingsBySection.set(f.section_type, arr);
    }
  }
  const reviewerResultGlobalOnly: ReviewerResult | null = reviewerResult
    ? { ...reviewerResult, findings: globalFindings }
    : null;

  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href={`/org/${orgId}/discovery`}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
        >
          ← Discovery
        </Link>

        {/* Eyebrow + status pill */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Proposal · drafted {fmtDate(proposal.created_at)}
            {proposal.due_date ? ` · due ${fmtDate(proposal.due_date)}` : ""}
          </span>
          <ProposalStatusControl
            proposalId={proposalId}
            initialStatus={proposal.status}
            canEdit={canEditStatus}
          />
        </div>

        <h1
          className="mt-3 text-3xl leading-tight italic text-zinc-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {proposal.title}
        </h1>

        {pursuitStatus ? (
          <div
            className={`mt-6 rounded-md border p-4 ${
              pursuitStatus === "ready"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                pursuitStatus === "ready" ? "text-emerald-200" : "text-amber-200"
              }`}
            >
              {pursuitStatus === "ready"
                ? "Pursuit engine completed"
                : "Pursuit engine partially completed"}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {pursuitStatus === "ready"
                ? "The draft, reviewer pass, readiness matrix, and submission workroom were created from Discovery."
                : "The proposal workspace was created, but one automation step did not finish. Use the controls below to rerun reviewer, readiness, or workroom sync."}
            </p>
          </div>
        ) : null}

        {/* Honesty banner — voice + vault state reflect whether the drafter
            used the org's Voice Fingerprint v1 profile and/or any vault
            chunks. voiceApplied===null + vaultChunksUsed===0 means this
            draft predates the tracking suffixes. */}
        <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
            {[
              "First-pass draft",
              voiceApplied === true ? "voice-trained" : null,
              vaultChunksUsed > 0
                ? `vault-grounded (${vaultChunksUsed} chunks)`
                : null,
              "preview",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            {voiceApplied === true || vaultChunksUsed > 0 ? (
              <>
                This first pass applied{" "}
                {voiceApplied === true ? "your trained voice fingerprint" : null}
                {voiceApplied === true && vaultChunksUsed > 0 ? " and " : null}
                {vaultChunksUsed > 0
                  ? `${vaultChunksUsed} retrieved vault chunks as cited evidence`
                  : null}
                . Voice is system-prompt augmentation (not fine-tuning); vault
                grounding is single-shot retrieval (not multi-hop RAG). Claims
                drawn from a chunk should carry a [CITE: vault-N] marker. The
                reviewer pass below is a single Opus critique against the
                funder brief, not a rewriter. Every [VERIFY: …] marker that
                remains is still a placeholder you need to confirm.
              </>
            ) : (
              <>
                This is a plain first pass — no voice fingerprint and no
                vault grounding yet. Treat every [VERIFY: …] marker as a
                placeholder you need to confirm or replace. Train your voice
                in Settings → Voice and upload past docs in Settings → Vault
                to apply stylometric and grounding augmentation to future
                drafts. The reviewer pass below is a single Opus critique
                against the funder brief, not a rewriter.
              </>
            )}
          </p>
        </div>

        {/* Audit row */}
        {session ? (
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-md border border-zinc-900 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-400 sm:grid-cols-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Agent
              </div>
              <div className="mt-1 text-zinc-200">{session.agent}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Model
              </div>
              <div className="mt-1 text-zinc-200">{session.model ?? "—"}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Tokens
              </div>
              <div className="mt-1 text-zinc-200">
                {session.tokens_in ?? "—"} in · {session.tokens_out ?? "—"} out
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Cost
              </div>
              <div className="mt-1 text-zinc-200">{fmtCost(session.cost_usd)}</div>
            </div>
          </div>
        ) : null}

        {/* Reviewer pass action + findings */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <CaptureReadinessButton proposalId={proposalId} />
          <ReviewButton orgId={orgId} proposalId={proposalId} />
          <ExportProposalButton proposalId={proposalId} />
        </div>
        <SubmissionReadinessPanel
          bidNoBid={bidNoBid}
          complianceMatrix={complianceMatrix}
          packetChecklist={packetChecklist}
          reviewerResult={reviewerResult}
          verifyMarkerCount={verifyMarkerCount}
          sectionCount={visibleSections.length}
        />
        <SubmissionPlanPanel
          dueDate={proposal.due_date}
          complianceMatrix={complianceMatrix}
          packetChecklist={packetChecklist}
          reviewerResult={reviewerResult}
          verifyMarkerCount={verifyMarkerCount}
          sectionCount={visibleSections.length}
        />
        <SubmissionWorkroom
          proposalId={proposalId}
          initialTasks={submissionTasks ?? []}
          canEdit={canEditSubmissionTasks}
        />
        <CaptureCommandCenter
          proposalId={proposalId}
          bidNoBid={bidNoBid}
          complianceMatrix={complianceMatrix}
          packetChecklist={packetChecklist}
        />
        {reviewerResultGlobalOnly ? (
          <ReviewerFindingsPanel result={reviewerResultGlobalOnly} />
        ) : null}

        {/* Sections in canonical order */}
        <div className="mt-10 space-y-10">
          {SECTION_TYPES.map((type: SectionType) => {
            const sec = sectionByType.get(type);
            const spec = SECTION_SPECS[type];
            if (sec?.id && typeof sec.content === "string") {
              return (
                <ProposalSectionEditor
                  key={type}
                  proposalId={proposalId}
                  sectionId={sec.id}
                  sectionType={type}
                  sectionLabel={spec.label}
                  initialContent={sec.content}
                  initialVersion={sec.version}
                  lastDraftedByAgentAt={sec.last_drafted_by_agent_at}
                  vaultChunks={vaultChunks}
                  findings={findingsBySection.get(type) ?? []}
                />
              );
            }
            return (
              <section key={type}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  {spec.label}
                </h2>
                <p className="mt-3 italic text-zinc-500">
                  No content generated for this section.
                </p>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
