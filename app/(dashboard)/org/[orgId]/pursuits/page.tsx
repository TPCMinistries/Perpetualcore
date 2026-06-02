import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  ListChecks,
  Search,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DraftButton } from "@/components/rfp/DraftButton";
import { PursuitReadinessScorecard } from "@/components/rfp/PursuitReadinessScorecard";
import {
  parseComplianceMatrix,
  parsePacketChecklist,
  parseReviewerResult,
} from "@/lib/rfp/submission/tasks";
import { SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import { REVIEWER_FINDINGS_SECTION_TYPE } from "@/lib/rfp/review/rubric";
import {
  buildPursuitReadiness,
  countVerifyMarkersFromSections,
  parseBidNoBid,
  type PursuitReadiness,
} from "@/lib/rfp/readiness";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

type ProposalStatus = "draft" | "submitted" | "won" | "lost" | "withdrawn";
type TriageStatus = "watch" | "pursuing";
type Tone = "ready" | "warn" | "danger" | "neutral";

interface OppJoinRow {
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
  needs_review: boolean | null;
}

interface PursuitMatchRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  triage_status: TriageStatus;
  triage_note: string | null;
  triaged_at: string | null;
  pursuit_owner_label: string;
  pursuit_stage: string;
  pursuit_priority: string;
  rfp_opportunities: OppJoinRow | null;
}

interface ProposalRow {
  id: string;
  opp_id: string | null;
  title: string;
  status: string;
  due_date: string | null;
  updated_at: string;
}

interface TaskRow {
  proposal_id: string;
  status: string;
  priority: string;
  due_date: string | null;
  title: string;
}

interface ComplianceCheckRow {
  proposal_id: string;
  check_type: string;
  details_json: unknown;
  created_at: string;
}

interface SectionRow {
  proposal_id: string;
  section_type: string;
  content: string | null;
}

interface PackageRow {
  proposal_id: string;
}

interface PursuitItem {
  oppId: string;
  title: string;
  agency: string | null;
  source: string;
  deadline: string | null;
  amountMax: number | null;
  brief: string | null;
  fitScore: number;
  chips: string[];
  summary: string | null;
  triageStatus: TriageStatus;
  triageNote: string | null;
  ownerLabel: string;
  pursuitStage: string;
  pursuitPriority: string;
  proposal: ProposalRow | null;
  openTasks: number;
  blockedTasks: number;
  criticalTasks: number;
  nextTask: string | null;
  readiness: PursuitReadiness;
}

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Drafting",
  submitted: "Submitted",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

