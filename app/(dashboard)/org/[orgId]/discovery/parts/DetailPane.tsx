"use client";

/**
 * DetailPane — right pane that shows the full reasoning for the selected opp.
 *
 * Contract (locked in 05-CONTEXT.md "Fit score presentation" → "Reasoning
 * rendering"): BOTH structured chips AND a 1-2 sentence AI summary. The chips
 * are the durable, model-agnostic explanation; the summary is the narrative
 * gloss. When summary is null (AI rate-limited, generation failed, etc.), we
 * render the literal fallback string `"No summary generated."` — never an
 * empty element. This is the explicit must-have truth in 05-04-PLAN.md:
 *   "DetailPane renders both the structured reasoning chips (from match.chips)
 *    AND the 1-2 sentence AI summary (match.summary); when summary is null,
 *    an explicit 'No summary generated.' fallback is shown"
 *
 * Visual mood: dark zinc-950 base, mono uppercase eyebrow, serif Georgia
 * italic for the title, emerald accent for the fit chip. Matches the rfp
 * marketing surface rhythm.
 */

import { useEffect, useCallback, useState, type ReactNode } from "react";
import { FitScoreChip } from "./FitScoreChip";
import { FitReasoningPanel, type FitReasoningData } from "./FitReasoningPanel";
import { DraftButton } from "@/components/rfp/DraftButton";
import { PursuitDecisionBar } from "@/components/rfp/PursuitDecisionBar";
import type { OpportunityTriageStatus } from "@/components/rfp/OpportunityTriageControl";
import { buildPursuitDecisionSummary } from "@/lib/rfp/pursuit-decision";
import type {
  PursuitDecisionSummary,
} from "@/lib/rfp/pursuit-decision";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  ListChecks,
  Mail,
  Megaphone,
  Route,
  Save,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Landmark,
} from "lucide-react";
import type { FeedRow } from "@/lib/rfp/feed";
import type { ActionabilityResult } from "@/lib/rfp/actionability";

interface DetailPaneProps {
  orgId: string;
  selected: FeedRow | null;
  onTriageChange?: (
    oppId: string,
    status: OpportunityTriageStatus,
    note: string | null,
  ) => void;
}

interface OppDetail extends FeedRow {
  score_breakdown: unknown;
  posted_at: string | null;
  keywords: string[];
  geo: string | null;
  raw_json: unknown;
  enrichment: OpportunityEnrichment | null;
  fit_reasoning?: FitReasoningData;
  amendments?: AmendmentSummary[];
}

interface AmendmentSummary {
  id: string;
  material: boolean;
  material_reasons: string[] | null;
  diff_json: {
    summary?: string;
    field_changes?: Array<{ field: string; before: string | number | null; after: string | number | null }>;
    added_lines?: string[];
    removed_lines?: string[];
  } | null;
  status: string;
  created_at: string;
}

