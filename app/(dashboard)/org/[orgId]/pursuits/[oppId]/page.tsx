import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  DollarSign,
  ExternalLink,
  FileText,
  Gauge,
  ListChecks,
  Mail,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DraftButton } from "@/components/rfp/DraftButton";
import { CaptureReadinessButton } from "@/components/rfp/CaptureReadinessButton";
import { ReviewButton } from "@/components/rfp/ReviewButton";
import { ExportProposalButton } from "@/components/rfp/ExportProposalButton";
import { SubmissionWorkroom } from "@/components/rfp/SubmissionWorkroom";
import { ManualSubmissionTaskForm } from "@/components/rfp/ManualSubmissionTaskForm";
import {
  PursuitCommandStateForm,
  type PursuitPriority,
  type PursuitStage,
} from "@/components/rfp/PursuitCommandStateForm";
import {
  PursuitDecisionLog,
  type PursuitDecisionEventType,
  type PursuitDecisionLogRow,
} from "@/components/rfp/PursuitDecisionLog";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orgId: string; oppId: string }>;
}

type TriageStatus = "watch" | "pursuing" | "passed" | "untriaged";
type ProposalStatus = "draft" | "submitted" | "won" | "lost" | "withdrawn";

interface MatchRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  recommendation: string | null;
  score_breakdown: unknown;
  triage_status: TriageStatus;
  triage_note: string | null;
  triaged_at: string | null;
  pursuit_owner_label: string;
  pursuit_stage: string;
  pursuit_priority: string;
  rfp_opportunities: {
    source: string;
    source_id: string | null;
    title: string;
    agency: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    posted_at: string | null;
    brief: string | null;
    url: string | null;
    needs_review: boolean | null;
    raw_json: unknown;
  } | null;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

interface EnrichmentRow {
  eligibility: string[];
  required_documents: string[];
  submission_method: string | null;
  submission_url: string | null;
  contact: string | null;
  matching_funds: string | null;
  funding_method: string | null;
  award_range: string | null;
  timeline: string[];
  risks: string[];
  missing_fields: string[];
  quality_score: number;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Not listed";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not listed";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((due.getTime() - start.getTime()) / 86_400_000);
}

