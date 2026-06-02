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

import { useEffect, useState, type ReactNode } from "react";
import { FitScoreChip } from "./FitScoreChip";
import { DraftButton } from "@/components/rfp/DraftButton";
import {
  OpportunityTriageControl,
  type OpportunityTriageStatus,
} from "@/components/rfp/OpportunityTriageControl";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  ListChecks,
  Mail,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FeedRow } from "@/lib/rfp/feed";

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

function decisionToneClasses(tone: "emerald" | "amber" | "zinc"): string {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-zinc-200 bg-white text-zinc-700";
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

export function DetailPane({
  orgId,
  selected,
  onTriageChange,
}: DetailPaneProps) {
  const [detail, setDetail] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch single-opp detail whenever the selected row changes.
  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setError(null);
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
  }, [orgId, selected]);

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

      <div className="mt-6">
        <OpportunityTriageControl
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