interface OpportunityEnrichment {
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

interface CuratedProgramMetadata {
  source?: string;
  title?: string;
  agency?: string;
  type?: string;
  url?: string;
  brief?: string;
  keywords?: string[];
  focus_areas?: string[];
  markets?: string[];
  cycle?: string;
  eligibility?: string;
  application_mode?: "open" | "invitation" | "letter_of_interest" | "rolling" | "cycle";
  needs_review?: boolean;
}

interface SourceMonitoringMetadata {
  application_window_status?: "open" | "rolling" | "invitation_only" | "cycle_watch" | "verify";
  review_cadence_days?: number;
  next_verification?: string;
}

function normalizeTriageStatus(status: string): OpportunityTriageStatus {
  if (
    status === "watch" ||
    status === "pursuing" ||
    status === "passed" ||
    status === "untriaged"
  ) {
    return status;
  }
  return "untriaged";
}

function formatAmount(amt: number | null): string {
  if (amt === null || amt === undefined) return "—";
  if (amt >= 1_000_000)
    return `$${(amt / 1_000_000).toFixed(amt >= 10_000_000 ? 0 : 1)}M`;
  if (amt >= 1_000) return `$${Math.round(amt / 1_000)}K`;
  return `$${amt}`;
}

function formatDate(iso: string | null, prefix: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${prefix} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}

function deadlineSignal(days: number | null): {
  label: string;
  detail: string;
  tone: "emerald" | "amber" | "zinc";
} {
  if (days === null) {
    return {
      label: "No deadline found",
      detail: "Confirm the source package before assigning work.",
      tone: "zinc",
    };
  }
  if (days < 0) {
    return {
      label: "Past deadline",
      detail: "Keep for market intelligence unless the source extended it.",
      tone: "zinc",
    };
  }
  if (days <= 7) {
    return {
      label: `${days} day${days === 1 ? "" : "s"} left`,
      detail: "Only pursue if requirements are already mostly reusable.",
      tone: "amber",
    };
  }
  if (days <= 21) {
    return {
      label: `${days} days left`,
      detail: "Start the workroom before drafting heavily.",
      tone: "amber",
    };
  }
  return {
    label: `${days} days left`,
    detail: "Workable window for review, attachments, and sign-off.",
    tone: "emerald",
  };
}

function pursuitDecision(score: number, deadlineDays: number | null): {
  label: string;
  detail: string;
  tone: "emerald" | "amber" | "zinc";
} {
  if (deadlineDays !== null && deadlineDays < 0) {
    return {
      label: "Pass for now",
      detail: "Deadline appears closed. Check the source for extensions.",
      tone: "zinc",
    };
  }
  if (score >= 90 && (deadlineDays === null || deadlineDays > 14)) {
    return {
      label: "Pursue now",
      detail: "Strong fit with enough room to build a clean submission packet.",
      tone: "emerald",
    };
  }
  if (score >= 70 && (deadlineDays === null || deadlineDays > 7)) {
    return {
      label: "Review closely",
      detail: "Good match. Confirm eligibility and required attachments first.",
      tone: "amber",
    };
  }
  if (score >= 50) {
    return {
      label: "Watch or import details",
      detail: "There may be a path, but the score needs human confirmation.",
      tone: "zinc",
    };
  }
  return {
    label: "Low priority",
    detail: "Keep it visible for search, but do not spend drafting time yet.",
    tone: "zinc",
  };
}

function effortSignal(amount: number | null, brief: string | null): {
  label: string;
  detail: string;
} {
  if (amount !== null && amount >= 1_000_000) {
    return {
      label: "High effort",
      detail: "Expect budget, compliance, partner, and attachment work.",
    };
  }
  if ((brief?.length ?? 0) < 500) {
    return {
      label: "Needs source review",
      detail: "Brief is thin. Open the source before relying on the draft.",
    };
  }
  return {
    label: "Standard pursuit",
    detail: "Draft, reviewer, readiness matrix, then submission packet.",
  };
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    grants_gov: "Grants.gov",
    nih_grants: "NIH Grants",
    nih_guide_notices: "NIH Guide Notices",
    nsf_grants: "NSF Grants",
    fed_register: "Federal Register",
    sam_gov: "SAM.gov",
    simpler_grants: "Simpler Grants",
    sbir: "SBIR.gov",
    ny_state: "NY State",
    nyc_dycd: "NYC DYCD",
    nyc_hra: "NYC HRA",
    nyc_doe: "NYC DOE",
    nyc_passport: "NYC PASSPort",
    ca_grants: "CA Grants",
    nj_grants: "NJ Grants",
    ct_grants: "CT Grants",
    pa_grants: "PA Grants",
    corporate_foundations: "Corporate Foundations",
    bank_cra: "Bank CRA",
    foundation_url: "Foundation",
  };
  return labels[source] ?? source.replace(/_/g, " ");
}

function decisionToneClasses(tone: "emerald" | "amber" | "zinc"): string {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-zinc-200 bg-white text-zinc-700";
}