function fmtMoney(min: number | null, max: number | null): string {
  const format = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value.toLocaleString()}`;
  };
  if (min && max && min !== max) return `${format(min)}-${format(max)}`;
  if (max) return format(max);
  if (min) return format(min);
  return "Not listed";
}

function sourceLabel(source: string): string {
  return source.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeStatus(status: string): ProposalStatus {
  if (
    status === "draft" ||
    status === "submitted" ||
    status === "won" ||
    status === "lost" ||
    status === "withdrawn"
  ) {
    return status;
  }
  return "draft";
}

function normalizeStage(stage: string): PursuitStage {
  if (
    stage === "evaluating" ||
    stage === "drafting" ||
    stage === "reviewing" ||
    stage === "ready" ||
    stage === "submitted" ||
    stage === "closed"
  ) {
    return stage;
  }
  return "evaluating";
}

function normalizePriority(priority: string): PursuitPriority {
  if (
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "critical"
  ) {
    return priority;
  }
  return "medium";
}

function readStringArray(value: unknown, key: string): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }
  const raw = (value as Record<string, unknown>)[key];
  return Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : [];
}

function fallbackList(items: string[] | undefined, fallback: string): string[] {
  return items && items.length > 0 ? items : [fallback];
}

function nextAction(params: {
  triageStatus: TriageStatus;
  proposal: ProposalRow | null;
  openTasks: number;
  blockedTasks: number;
  deadlineDays: number | null;
}) {
  if (params.triageStatus === "watch") {
    return {
      label: "Recheck fit",
      body: "This is on watch. Confirm timing, eligibility, and strategic value before turning it into a pursuit.",
      icon: Search,
      tone: "neutral" as const,
    };
  }
  if (!params.proposal) {
    return {
      label: "Create draft workroom",
      body: "Start the pursuit workflow to create the draft, reviewer pass, readiness artifacts, and submission tasks.",
      icon: Sparkles,
      tone: "warn" as const,
    };
  }
  const status = normalizeStatus(params.proposal.status);
  if (status === "submitted" || status === "won") {
    return {
      label: status === "won" ? "Award tracking" : "Submitted",
      body: "Move this from active drafting into post-submission follow-up and learning capture.",
      icon: CheckCircle2,
      tone: "ready" as const,
    };
  }
  if (params.blockedTasks > 0) {
    return {
      label: "Clear blockers",
      body: "Resolve blocked and critical workroom tasks before spending more time polishing narrative.",
      icon: AlertTriangle,
      tone: "danger" as const,
    };
  }
  if (params.openTasks > 0) {
    return {
      label: "Finish workroom",
      body: "Close open tasks, then run reviewer/readiness again before export.",
      icon: ListChecks,
      tone: "warn" as const,
    };
  }
  if (params.deadlineDays !== null && params.deadlineDays <= 7) {
    return {
      label: "Final review",
      body: "Deadline is close. Export the packet, check portal requirements, and prepare submission evidence.",
      icon: CalendarClock,
      tone: "warn" as const,
    };
  }
  return {
    label: "Ready for review",
    body: "No open workroom tasks were found. Run final reviewer/readiness and prepare export.",
    icon: CheckCircle2,
    tone: "ready" as const,
  };
}

export default async function PursuitDetailPage({ params }: PageProps) {
  const { orgId, oppId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) notFound();

  const canEdit =
    membership.role === "owner" ||
    membership.role === "writer" ||
    membership.role === "reviewer";

  const { data: match } = await supabase
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, recommendation, score_breakdown, triage_status, triage_note, triaged_at, pursuit_owner_label, pursuit_stage, pursuit_priority, rfp_opportunities ( source, source_id, title, agency, amount_min, amount_max, deadline, posted_at, brief, url, needs_review, raw_json )",
    )
    .eq("org_id", orgId)
    .eq("opp_id", oppId)
    .maybeSingle<MatchRow>();

  if (!match?.rfp_opportunities) notFound();

  const opp = match.rfp_opportunities;
  const { data: enrichment } = await supabase
    .from("rfp_opportunity_enrichments")
    .select(
      "eligibility, required_documents, submission_method, submission_url, contact, matching_funds, funding_method, award_range, timeline, risks, missing_fields, quality_score",
    )
    .eq("opp_id", oppId)
    .maybeSingle<EnrichmentRow>();

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, title, status, due_date, updated_at, created_at")
    .eq("org_id", orgId)
    .eq("opp_id", oppId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<ProposalRow>();

  const { data: tasks } = proposal
    ? await supabase
        .from("rfp_submission_tasks")
        .select("*")
        .eq("proposal_id", proposal.id)
        .order("status")
        .order("priority")
        .order("created_at", { ascending: true })
        .returns<SubmissionTaskRow[]>()
    : { data: [] as SubmissionTaskRow[] };

  const { data: decisionLogs } = await supabase
    .from("rfp_pursuit_decision_logs")
    .select("id, org_id, opp_id, event_type, title, body, created_by, created_at")
    .eq("org_id", orgId)
    .eq("opp_id", oppId)
    .order("created_at", { ascending: false })
    .limit(25)
    .returns<
      Array<
        Omit<PursuitDecisionLogRow, "event_type"> & {
          event_type: PursuitDecisionEventType;
        }
      >
    >();

  const taskRows = tasks ?? [];
  const openTasks = taskRows.filter((task) =>
    ["open", "in_progress", "blocked"].includes(task.status),
  );
  const blockedTasks = openTasks.filter(
    (task) => task.status === "blocked" || task.priority === "critical",
  );
  const deadlineDays = daysUntil(opp.deadline);
  const action = nextAction({
    triageStatus: match.triage_status,
    proposal: proposal ?? null,
    openTasks: openTasks.length,
    blockedTasks: blockedTasks.length,
    deadlineDays,
  });
  const ActionIcon = action.icon;
  const eligibilitySignals =
    enrichment?.eligibility.length ? enrichment.eligibility : readStringArray(match.score_breakdown, "eligibility");
  const riskSignals =
    enrichment?.risks.length ? enrichment.risks : readStringArray(match.score_breakdown, "risks");

  const actionClass =
    action.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : action.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : action.tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f6f2] text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/org/${orgId}/pursuits`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Pursuits
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {sourceLabel(opp.source)}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-800">
                Fit {Math.round(match.fit_score)}
              </span>
              <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {match.triage_status}
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {opp.title}
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              {opp.agency ?? "Agency not listed"}
            </p>
            <p className="mt-5 max-w-4xl text-sm leading-6 text-zinc-600">
              {match.summary ?? opp.brief ?? "No opportunity summary is available yet."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Signal icon={CalendarClock} label="Deadline" value={fmtDate(opp.deadline)} />
              <Signal
                icon={DollarSign}
                label="Award range"
                value={enrichment?.award_range ?? fmtMoney(opp.amount_min, opp.amount_max)}
              />
              <Signal
                icon={FileText}
                label="Proposal state"
                value={proposal ? normalizeStatus(proposal.status) : "No draft yet"}
              />
            </div>

            {match.triage_note ? (
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Decision note
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {match.triage_note}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <PursuitCommandStateForm
              orgId={orgId}
              oppId={oppId}
              initialOwnerLabel={match.pursuit_owner_label}
              initialStage={normalizeStage(match.pursuit_stage)}
              initialPriority={normalizePriority(match.pursuit_priority)}
              canEdit={membership.role === "owner" || membership.role === "writer"}
            />

            <section className={`rounded-xl border p-5 shadow-sm ${actionClass}`}>
              <div className="flex items-center gap-3">
                <ActionIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{action.label}</h2>
              </div>
              <p className="mt-3 text-sm leading-6">{action.body}</p>
              <div className="mt-5 flex flex-col gap-2">
                {proposal ? (
                  <Link
                    href={`/org/${orgId}/proposals/${proposal.id}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Open proposal workroom
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : match.triage_status === "pursuing" ? (
                  <DraftButton orgId={orgId} oppId={oppId} />
                ) : (
                  <Link
                    href={`/org/${orgId}/discovery`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Review in Discovery
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Timeline
              </p>
              <div className="mt-4 space-y-4">
                <TimelineItem
                  icon={Search}
                  label="Posted"
                  value={fmtDate(opp.posted_at)}
                />
                <TimelineItem
                  icon={CircleDashed}
                  label="Triaged"
                  value={fmtDate(match.triaged_at)}
                />
                <TimelineItem
                  icon={CalendarClock}
                  label="Due"
                  value={
                    deadlineDays === null
                      ? fmtDate(opp.deadline)
                      : `${fmtDate(opp.deadline)} · ${deadlineDays < 0 ? "past due" : `${deadlineDays}d left`}`
                  }
                />
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Workroom health
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Open" value={openTasks.length} />
                <MiniMetric label="Blocked" value={blockedTasks.length} />
                <MiniMetric label="Done" value={taskRows.length - openTasks.length} />
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Capture depth
                </p>
                <Gauge className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-950">
                {enrichment ? `${enrichment.quality_score}%` : "—"}
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {enrichment
                  ? `${enrichment.required_documents.length} docs · ${enrichment.risks.length} risks · ${enrichment.missing_fields.length} gaps`
                  : "Capture enrichment has not been generated yet."}
              </p>
            </section>
          </aside>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <InsightPanel
            title="Eligibility and fit"
            empty="No structured eligibility notes yet."
            items={eligibilitySignals.length > 0 ? eligibilitySignals : match.chips ?? []}
          />
          <InsightPanel
            title="Risks to close"
            empty="No structured risk notes yet."
            items={riskSignals}
          />
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Capture work plan
              </p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">
                What this pursuit needs before submission
              </h2>
            </div>
            {enrichment?.submission_url ? (
              <a
                href={enrichment.submission_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
              >
                Submission link
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <CapturePlanCard
              icon={ShieldCheck}
              title="Eligibility"
              items={fallbackList(
                enrichment?.eligibility,
                "Confirm eligible applicant type in the source package.",
              )}
            />
            <CapturePlanCard
              icon={ListChecks}
              title="Required documents"
              items={fallbackList(
                enrichment?.required_documents,
                "Open the solicitation and build the attachment list.",
              )}
            />
            <CapturePlanCard
              icon={Route}
              title="Submission path"
              items={[
                enrichment?.submission_method ?? "Confirm portal, deadline timezone, and submission evidence.",
                ...(enrichment?.timeline ?? []).slice(0, 4),
              ]}
            />
            <CapturePlanCard
              icon={Mail}
              title="Contact and funder"
              items={[
                enrichment?.contact ?? "No contact extracted yet; verify Q&A contact at source.",
                enrichment?.funding_method ? `Funding method: ${enrichment.funding_method}` : null,
                enrichment?.matching_funds ? `Match: ${enrichment.matching_funds}` : null,
              ].filter((item): item is string => Boolean(item))}
            />
            <CapturePlanCard
              icon={AlertTriangle}
              title="Risks"
              items={fallbackList(
                enrichment?.risks,
                "No major source risks extracted yet.",
              )}
            />
            <CapturePlanCard
              icon={FileText}
              title="Capture gaps"
              items={fallbackList(
                enrichment?.missing_fields,
                "No missing source fields detected.",
              )}
            />
          </div>
        </section>

        {opp.url ? (
          <a
            href={opp.url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
          >
            Open source opportunity
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}

        <div className="mt-8">
          <PursuitDecisionLog
            orgId={orgId}
            oppId={oppId}
            logs={(decisionLogs ?? []) as PursuitDecisionLogRow[]}
            canEdit={canEdit}
          />
        </div>

        {proposal ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
            <div>
              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Proposal controls
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <CaptureReadinessButton proposalId={proposal.id} />
                  <ReviewButton orgId={orgId} proposalId={proposal.id} />
                  <ExportProposalButton proposalId={proposal.id} />
                </div>
              </section>
              <SubmissionWorkroom
                proposalId={proposal.id}
                initialTasks={taskRows}
                canEdit={canEdit}
              />
            </div>
            <ManualSubmissionTaskForm proposalId={proposal.id} canEdit={canEdit} />
          </div>
        ) : (
          <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-zinc-950">
                No draft workroom yet
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Start the pursuit workflow once this opportunity is ready to move
              beyond triage. The system will create the proposal, reviewer pass,
              readiness matrix, and workroom tasks.
            </p>
            {match.triage_status === "pursuing" ? (
              <div className="mt-5 max-w-sm">
                <DraftButton orgId={orgId} oppId={oppId} />
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-950">{value}</p>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Search;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xl font-semibold tabular-nums text-zinc-950">{value}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function InsightPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.slice(0, 8).map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CapturePlanCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof ShieldCheck;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center gap-2 text-zinc-600">
        <Icon className="h-4 w-4" />
        <p className="font-mono text-[10px] uppercase tracking-[0.16em]">
          {title}
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 6).map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