function normalizeProposalStatus(status: string): ProposalStatus {
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

function fmtDate(iso: string | null): string {
  if (!iso) return "No deadline";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No deadline";
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

function fmtMoney(value: number | null): string {
  if (!value || value <= 0) return "Amount not listed";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value.toLocaleString()}`;
}

function sourceLabel(source: string): string {
  return source.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stageFor(item: PursuitItem): {
  label: string;
  detail: string;
  tone: Tone;
  icon: typeof CircleDashed;
} {
  if (!item.proposal) {
    return {
      label: item.triageStatus === "pursuing" ? "Ready to draft" : "Watching",
      detail:
        item.triageStatus === "pursuing"
          ? "Start the pursuit workflow to create the draft, checks, and workroom."
          : "Keep this visible until the timing or fit improves.",
      tone: item.triageStatus === "pursuing" ? "warn" : "neutral",
      icon: item.triageStatus === "pursuing" ? Sparkles : Search,
    };
  }

  const status = normalizeProposalStatus(item.proposal.status);
  if (status === "submitted" || status === "won") {
    return {
      label: STATUS_LABEL[status],
      detail: "Submission packet has moved beyond active drafting.",
      tone: "ready",
      icon: CheckCircle2,
    };
  }
  if (status === "lost" || status === "withdrawn") {
    return {
      label: STATUS_LABEL[status],
      detail: "Closed pursuit. Keep for learning and future reuse.",
      tone: "neutral",
      icon: CircleDashed,
    };
  }
  if (item.blockedTasks > 0 || item.criticalTasks > 0) {
    return {
      label: "Blocked",
      detail: "Resolve critical or blocked workroom tasks before submission.",
      tone: "danger",
      icon: AlertTriangle,
    };
  }
  if (item.openTasks > 0) {
    return {
      label: "In progress",
      detail: "Draft exists; finish the workroom tasks and readiness checks.",
      tone: "warn",
      icon: ListChecks,
    };
  }
  return {
    label: "Ready review",
    detail: "Draft exists and no open workroom tasks were found.",
    tone: "ready",
    icon: CheckCircle2,
  };
}

function sortPursuits(a: PursuitItem, b: PursuitItem): number {
  const aPursuing = a.triageStatus === "pursuing" ? 0 : 1;
  const bPursuing = b.triageStatus === "pursuing" ? 0 : 1;
  if (aPursuing !== bPursuing) return aPursuing - bPursuing;

  const aDays = daysUntil(a.deadline);
  const bDays = daysUntil(b.deadline);
  const aDue = aDays === null ? 9999 : aDays < 0 ? 9998 : aDays;
  const bDue = bDays === null ? 9999 : bDays < 0 ? 9998 : bDays;
  if (aDue !== bDue) return aDue - bDue;

  return b.fitScore - a.fitScore;
}

export default async function PursuitsPage({ params }: PageProps) {
  const { orgId } = await params;
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
    .maybeSingle();
  if (!(membership as { role: string } | null)) notFound();

  const { data: matches, error: matchError } = await supabase
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, triage_status, triage_note, triaged_at, pursuit_owner_label, pursuit_stage, pursuit_priority, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, needs_review )",
    )
    .eq("org_id", orgId)
    .in("triage_status", ["watch", "pursuing"])
    .order("triaged_at", { ascending: false })
    .limit(100)
    .returns<PursuitMatchRow[]>();

  if (matchError) {
    throw new Error(`pursuits_query_failed: ${matchError.message}`);
  }

  const validMatches = (matches ?? []).filter((row) => row.rfp_opportunities);
  const oppIds = validMatches.map((row) => row.opp_id);

  const { data: proposalRows } =
    oppIds.length > 0
      ? await supabase
          .from("rfp_proposals")
          .select("id, opp_id, title, status, due_date, updated_at")
          .eq("org_id", orgId)
          .in("opp_id", oppIds)
          .order("updated_at", { ascending: false })
          .returns<ProposalRow[]>()
      : { data: [] as ProposalRow[] };

  const proposalByOpp = new Map<string, ProposalRow>();
  for (const proposal of proposalRows ?? []) {
    if (proposal.opp_id && !proposalByOpp.has(proposal.opp_id)) {
      proposalByOpp.set(proposal.opp_id, proposal);
    }
  }

  const proposalIds = [...proposalByOpp.values()].map((row) => row.id);
  const { data: taskRows } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_submission_tasks")
          .select("proposal_id, status, priority, due_date, title")
          .in("proposal_id", proposalIds)
          .returns<TaskRow[]>()
      : { data: [] as TaskRow[] };

  const { data: complianceRows } =
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
          .returns<ComplianceCheckRow[]>()
      : { data: [] as ComplianceCheckRow[] };

  const { data: sectionRows } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_proposal_sections")
          .select("proposal_id, section_type, content")
          .in("proposal_id", proposalIds)
          .returns<SectionRow[]>()
      : { data: [] as SectionRow[] };

  const { data: packageRows } =
    proposalIds.length > 0
      ? await supabase
          .from("rfp_package_documents")
          .select("proposal_id")
          .in("proposal_id", proposalIds)
          .returns<PackageRow[]>()
      : { data: [] as PackageRow[] };

  const tasksByProposal = new Map<string, TaskRow[]>();
  for (const task of taskRows ?? []) {
    const existing = tasksByProposal.get(task.proposal_id) ?? [];
    existing.push(task);
    tasksByProposal.set(task.proposal_id, existing);
  }

  const checksByProposal = new Map<string, ComplianceCheckRow[]>();
  for (const row of complianceRows ?? []) {
    const existing = checksByProposal.get(row.proposal_id) ?? [];
    existing.push(row);
    checksByProposal.set(row.proposal_id, existing);
  }

  const sectionsByProposal = new Map<string, SectionRow[]>();
  for (const row of sectionRows ?? []) {
    const existing = sectionsByProposal.get(row.proposal_id) ?? [];
    existing.push(row);
    sectionsByProposal.set(row.proposal_id, existing);
  }

  const packagesByProposal = new Set((packageRows ?? []).map((row) => row.proposal_id));

  const pursuits: PursuitItem[] = validMatches
    .map((match) => {
      const opp = match.rfp_opportunities as OppJoinRow;
      const proposal = proposalByOpp.get(match.opp_id) ?? null;
      const tasks = proposal ? tasksByProposal.get(proposal.id) ?? [] : [];
      const checksByType = new Map<string, unknown>();
      for (const row of proposal ? checksByProposal.get(proposal.id) ?? [] : []) {
        if (!checksByType.has(row.check_type)) {
          checksByType.set(row.check_type, row.details_json);
        }
      }
      const sections = proposal ? sectionsByProposal.get(proposal.id) ?? [] : [];
      const proposalSections = sections.filter((section) =>
        SECTION_TYPES.includes(section.section_type as SectionType),
      );
      const reviewerSection = sections.find(
        (section) => section.section_type === REVIEWER_FINDINGS_SECTION_TYPE,
      );
      const openTasks = tasks.filter((task) =>
        ["open", "in_progress", "blocked"].includes(task.status),
      );
      const sortedOpen = [...openTasks].sort((a, b) => {
        if (a.status === "blocked" && b.status !== "blocked") return -1;
        if (b.status === "blocked" && a.status !== "blocked") return 1;
        if (a.priority === "critical" && b.priority !== "critical") return -1;
        if (b.priority === "critical" && a.priority !== "critical") return 1;
        return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
      });

      return {
        oppId: match.opp_id,
        title: opp.title,
        agency: opp.agency,
        source: opp.source,
        deadline: opp.deadline,
        amountMax: opp.amount_max,
        brief: opp.brief,
        fitScore: match.fit_score,
        chips: match.chips ?? [],
        summary: match.summary,
        triageStatus: match.triage_status,
        triageNote: match.triage_note,
        ownerLabel: match.pursuit_owner_label,
        pursuitStage: match.pursuit_stage,
        pursuitPriority: match.pursuit_priority,
        proposal,
        openTasks: openTasks.length,
        blockedTasks: openTasks.filter((task) => task.status === "blocked").length,
        criticalTasks: openTasks.filter((task) => task.priority === "critical").length,
        nextTask: sortedOpen[0]?.title ?? null,
        readiness: buildPursuitReadiness({
          proposalStatus: proposal?.status ?? null,
          dueDate: proposal?.due_date ?? opp.deadline,
          sectionCount: proposalSections.length,
          verifyMarkerCount: countVerifyMarkersFromSections(proposalSections),
          hasPackage: proposal ? packagesByProposal.has(proposal.id) : false,
          bidNoBid: parseBidNoBid(checksByType.get("bid_no_bid_v1")),
          complianceMatrix: parseComplianceMatrix(
            checksByType.get("compliance_matrix_v1"),
          ),
          packetChecklist: parsePacketChecklist(
            checksByType.get("packet_checklist_v1"),
          ),
          reviewerResult: parseReviewerResult(reviewerSection?.content ?? null),
          tasks,
        }),
      };
    })
    .sort(sortPursuits);

  const pursuingCount = pursuits.filter((item) => item.triageStatus === "pursuing").length;
  const draftReady = pursuits.filter((item) => item.triageStatus === "pursuing" && !item.proposal).length;
  const activeDrafts = pursuits.filter((item) => item.proposal && normalizeProposalStatus(item.proposal.status) === "draft").length;
  const blockedCount = pursuits.filter((item) => item.blockedTasks > 0 || item.criticalTasks > 0).length;
  const submissionReady = pursuits.filter(
    (item) => item.readiness.status === "ready" || item.readiness.status === "submitted",
  ).length;
  const dueSoon = pursuits.filter((item) => {
    const days = daysUntil(item.deadline);
    return days !== null && days >= 0 && days <= 14;
  }).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f6f2] text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Pursuit Workspace
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-800">
                {pursuingCount} active
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Turn selected opportunities into submitted packets.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Everything marked Watch or Pursue lives here: deadline pressure,
              draft state, workroom blockers, and the next action needed to move
              each opportunity forward.
            </p>
          </div>
          <Link
            href={`/org/${orgId}/discovery`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Find more opportunities
            <Search className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard label="Ready to draft" value={draftReady} tone={draftReady > 0 ? "warn" : "neutral"} />
          <MetricCard label="Draft workrooms" value={activeDrafts} tone={activeDrafts > 0 ? "ready" : "neutral"} />
          <MetricCard label="Blocked" value={blockedCount} tone={blockedCount > 0 ? "danger" : "neutral"} />
          <MetricCard label="Submit-ready" value={submissionReady} tone={submissionReady > 0 ? "ready" : "neutral"} />
          <MetricCard label="Due in 14d" value={dueSoon} tone={dueSoon > 0 ? "warn" : "neutral"} />
          <MetricCard label="Watching" value={pursuits.length - pursuingCount} tone="neutral" />
        </section>

        {pursuits.length === 0 ? (
          <section className="mt-10 rounded-lg border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-950">
              No pursuits yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              Mark high-fit opportunities as Watch or Pursue from Discovery and
              they will appear here as your working pipeline.
            </p>
            <Link
              href={`/org/${orgId}/discovery`}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white"
            >
              Open Discovery
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4">
            {pursuits.map((item) => (
              <PursuitCard key={item.oppId} item={item} orgId={orgId} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const toneClass =
    tone === "ready"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-rose-700"
          : "text-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function PursuitCard({ item, orgId }: { item: PursuitItem; orgId: string }) {
  const stage = stageFor(item);
  const StageIcon = stage.icon;
  const days = daysUntil(item.deadline);
  const stageClass =
    stage.tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : stage.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : stage.tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${stageClass}`}>
              <StageIcon className="h-3.5 w-3.5" />
              {stage.label}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              {sourceLabel(item.source)}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Fit {Math.round(item.fitScore)}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              {item.pursuitStage}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              {item.pursuitPriority}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">
            {item.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {item.agency ?? "Agency not listed"}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600">
            {item.summary ?? item.brief ?? "No summary available yet."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Signal icon={CalendarClock} label="Deadline" value={fmtDate(item.deadline)} />
            <Signal icon={FileText} label="Award ceiling" value={fmtMoney(item.amountMax)} />
            <Signal
              icon={ListChecks}
              label="Owner"
              value={item.ownerLabel}
            />
          </div>

          {days !== null && days >= 0 && days <= 14 ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Deadline pressure: {days === 0 ? "due today" : `${days} day${days === 1 ? "" : "s"} left`}.
            </p>
          ) : null}

          {item.triageNote ? (
            <p className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-600">
              {item.triageNote}
            </p>
          ) : null}
        </div>

        <aside className="border-t border-zinc-200 bg-zinc-50 p-5 lg:border-l lg:border-t-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Next action
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{stage.detail}</p>
          <div className="mt-4">
            <PursuitReadinessScorecard readiness={item.readiness} compact />
          </div>

          {item.nextTask ? (
            <div className="mt-4 rounded-md border border-zinc-200 bg-white p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Next task
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                {item.nextTask}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/org/${orgId}/pursuits/${item.oppId}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              Open command file
              <ArrowRight className="h-4 w-4" />
            </Link>
            {item.proposal ? (
              <Link
                href={`/org/${orgId}/proposals/${item.proposal.id}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Open workroom
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : item.triageStatus === "pursuing" ? (
              <DraftButton orgId={orgId} oppId={item.oppId} />
            ) : (
              <Link
                href={`/org/${orgId}/discovery?selected=${item.oppId}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
              >
                Review in Discovery
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </article>
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
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