function readinessToneClasses(level: NonNullable<FeedRow["actionability"]>["level"]): string {
  if (level === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (level === "workable") return "border-blue-200 bg-blue-50 text-blue-950";
  if (level === "review") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-zinc-200 bg-zinc-100 text-zinc-800";
}

function shortList(items: string[], fallback: string): string[] {
  return items.length > 0 ? items : [fallback];
}

function CaptureCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-zinc-950">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
          {icon}
        </span>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

interface CommandBriefItem {
  label: string;
  detail: string;
  tone: "ready" | "warn" | "danger" | "neutral";
}

function commandToneClasses(tone: CommandBriefItem["tone"]): string {
  if (tone === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-950";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-950";
  return "border-zinc-200 bg-zinc-50 text-zinc-800";
}

function buildCommandBrief({
  actionability,
  bidDecision,
  enrichment,
  amendments,
  row,
}: {
  actionability: ActionabilityResult | null;
  bidDecision: PursuitDecisionSummary;
  enrichment: OpportunityEnrichment | null;
  amendments: AmendmentSummary[];
  row: FeedRow;
}): {
  primaryAction: string;
  owner: string;
  confirmations: CommandBriefItem[];
  blockers: CommandBriefItem[];
  workplan: CommandBriefItem[];
} {
  const blockers: CommandBriefItem[] = [];
  const confirmations: CommandBriefItem[] = [];

  for (const blocker of actionability?.blockers ?? []) {
    blockers.push({
      label: "Blocker",
      detail: blocker,
      tone: blocker.toLowerCase().includes("deadline") ? "danger" : "warn",
    });
  }

  if (amendments.some((amendment) => amendment.material)) {
    blockers.push({
      label: "Amendment",
      detail: "Material solicitation change detected. Re-check requirements before drafting or submitting.",
      tone: "warn",
    });
  }

  if (row.needs_review) {
    confirmations.push({
      label: "Source QA",
      detail: "Open the source and confirm extracted fields before assigning drafting time.",
      tone: "warn",
    });
  }

  for (const missing of actionability?.missing ?? []) {
    confirmations.push({
      label: "Confirm",
      detail: missing,
      tone: "neutral",
    });
  }

  if ((enrichment?.risks.length ?? 0) > 0) {
    for (const risk of enrichment?.risks.slice(0, 2) ?? []) {
      confirmations.push({ label: "Risk", detail: risk, tone: "warn" });
    }
  }

  const workplan = bidDecision.nextActions.slice(0, 3).map((action) => ({
    label: "Next",
    detail: action,
    tone: "neutral" as const,
  }));

  if ((enrichment?.required_documents.length ?? 0) > 0) {
    workplan.push({
      label: "Package",
      detail: `${enrichment?.required_documents.length ?? 0} required document${(enrichment?.required_documents.length ?? 0) === 1 ? "" : "s"} identified.`,
      tone: "ready",
    });
  }

  return {
    primaryAction:
      bidDecision.recommendation === "pursue"
        ? "Open pursuit workroom"
        : bidDecision.recommendation === "maybe"
          ? "Run bid/no-bid review"
          : "Archive unless source improves",
    owner:
      actionability?.level === "ready"
        ? "Capture lead"
        : actionability?.level === "blocked"
          ? "Executive reviewer"
          : "Proposal manager",
    confirmations: confirmations.slice(0, 4),
    blockers: blockers.slice(0, 3),
    workplan: workplan.slice(0, 4),
  };
}

function fallbackCommandItem(detail: string, tone: CommandBriefItem["tone"]): CommandBriefItem {
  return { label: "Clear", detail, tone };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function getCuratedProgram(rawJson: unknown): CuratedProgramMetadata | null {
  if (!isRecord(rawJson) || !isRecord(rawJson.curated_program)) return null;
  const raw = rawJson.curated_program;
  const applicationMode = raw.application_mode;
  return {
    source: typeof raw.source === "string" ? raw.source : undefined,
    title: typeof raw.title === "string" ? raw.title : undefined,
    agency: typeof raw.agency === "string" ? raw.agency : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    brief: typeof raw.brief === "string" ? raw.brief : undefined,
    keywords: stringArray(raw.keywords),
    focus_areas: stringArray(raw.focus_areas),
    markets: stringArray(raw.markets),
    cycle: typeof raw.cycle === "string" ? raw.cycle : undefined,
    eligibility: typeof raw.eligibility === "string" ? raw.eligibility : undefined,
    application_mode:
      applicationMode === "open" ||
      applicationMode === "invitation" ||
      applicationMode === "letter_of_interest" ||
      applicationMode === "rolling" ||
      applicationMode === "cycle"
        ? applicationMode
        : undefined,
    needs_review: typeof raw.needs_review === "boolean" ? raw.needs_review : undefined,
  };
}

function getSourceMonitoring(rawJson: unknown): SourceMonitoringMetadata | null {
  if (!isRecord(rawJson) || !isRecord(rawJson.source_monitoring)) return null;
  const raw = rawJson.source_monitoring;
  const status = raw.application_window_status;
  return {
    application_window_status:
      status === "open" ||
      status === "rolling" ||
      status === "invitation_only" ||
      status === "cycle_watch" ||
      status === "verify"
        ? status
        : undefined,
    review_cadence_days:
      typeof raw.review_cadence_days === "number" && Number.isFinite(raw.review_cadence_days)
        ? raw.review_cadence_days
        : undefined,
    next_verification:
      typeof raw.next_verification === "string" ? raw.next_verification : undefined,
  };
}

function applicationModeLabel(mode: CuratedProgramMetadata["application_mode"]): string {
  if (mode === "open") return "Open application";
  if (mode === "invitation") return "Invitation likely";
  if (mode === "letter_of_interest") return "LOI first";
  if (mode === "rolling") return "Rolling";
  if (mode === "cycle") return "Cycle based";
  return "Verify on source";
}

function monitoringStatusLabel(status: SourceMonitoringMetadata["application_window_status"]): string {
  if (status === "open") return "Open now";
  if (status === "rolling") return "Rolling watch";
  if (status === "invitation_only") return "Invitation path";
  if (status === "cycle_watch") return "Cycle watch";
  return "Verify window";
}

function monitoringTone(status: SourceMonitoringMetadata["application_window_status"]): CommandBriefItem["tone"] {
  if (status === "open" || status === "rolling") return "ready";
  if (status === "invitation_only" || status === "cycle_watch") return "warn";
  return "neutral";
}

function funderSourceLabel(source: string): string {
  if (source === "bank_cra") return "Bank / CRA funder";
  if (source === "corporate_foundations") return "Corporate funder";
  if (source === "foundation_url") return "Foundation funder";
  return "Funder";
}

function funderActionLabel({
  bidDecision,
  actionability,
  row,
}: {
  bidDecision: PursuitDecisionSummary;
  actionability: ActionabilityResult | null;
  row: FeedRow;
}): { label: string; detail: string; tone: CommandBriefItem["tone"] } {
  if (daysUntil(row.deadline) !== null && (daysUntil(row.deadline) ?? 0) < 0) {
    return {
      label: "Watch",
      detail: "Deadline appears closed. Keep the funder for future cycles.",
      tone: "neutral",
    };
  }
  if (bidDecision.recommendation === "pursue" && actionability?.level === "ready") {
    return {
      label: "Pursue",
      detail: "Strong fit with enough structured source intelligence to assign capture work.",
      tone: "ready",
    };
  }
  if (bidDecision.recommendation === "maybe" || actionability?.level === "review") {
    return {
      label: "Research first",
      detail: "Good prospect, but confirm eligibility, source instructions, or application window before drafting.",
      tone: "warn",
    };
  }
  if (actionability?.level === "blocked") {
    return {
      label: "Do not draft yet",
      detail: "Resolve blockers before spending proposal capacity.",
      tone: "danger",
    };
  }
  return {
    label: "Monitor",
    detail: "Useful funder intelligence. Save a search or revisit when fit improves.",
    tone: "neutral",
  };
}

function isFunderOpportunity(row: FeedRow): boolean {
  return (
    row.source === "corporate_foundations" ||
    row.source === "bank_cra" ||
    row.source === "foundation_url"
  );
}

function sourceQualitySignals({
  row,
  enrichment,
  curatedProgram,
}: {
  row: FeedRow;
  enrichment: OpportunityEnrichment | null;
  curatedProgram: CuratedProgramMetadata | null;
}): CommandBriefItem[] {
  const signals: CommandBriefItem[] = [];
  if (curatedProgram) {
    signals.push({
      label: "Official source",
      detail: "Curated from an official funder program page.",
      tone: "ready",
    });
  } else {
    signals.push({
      label: "Source",
      detail: `${sourceLabel(row.source)} record normalized into discovery.`,
      tone: "neutral",
    });
  }

  if (enrichment) {
    signals.push({
      label: "Source depth",
      detail: `${enrichment.quality_score}% structured intelligence extracted.`,
      tone:
        enrichment.quality_score >= 75
          ? "ready"
          : enrichment.quality_score >= 45
            ? "warn"
            : "neutral",
    });
  } else {
    signals.push({
      label: "Source depth",
      detail: "Structured enrichment has not loaded yet.",
      tone: "neutral",
    });
  }

  if (row.needs_review || curatedProgram?.needs_review) {
    signals.push({
      label: "Human QA",
      detail: "Confirm the source page before assigning proposal capacity.",
      tone: "warn",
    });
  } else {
    signals.push({
      label: "QA status",
      detail: "No source-review flag is currently attached.",
      tone: "ready",
    });
  }

  const missing = enrichment?.missing_fields ?? [];
  if (missing.length > 0) {
    signals.push({
      label: "Missing fields",
      detail: missing.slice(0, 3).join(", "),
      tone: "warn",
    });
  } else if (enrichment) {
    signals.push({
      label: "Completeness",
      detail: "No major enrichment fields are missing.",
      tone: "ready",
    });
  }

  return signals.slice(0, 4);
}

export function DetailPane({
  orgId,
  selected,
  onTriageChange,
}: DetailPaneProps) {
  const [detail, setDetail] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Incrementing this triggers a re-fetch after an on-demand rescore.
  const [rescoreKey, setRescoreKey] = useState(0);
  const [funderSearchStatus, setFunderSearchStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Re-fetch after rescore; stable reference so FitReasoningPanel's dep array is stable.
  const handleRescored = useCallback(() => {
    setRescoreKey((k) => k + 1);
  }, []);

  // Fetch single-opp detail whenever the selected row changes (or after rescore).
  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setError(null);
      setFunderSearchStatus("idle");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/rfp/opps/${encodeURIComponent(selected.opp_id)}?org_id=${encodeURIComponent(orgId)}`
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`detail_${res.status}`);
        }
        return (await res.json()) as OppDetail;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, selected, rescoreKey]);

  useEffect(() => {
    setFunderSearchStatus("idle");
  }, [selected?.opp_id]);

  // Empty state
  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="max-w-sm text-center text-lg text-zinc-500">
          Select an opportunity to see fit reasoning.
        </p>
      </div>
    );
  }

  // Use cached row data as scaffold while detail loads — feels instant.
  const row = detail ?? selected;
  const moneyParts = [
    formatAmount(row.amount_max ?? row.amount_min ?? null),
    formatDate(row.deadline, "deadline"),
    detail ? formatDate(detail.posted_at, "posted") : null,
  ].filter((p): p is string => Boolean(p));
  const deadlineDays = daysUntil(row.deadline);
  const deadline = deadlineSignal(deadlineDays);
  const decision = pursuitDecision(row.fit_score, deadlineDays);
  const effort = effortSignal(row.amount_max ?? row.amount_min ?? null, row.brief);
  const enrichment = detail?.enrichment ?? null;
  const bidDecision = buildPursuitDecisionSummary({
    fitScore: row.fit_score,
    deadline: row.deadline,
    amountMax: row.amount_max ?? row.amount_min ?? null,
    needsReview: row.needs_review,
    enrichmentQuality: enrichment?.quality_score ?? null,
  });
  const sourceAliases = row.canonical?.source_aliases ?? [];
  const sourceCount = sourceAliases.length;
  const actionability = row.actionability;
  const amendments = detail?.amendments ?? [];
  const commandBrief = buildCommandBrief({
    actionability,
    bidDecision,
    enrichment,
    amendments,
    row,
  });
  const curatedProgram = detail ? getCuratedProgram(detail.raw_json) : null;
  const sourceMonitoring = detail ? getSourceMonitoring(detail.raw_json) : null;
  const showFunderFit = isFunderOpportunity(row);
  const funderAction = funderActionLabel({ bidDecision, actionability, row });
  const focusAreas = [
    ...(curatedProgram?.focus_areas ?? []),
    ...(curatedProgram?.keywords ?? []).slice(0, 3),
  ].filter((item, index, items) => items.indexOf(item) === index);
  const funderRisks = [
    ...(enrichment?.risks ?? []),
    ...(actionability?.missing ?? []).map((item) => `Missing: ${item}`),
  ];
  const sourceSignals = sourceQualitySignals({ row, enrichment, curatedProgram });

  async function saveFunderSearch(): Promise<void> {
    if (funderSearchStatus === "saving") return;
    setFunderSearchStatus("saving");
    try {
      const res = await fetch(`/api/rfp/orgs/${orgId}/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${funderSourceLabel(row.source)}: ${row.agency ?? sourceLabel(row.source)}`.slice(0, 80),
          filters: {
            query: row.agency ?? "",
            sources: [row.source],
            deadline_within_days: null,
            min_amount: null,
            actionability: null,
            sort: "fit",
          },
          mode: "all",
          is_shared: false,
          alert_enabled: true,
          alert_frequency: "weekly",
          min_fit_score: 70,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setFunderSearchStatus("saved");
    } catch {
      setFunderSearchStatus("error");
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      {/* Eyebrow */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        <span>{row.source.replace(/_/g, " ")}</span>
        {row.agency && (
          <>
            <span aria-hidden="true">·</span>
            <span>{row.agency}</span>
          </>
        )}
        {row.needs_review && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700">Needs review</span>
          </>
        )}
      </div>

      <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-zinc-950">
        {row.title}
      </h2>

      {/* Fit row — chip + reasoning chips inline */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FitScoreChip score={row.fit_score} tier={row.tier} />
        {row.chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-600"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Money / deadline strip */}
      {moneyParts.length > 0 && (
        <p className="mt-4 font-mono text-sm text-zinc-500">
          {moneyParts.join(" · ")}
        </p>
      )}

      <section className="mt-5 grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {sourceSignals.map((signal) => (
          <div
            key={`${signal.label}-${signal.detail}`}
            className={`rounded-lg border px-3 py-2 ${commandToneClasses(signal.tone)}`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">
                {signal.label}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5">{signal.detail}</p>
          </div>
        ))}
      </section>

      {sourceCount > 1 && (
        <section className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-blue-700">
                Source coverage
              </h3>
              <p className="mt-1 text-sm leading-6 text-blue-950">
                This opportunity is backed by {sourceCount} source records. The
                engine is showing the strongest scored version while preserving
                the original postings.
              </p>
            </div>
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-blue-700">
              {row.canonical?.duplicate_count ?? sourceCount - 1} duplicate
              {(row.canonical?.duplicate_count ?? sourceCount - 1) === 1 ? "" : "s"} collapsed
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceAliases.map((alias) => (
              <span
                key={`${alias.source}:${alias.source_id}:${alias.opp_id}`}
                className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                  alias.opp_id === row.opp_id
                    ? "border-blue-300 bg-white text-blue-800"
                    : "border-blue-100 bg-blue-100/70 text-blue-700"
                }`}
                title={`${sourceLabel(alias.source)} ${alias.source_id}`}
              >
                {sourceLabel(alias.source)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div
          className={`rounded-lg border p-4 ${decisionToneClasses(decision.tone)}`}
        >
          <ClipboardCheck className="mb-3 h-4 w-4" />
          <p className="text-sm font-semibold">{decision.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{decision.detail}</p>
        </div>
        <div
          className={`rounded-lg border p-4 ${decisionToneClasses(deadline.tone)}`}
        >
          <CalendarClock className="mb-3 h-4 w-4" />
          <p className="text-sm font-semibold">{deadline.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{deadline.detail}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-700">
          {(row.amount_max ?? row.amount_min ?? null) !== null ? (
            <CircleDollarSign className="mb-3 h-4 w-4 text-zinc-500" />
          ) : (
            <AlertTriangle className="mb-3 h-4 w-4 text-zinc-500" />
          )}
          <p className="text-sm font-semibold">{effort.label}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{effort.detail}</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Command brief
            </h3>
            <p className="mt-2 text-xl font-semibold text-zinc-950">
              {commandBrief.primaryAction}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Route this to {commandBrief.owner.toLowerCase()} with the checks below before committing proposal capacity.
            </p>
          </div>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {bidDecision.confidence.replace("-", " ")}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Blockers
            </p>
            <div className="mt-2 space-y-2">
              {(commandBrief.blockers.length > 0
                ? commandBrief.blockers
                : [fallbackCommandItem("No hard blockers detected.", "ready")]
              ).map((item) => (
                <div
                  key={`${item.label}-${item.detail}`}
                  className={`rounded-md border px-3 py-2 text-xs leading-5 ${commandToneClasses(item.tone)}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                    {item.label}
                  </span>
                  <span className="mt-1 block">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Confirmations
            </p>
            <div className="mt-2 space-y-2">
              {(commandBrief.confirmations.length > 0
                ? commandBrief.confirmations
                : [fallbackCommandItem("Core source fields are ready for capture review.", "ready")]
              ).map((item) => (
                <div
                  key={`${item.label}-${item.detail}`}
                  className={`rounded-md border px-3 py-2 text-xs leading-5 ${commandToneClasses(item.tone)}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                    {item.label}
                  </span>
                  <span className="mt-1 block">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Workplan
            </p>
            <div className="mt-2 space-y-2">
              {commandBrief.workplan.map((item) => (
                <div
                  key={item.detail}
                  className={`rounded-md border px-3 py-2 text-xs leading-5 ${commandToneClasses(item.tone)}`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                    {item.label}
                  </span>
                  <span className="mt-1 block">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <PursuitDecisionBar
          key={row.opp_id}
          orgId={orgId}
          oppId={row.opp_id}
          initialStatus={normalizeTriageStatus(row.triage_status)}
          initialNote={row.triage_note}
          onChange={(nextStatus, nextNote) => {
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    triage_status: nextStatus,
                    triage_note: nextNote,
                  }
                : prev,
            );
            onTriageChange?.(row.opp_id, nextStatus, nextNote);
          }}
        />
      </div>

      {showFunderFit && (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                  row.source === "bank_cra"
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {row.source === "bank_cra" ? (
                  <Landmark className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </span>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  Funder fit
                </h3>
                <p className="mt-2 text-xl font-semibold text-zinc-950">
                  {funderAction.label} · {applicationModeLabel(curatedProgram?.application_mode)}
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
                  {funderAction.detail}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${commandToneClasses(funderAction.tone)}`}
            >
              {funderSourceLabel(row.source)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <div
              className={`rounded-lg border p-3 ${commandToneClasses(
                monitoringTone(sourceMonitoring?.application_window_status),
              )}`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                Window monitor
              </p>
              <p className="mt-2 text-sm font-semibold">
                {monitoringStatusLabel(sourceMonitoring?.application_window_status)}
              </p>
              <p className="mt-1 text-xs leading-5 opacity-80">
                {sourceMonitoring?.next_verification ??
                  "Open the official source page and classify the application window before pursuit."}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                Review every {sourceMonitoring?.review_cadence_days ?? 60} days
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Fit signals
              </p>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-zinc-700">
                {shortList(
                  focusAreas.slice(0, 5),
                  "No focus areas were structured. Review the funder source before pursuit.",
                ).map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Eligibility and market
              </p>
              <div className="mt-2 space-y-2 text-xs leading-5 text-zinc-700">
                <p>
                  {curatedProgram?.eligibility ??
                    enrichment?.eligibility?.[0] ??
                    "Eligibility needs source confirmation before drafting."}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {shortList(curatedProgram?.markets ?? [], "US / source-defined market").map((item) => (
                    <span
                      key={item}
                      className="rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Risks to clear
              </p>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-zinc-700">
                {shortList(
                  funderRisks.slice(0, 4),
                  curatedProgram?.needs_review || row.needs_review
                    ? "Source review required before relying on this funder record."
                    : "No major funder-specific risk detected.",
                ).map((item) => (
                  <li key={item} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveFunderSearch}
              disabled={funderSearchStatus === "saving" || funderSearchStatus === "saved"}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-default disabled:bg-zinc-300 motion-reduce:transition-none"
            >
              <Save className="h-3.5 w-3.5" />
              {funderSearchStatus === "saving"
                ? "Saving"
                : funderSearchStatus === "saved"
                  ? "Saved search"
                  : "Save similar funders"}
            </button>
            <a
              href={`/org/${orgId}/discovery?sources=${encodeURIComponent(row.source)}${
                row.agency ? `&q=${encodeURIComponent(row.agency)}` : ""
              }`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-950 motion-reduce:transition-none"
            >
              Find similar <SearchCheck className="h-3.5 w-3.5" />
            </a>
            {funderSearchStatus === "error" && (
              <span className="text-xs font-medium text-rose-700">
                Could not save search.
              </span>
            )}
          </div>
        </section>
      )}

      {actionability && (
        <section
          className={`mt-6 rounded-xl border p-4 shadow-sm ${readinessToneClasses(actionability.level)}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
                Pursuit readiness
              </h3>
              <p className="mt-2 text-xl font-semibold">
                {actionability.label} · {actionability.score}
              </p>
              <p className="mt-1 text-sm leading-6 opacity-80">
                {actionability.effort[0].toUpperCase() + actionability.effort.slice(1)} effort
                {actionability.deadline_days === null
                  ? " · deadline unknown"
                  : actionability.deadline_days < 0
                    ? " · past deadline"
                    : ` · ${actionability.deadline_days}d left`}
              </p>
            </div>
            <span className="rounded-full border border-current/20 bg-white/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
              {actionability.level}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-current/10 bg-white/55 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                Why
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5">
                {(actionability.reasons.length > 0
                  ? actionability.reasons
                  : ["Fit score and source depth drive this estimate."]
                ).slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-current/10 bg-white/55 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                Missing
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5">
                {(actionability.missing.length > 0
                  ? actionability.missing
                  : ["No major structured-data gaps."]
                ).slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-current/10 bg-white/55 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                Blockers
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5">
                {(actionability.blockers.length > 0
                  ? actionability.blockers
                  : ["No hard blocker detected."]
                ).slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {amendments.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700">
                <Megaphone className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-700">
                  Solicitation amendments
                </h3>
                <p className="mt-1 text-sm leading-6 text-amber-950">
                  {amendments[0]?.material
                    ? "Material change detected. Review the task queue before submitting."
                    : "Changes were detected since the last solicitation snapshot."}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700">
              {amendments.length} update{amendments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {amendments.slice(0, 3).map((amendment) => (
              <article
                key={amendment.id}
                className="rounded-lg border border-amber-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-700">
                    {amendment.material ? "Material" : "Changed"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(amendment.created_at, "detected")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {amendment.diff_json?.summary ?? "Solicitation changed."}
                </p>
                {(amendment.material_reasons ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(amendment.material_reasons ?? []).map((reason) => (
                      <span
                        key={reason}
                        className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-800"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
                {(amendment.diff_json?.added_lines ?? []).length > 0 && (
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Added: {amendment.diff_json?.added_lines?.[0]}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Bid / no-bid estimate
            </h3>
            <p className="mt-2 text-lg font-semibold text-zinc-950">
              {bidDecision.label} · {bidDecision.score}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
              {bidDecision.detail}
            </p>
          </div>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {bidDecision.confidence.replace("-", " ")}
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {bidDecision.signals.slice(0, 3).map((signal) => (
            <div
              key={`${signal.label}-${signal.detail}`}
              className={`rounded-lg border p-3 ${commandToneClasses(signal.tone)}`}
            >
              <p className="text-sm font-semibold">{signal.label}</p>
              <p className="mt-1 text-xs leading-5 opacity-80">{signal.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Capture brief
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Extracted from the source payload so the team can judge effort before opening a workroom.
            </p>
          </div>
          {enrichment && (
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
              {enrichment.quality_score}% source depth
            </span>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <CaptureCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Eligibility"
          >
            <ul className="space-y-2 text-sm leading-6 text-zinc-700">
              {shortList(
                enrichment?.eligibility ?? [],
                "Eligibility was not structured in the source. Confirm before drafting.",
              ).map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CaptureCard>

          <CaptureCard
            icon={<FileText className="h-4 w-4" />}
            label="Required docs"
          >
            <ul className="space-y-2 text-sm leading-6 text-zinc-700">
              {shortList(
                enrichment?.required_documents ?? [],
                "No required document list was found yet. Review the solicitation package.",
              ).map((item) => (
                <li key={item} className="flex gap-2">
                  <ListChecks className="mt-1 h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CaptureCard>

          <CaptureCard
            icon={<Route className="h-4 w-4" />}
            label="Submission"
          >
            <div className="space-y-2 text-sm leading-6 text-zinc-700">
              <p>{enrichment?.submission_method ?? "Submission path not extracted yet."}</p>
              {enrichment?.submission_url && (
                <a
                  href={enrichment.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-zinc-800 underline-offset-4 hover:text-zinc-950 hover:underline"
                >
                  Submission/source link <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {enrichment?.timeline && enrichment.timeline.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {enrichment.timeline.map((item) => (
                    <span
                      key={item}
                      className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] text-zinc-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CaptureCard>

          <CaptureCard icon={<Mail className="h-4 w-4" />} label="Risk scan">
            <div className="space-y-3 text-sm leading-6 text-zinc-700">
              <p>{enrichment?.contact ?? "No contact extracted from the source payload."}</p>
              {(enrichment?.award_range ||
                enrichment?.funding_method ||
                enrichment?.matching_funds) && (
                <div className="grid gap-2 rounded-lg bg-zinc-50 p-3 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
                  {enrichment.award_range && <span>Award: {enrichment.award_range}</span>}
                  {enrichment.funding_method && <span>Funding: {enrichment.funding_method}</span>}
                  {enrichment.matching_funds && <span>Match: {enrichment.matching_funds}</span>}
                </div>
              )}
              {enrichment?.risks && enrichment.risks.length > 0 && (
                <ul className="space-y-1.5 text-xs leading-5 text-amber-800">
                  {enrichment.risks.slice(0, 4).map((risk) => (
                    <li key={risk} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CaptureCard>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <SearchCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Confirm fit</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Score, source, deadline, and funder intent.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Draft</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Profile, voice, vault, and opportunity context.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Submit ready</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Review, compliance, packet, and workroom.
            </p>
          </div>
        </div>
      </section>

      {/* Phase 18: Fit reasoning panel — SCORE-01/02/03/04. */}
      {/* Renders above AI summary; only available once detail is loaded. */}
      {detail?.fit_reasoning && (
        <FitReasoningPanel
          oppId={detail.opp_id}
          orgId={orgId}
          fitReasoning={detail.fit_reasoning}
          onRescored={handleRescored}
        />
      )}

      {/* AI summary — REQUIRED render; null falls back to literal string. */}
      <section className="mt-6">
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          AI summary
        </h3>
        <p className="max-w-3xl text-sm leading-7 text-zinc-700">
          {row.summary ?? "No summary generated."}
        </p>
      </section>

      {/* Brief */}
      {row.brief && (
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Opportunity brief
          </h3>
          <div className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-zinc-700">
            {row.brief}
          </div>
        </section>
      )}

      {/* Keywords */}
      {detail && detail.keywords.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detail.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Action row — draft + source */}
      <section className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Run the end-to-end engine
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Creates a proposal workspace, generates draft sections, then
                opens reviewer, compliance, export, and submission workroom flow.
              </p>
            </div>
          </div>
          <DraftButton
            orgId={orgId}
            oppId={row.opp_id}
            triageNote={row.triage_note}
          />
        </div>
        {row.url && (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
          >
            Open at source <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </section>

      {/* Loading / error overlays */}
      {loading && !detail && (
        <p className="mt-6 font-mono text-xs uppercase tracking-wide text-zinc-500">
          Loading detail…
        </p>
      )}
      {error && (
        <p className="mt-6 font-mono text-xs text-amber-700">
          Detail unavailable ({error}). Showing summary from list.
        </p>
      )}
    </div>
  );
}
