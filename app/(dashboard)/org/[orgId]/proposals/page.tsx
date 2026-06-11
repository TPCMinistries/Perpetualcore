/**
 * /org/[orgId]/proposals — Proposals list index.
 *
 * Lists every proposal in the org, sorted by updated_at desc. Click-
 * through to the detail page. Adds a filterable status pill row at
 * the top: all / draft / submitted / won / lost / no-bid.
 *
 * Closes the dead-end where typing /org/[id]/proposals 404'd — users
 * had to navigate back through /discovery to find a proposal again.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DraftButton } from "@/components/rfp/DraftButton";
import { SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import {
  REVIEWER_FINDINGS_SECTION_TYPE,
  ReviewerResultSchema,
} from "@/lib/rfp/review/rubric";

export const dynamic = "force-dynamic";

type Status = "draft" | "submitted" | "won" | "lost" | "no_bid" | "withdrawn";
const STATUS_FILTERS: Array<Status | "all"> = [
  "all",
  "draft",
  "submitted",
  "won",
  "lost",
  "no_bid",
];

const STATUS_CHIP: Record<Status, string> = {
  draft: "border-zinc-300 bg-zinc-100 text-zinc-700",
  submitted: "border-amber-200 bg-amber-50 text-amber-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-rose-200 bg-rose-50 text-rose-700",
  no_bid: "border-zinc-300 bg-zinc-100 text-zinc-500",
  withdrawn: "border-zinc-300 bg-zinc-100 text-zinc-500",
};

function statusLabel(status: Status | "all"): string {
  if (status === "no_bid" || status === "withdrawn") return "no-bid";
  return status;
}

interface PageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string }>;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

interface ActivationOpportunityJoin {
  source: string;
  title: string;
  agency: string | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
}

interface ActivationOpportunityRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  triage_status: string | null;
  rfp_opportunities: ActivationOpportunityJoin | null;
}

interface SectionSummaryRow {
  proposal_id: string;
  section_type: string;
  content: string | null;
}

interface ComplianceSummaryRow {
  proposal_id: string;
  check_type: string;
  details_json: unknown;
  created_at: string;
}

interface SubmissionTaskSummaryRow {
  proposal_id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

interface ReadinessSummary {
  label: string;
  tone: "ready" | "warn" | "blocked" | "empty";
  details: string[];
}

interface TaskQueueSummary {
  open: number;
  blocked: number;
  critical: number;
  nextTask: string | null;
}

const READINESS_CHIP: Record<ReadinessSummary["tone"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  empty: "border-zinc-200 bg-zinc-100 text-zinc-500",
};

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMoney(value: number | null): string {
  if (!value || value <= 0) return "Amount not listed";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function coerceStatus(s: string | undefined): Status | "all" {
  if (!s) return "all";
  if (
    s === "draft" ||
    s === "submitted" ||
    s === "won" ||
    s === "lost" ||
    s === "no_bid" ||
    s === "withdrawn"
  ) {
    return s;
  }
  return "all";
}

function sourceLabel(source: string): string {
  return source.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function countVerifyMarkers(content: string | null): number {
  return content?.match(/\[VERIFY:/g)?.length ?? 0;
}

function readNumberField(value: unknown, key: string): number {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return 0;
  }
  const n = (value as Record<string, unknown>)[key];
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function countPacketGaps(value: unknown): { missing: number; needsReview: number } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { missing: 0, needsReview: 0 };
  }
  const items = (value as Record<string, unknown>).items;
  if (!Array.isArray(items)) return { missing: 0, needsReview: 0 };
  let missing = 0;
  let needsReview = 0;
  for (const item of items) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const status = (item as Record<string, unknown>).status;
    if (status === "missing") missing++;
    if (status === "partial" || status === "needs_review") needsReview++;
  }
  return { missing, needsReview };
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const due = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function summarizeTasks(
  proposalId: string,
  taskRows: SubmissionTaskSummaryRow[],
): TaskQueueSummary {
  const openTasks = taskRows
    .filter((task) => task.proposal_id === proposalId)
    .filter(
      (task) =>
        task.status === "open" ||
        task.status === "in_progress" ||
        task.status === "blocked",
    )
    .sort((a, b) => {
      if (a.status === "blocked" && b.status !== "blocked") return -1;
      if (b.status === "blocked" && a.status !== "blocked") return 1;
      const priorityDiff =
        (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return a.created_at.localeCompare(b.created_at);
    });

  return {
    open: openTasks.length,
    blocked: openTasks.filter((task) => task.status === "blocked").length,
    critical: openTasks.filter((task) => task.priority === "critical").length,
    nextTask: openTasks[0]?.title ?? null,
  };
}

function summarizeReadiness(
  proposalId: string,
  sectionRows: SectionSummaryRow[],
  complianceRows: ComplianceSummaryRow[],
): ReadinessSummary {
  const sections = sectionRows.filter((row) => row.proposal_id === proposalId);
  const canonicalSections = sections.filter((row) =>
    SECTION_TYPES.includes(row.section_type as SectionType),
  );
  const sectionCount = canonicalSections.length;
  const verifyCount = canonicalSections.reduce(
    (sum, row) => sum + countVerifyMarkers(row.content),
    0,
  );

  const checksByType = new Map<string, unknown>();
  for (const row of complianceRows) {
    if (row.proposal_id === proposalId && !checksByType.has(row.check_type)) {
      checksByType.set(row.check_type, row.details_json);
    }
  }
  const hasAllCaptureChecks =
    checksByType.has("bid_no_bid_v1") &&
    checksByType.has("compliance_matrix_v1") &&
    checksByType.has("packet_checklist_v1");
  const packetGaps = countPacketGaps(checksByType.get("packet_checklist_v1"));
  const complianceGaps =
    readNumberField(checksByType.get("compliance_matrix_v1"), "missing_count") +
    packetGaps.missing;
  const reviewNeeds =
    readNumberField(
      checksByType.get("compliance_matrix_v1"),
      "needs_review_count",
    ) + packetGaps.needsReview;

  const reviewerRow = sections.find(
    (row) => row.section_type === REVIEWER_FINDINGS_SECTION_TYPE,
  );
  let blockerCount = 0;
  if (reviewerRow?.content) {
    try {
      const result = ReviewerResultSchema.parse(JSON.parse(reviewerRow.content));
      blockerCount = result.findings.filter(
        (finding) =>
          finding.severity === "blocker" || finding.severity === "high",
      ).length;
    } catch {
      blockerCount = 0;
    }
  }

  const details = [
    `${sectionCount}/${SECTION_TYPES.length} sections`,
    verifyCount > 0 ? `${verifyCount} VERIFY` : "no VERIFY",
    hasAllCaptureChecks ? "capture checked" : "needs capture",
    blockerCount > 0 ? `${blockerCount} review flags` : "review clear",
  ];

  if (sectionCount === 0) {
    return { label: "Needs Draft", tone: "empty", details };
  }
  if (!hasAllCaptureChecks) {
    return { label: "Capture Needed", tone: "warn", details };
  }
  if (verifyCount > 0 || complianceGaps > 0 || blockerCount > 0) {
    return { label: "Blocked", tone: "blocked", details };
  }
  if (reviewNeeds > 0) {
    return { label: "Review Needed", tone: "warn", details };
  }
  return { label: "Ready", tone: "ready", details };
}

export default async function ProposalsListPage({
  params,
  searchParams,
}: PageProps) {
  const { orgId } = await params;
  const sp = await searchParams;
  const activeFilter = coerceStatus(sp.status);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Membership check — RLS would 404 anyway but we want a typed role
  // for UI affordances later.
  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!(membership as { role: string } | null)) notFound();

  let query = supabase
    .from("rfp_proposals")
    .select("id, title, status, due_date, updated_at, created_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (activeFilter === "no_bid" || activeFilter === "withdrawn") {
    query = query.in("status", ["no_bid", "withdrawn"]);
  } else if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: proposals } = await query.returns<ProposalRow[]>();
  const rows = proposals ?? [];
  const proposalIds = rows.map((row) => row.id);

  const { data: sectionSummaries } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_proposal_sections")
          .select("proposal_id, section_type, content")
          .in("proposal_id", proposalIds)
          .returns<SectionSummaryRow[]>()
      : { data: [] as SectionSummaryRow[] };

  const { data: complianceSummaries } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_compliance_checks")
          .select("proposal_id, check_type, details_json, created_at")
          .in("proposal_id", proposalIds)
          .in("check_type", [
            "bid_no_bid_v1",
            "compliance_matrix_v1",
            "packet_checklist_v1",
          ])
          .order("created_at", { ascending: false })
          .returns<ComplianceSummaryRow[]>()
      : { data: [] as ComplianceSummaryRow[] };

  const { data: submissionTaskSummaries } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_submission_tasks")
          .select("proposal_id, title, status, priority, due_date, created_at")
          .in("proposal_id", proposalIds)
          .returns<SubmissionTaskSummaryRow[]>()
      : { data: [] as SubmissionTaskSummaryRow[] };

  // Count per-status totals for the filter chips (small extra query;
  // a single GROUP BY would be more efficient but PostgREST doesn't
  // expose group-by cleanly in the JS client).
  const { data: allForCounts } = await supabase
    .from("rfp_proposals")
    .select("status")
    .eq("org_id", orgId)
    .returns<{ status: string }[]>();
  const counts: Record<string, number> = { all: allForCounts?.length ?? 0 };
  for (const r of allForCounts ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  counts.no_bid = (counts.no_bid ?? 0) + (counts.withdrawn ?? 0);

  const { data: activationMatches } =
    counts.all === 0
      ? await supabase
          .from("rfp_opp_matches")
          .select(
            "opp_id, fit_score, chips, summary, triage_status, rfp_opportunities ( source, title, agency, amount_max, deadline, brief )",
          )
          .eq("org_id", orgId)
          .order("fit_score", { ascending: false })
          .limit(3)
          .returns<ActivationOpportunityRow[]>()
      : { data: [] as ActivationOpportunityRow[] };
  const activationOpportunities = (activationMatches ?? []).filter(
    (row) => row.rfp_opportunities,
  );

  const readinessByProposal = new Map<string, ReadinessSummary>();
  const tasksByProposal = new Map<string, TaskQueueSummary>();
  for (const proposal of rows) {
    readinessByProposal.set(
      proposal.id,
      summarizeReadiness(
        proposal.id,
        sectionSummaries ?? [],
        complianceSummaries ?? [],
      ),
    );
    tasksByProposal.set(
      proposal.id,
      summarizeTasks(proposal.id, submissionTaskSummaries ?? []),
    );
  }
  const pipelineOpenTasks = [...tasksByProposal.values()].reduce(
    (sum, queue) => sum + queue.open,
    0,
  );
  const pipelineBlocked = rows.filter((proposal) => {
    const readiness = readinessByProposal.get(proposal.id);
    const queue = tasksByProposal.get(proposal.id);
    return readiness?.tone === "blocked" || (queue?.blocked ?? 0) > 0;
  }).length;
  const pipelineReady = rows.filter((proposal) => {
    const readiness = readinessByProposal.get(proposal.id);
    const queue = tasksByProposal.get(proposal.id);
    return readiness?.tone === "ready" && (queue?.open ?? 0) === 0;
  }).length;
  const dueSoon = rows.filter((proposal) => {
    const days = daysUntil(proposal.due_date);
    return days !== null && days >= 0 && days <= 14;
  }).length;

  return (
    <div className="relative">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href={`/org/${orgId}/discovery`}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-700"
        >
          ← Discovery
        </Link>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Proposals
        </div>
        <h1
          className="mt-3 text-3xl italic text-zinc-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {counts.all === 0
            ? "No proposals yet."
            : counts.all === 1
              ? "1 proposal"
              : `${counts.all} proposals`}
        </h1>

        {/* Status filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const isActive = s === activeFilter;
            const count = counts[s] ?? 0;
            const href =
              s === "all"
                ? `/org/${orgId}/proposals`
                : `/org/${orgId}/proposals?status=${s}`;
            return (
              <Link
                key={s}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                }`}
              >
                {statusLabel(s)}
                <span className="font-mono text-[9px] text-zinc-500">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {counts.all > 0 ? (
          <section className="mt-8 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
                Pipeline command
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
                Active pursuit health across the org. Use this to decide whether
                to clear blockers, move ready packets to submission, or start a
                new opportunity from Discovery.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              <PipelineMetric
                label="Ready to submit"
                value={String(pipelineReady)}
                tone={pipelineReady > 0 ? "ready" : "neutral"}
              />
              <PipelineMetric
                label="Blocked pursuits"
                value={String(pipelineBlocked)}
                tone={pipelineBlocked > 0 ? "danger" : "neutral"}
              />
              <PipelineMetric
                label="Open tasks"
                value={String(pipelineOpenTasks)}
                tone={pipelineOpenTasks > 0 ? "warn" : "ready"}
              />
              <PipelineMetric
                label="Due in 14d"
                value={String(dueSoon)}
                tone={dueSoon > 0 ? "warn" : "neutral"}
              />
            </div>
          </section>
        ) : null}

        {/* List */}
        {rows.length === 0 ? (
          <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="font-serif text-lg italic text-zinc-700">
              {activeFilter === "all"
                ? "No proposals yet."
                : `No proposals with status "${statusLabel(activeFilter)}".`}
            </p>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500">
              {activeFilter === "all" ? (
                <>
                  Start with one strong match below or open{" "}
                  <Link
                    href={`/org/${orgId}/discovery`}
                    className="text-emerald-700 underline"
                  >
                    Discovery
                  </Link>
                  . The workflow creates the draft, reviewer pass, readiness
                  matrix, and submission workroom in one run.
                </>
              ) : (
                <>
                  Try{" "}
                  <Link
                    href={`/org/${orgId}/proposals`}
                    className="text-emerald-700 underline"
                  >
                    all
                  </Link>{" "}
                  to see other statuses.
                </>
              )}
            </p>

            {activeFilter === "all" && activationOpportunities.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {activationOpportunities.map((match) => {
                  const opp = match.rfp_opportunities as ActivationOpportunityJoin;
                  return (
                    <article
                      key={match.opp_id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-700">
                              Fit {Math.round(match.fit_score)}
                            </span>
                            <span className="rounded-full border border-zinc-200 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                              {sourceLabel(opp.source)}
                            </span>
                            <span className="rounded-full border border-zinc-200 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                              {fmtMoney(opp.amount_max)}
                            </span>
                            <span className="rounded-full border border-zinc-200 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                              Due {fmtDate(opp.deadline)}
                            </span>
                          </div>
                          <h2 className="mt-3 text-base font-semibold text-zinc-900">
                            {opp.title}
                          </h2>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            {opp.agency ?? "Agency not listed"}
                          </p>
                          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-zinc-600">
                            {match.summary ?? opp.brief ?? "No summary available yet."}
                          </p>
                          {match.chips && match.chips.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {match.chips.slice(0, 5).map((chip) => (
                                <span
                                  key={chip}
                                  className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500"
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="w-full shrink-0 lg:w-64">
                          <DraftButton
                            orgId={orgId}
                            oppId={match.opp_id}
                            triageNote="Started from proposals activation."
                          />
                          <Link
                            href={`/org/${orgId}/pursuits/${match.opp_id}`}
                            className="mt-3 inline-flex text-[12px] text-zinc-500 underline hover:text-zinc-700"
                          >
                            Inspect opportunity first
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : activeFilter === "all" ? (
              <Link
                href={`/org/${orgId}/discovery`}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Open Discovery
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {rows.map((p) => {
              const status = (
                p.status === "draft" ||
                p.status === "submitted" ||
                p.status === "won" ||
                p.status === "lost" ||
                p.status === "no_bid" ||
                p.status === "withdrawn"
                  ? p.status
                  : "draft"
              ) as Status;
              const readiness = readinessByProposal.get(p.id) ?? {
                label: "Needs Draft",
                tone: "empty" as const,
                details: [],
              };
              const taskQueue = tasksByProposal.get(p.id) ?? {
                open: 0,
                blocked: 0,
                critical: 0,
                nextTask: null,
              };
              return (
                <li key={p.id}>
                  <Link
                    href={`/org/${orgId}/proposals/${p.id}`}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span
                      className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${STATUS_CHIP[status]}`}
                    >
                      {statusLabel(status)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] text-zinc-900">
                        {p.title}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {p.due_date ? `due ${fmtDate(p.due_date)} · ` : ""}
                        updated {fmtRelative(p.updated_at)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${READINESS_CHIP[readiness.tone]}`}
                      >
                        {readiness.label}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                        {readiness.details.join(" · ")}
                      </span>
                      {taskQueue.open > 0 ? (
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-700">
                          {taskQueue.open} task{taskQueue.open === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    {taskQueue.nextTask ? (
                      <div className="text-[12px] leading-relaxed text-zinc-500 sm:basis-full sm:pl-[72px]">
                        Next: {taskQueue.nextTask}
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function PipelineMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ready" | "warn" | "danger" | "neutral";
}) {
  const valueClass =
    tone === "ready"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-rose-700"
          : "text-zinc-900";
  return (
    <div className="border-b border-r border-zinc-200 px-5 py-4 last:border-r-0 lg:border-b-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
