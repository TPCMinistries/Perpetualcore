/**
 * /admin/rfp — Platform operator dashboard for the RFP product.
 *
 * Server component. Gated by lib/rfp/admin.ts (env-var allowlist).
 * Non-admins get notFound() — never reveal the route exists.
 *
 * Sections:
 *   1. Top tiles — orgs, proposals (all-time + 7d), reviewer runs,
 *      vault chunks, opportunities, AI cost 30d.
 *   2. Per-org table — name, type, members, proposals, drafts 7d, $ 30d.
 *   3. Scraper health — per-source last baseline, opp count, open drifts.
 *   4. Open drift — unresolved parser/source anomalies with resolve action.
 *   5. Recent cron runs — last 10 RFP cron executions.
 *   6. Audit log — last 50 rfp_agent_sessions rows.
 */

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { getRfpPlatformAdmin } from "@/lib/rfp/admin";
import {
  loadActivationFunnelMetrics,
  loadOrgBreakdown,
  loadOpenDriftRows,
  loadPlatformTotals,
  loadPursuitReadinessMetrics,
  loadRecentAudit,
  loadRecentCronRuns,
  loadRecentSavedSearchAlerts,
  loadSavedSearchAlertMetrics,
  loadScraperHealth,
  type AuditRow,
  type ActivationFunnelMetrics,
  type CronRunRow,
  type OpenDriftRow,
  type OrgRow,
  type PlatformTotals,
  type PursuitReadinessMetrics,
  type PursuitReadinessOrgRow,
  type SavedSearchAlertMetrics,
  type SavedSearchAlertRow,
  type ScraperHealthRow,
} from "@/lib/rfp/admin-metrics";
import {
  buildSourcePriorityQueue,
  buildSourceReadiness,
  summarizeSourceReadiness,
  sourceReadinessGap,
  type SourceReadinessRow,
  type SourceReadinessStatus,
  type SourceReadinessSummary,
} from "@/lib/rfp/source-readiness";
import { SavedSearchAlertOpsPanel } from "@/components/rfp/admin/SavedSearchAlertOpsPanel";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { runScoreCoverageRepair } from "@/lib/rfp/scoring/coverage-repair";
import {
  canManualRerunSource,
  rerunRfpSource,
} from "@/lib/rfp/admin-source-rerun";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Platform Admin — RFP Engine",
  robots: { index: false, follow: false },
};

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function formatPercent(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatNullableNumber(n: number | null): string {
  return n === null ? "—" : formatNumber(n);
}

function formatNullableCurrency(n: number | null): string {
  return n === null ? "—" : formatCurrency(n);
}

function formatRelative(iso: string | null): string {
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

function ageHours(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / (60 * 60 * 1000));
}

function summarizeJson(value: Json): string {
  if (value === null) return "No details.";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const text = JSON.stringify(value);
  if (!text) return "No details.";
  return text.length > 260 ? `${text.slice(0, 260)}...` : text;
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Numeric entitlement fields must be zero or greater.");
  }
  return parsed;
}

function parseNullableInteger(value: FormDataEntryValue | null): number | null {
  const parsed = parseNullableNumber(value);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed)) {
    throw new Error("Quota entitlement fields must be whole numbers.");
  }
  return parsed;
}

async function resolveDrift(formData: FormData) {
  "use server";

  const adminUser = await getRfpPlatformAdmin();
  if (!adminUser) notFound();

  const driftId = formData.get("drift_id");
  if (typeof driftId !== "string") {
    throw new Error("Missing drift_id");
  }

  const normalizedId = driftId.trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(normalizedId)) {
    throw new Error("Invalid drift_id");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("rfp_source_drift")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", normalizedId)
    .is("resolved_at", null);

  if (error) {
    throw new Error(`Failed to resolve drift: ${error.message}`);
  }

  revalidatePath("/admin/rfp");
  revalidatePath("/api/health/rfp");
}

async function repairScoreCoverage() {
  "use server";

  const adminUser = await getRfpPlatformAdmin();
  if (!adminUser) notFound();

  await runScoreCoverageRepair({
    maxRepair: 500,
    scanLimit: 20_000,
    logExecution: true,
  });

  revalidatePath("/admin/rfp");
  revalidatePath("/api/health/rfp");
}

async function rerunSource(formData: FormData) {
  "use server";

  const adminUser = await getRfpPlatformAdmin();
  if (!adminUser) notFound();

  const source = formData.get("source");
  if (typeof source !== "string" || !/^[a-z0-9_]+$/i.test(source)) {
    throw new Error("Invalid source");
  }

  const normalizedSource = source.trim();
  if (!canManualRerunSource(normalizedSource)) {
    throw new Error(`No manual runner for source: ${normalizedSource}`);
  }

  await rerunRfpSource(normalizedSource);

  revalidatePath("/admin/rfp");
  revalidatePath("/api/health/rfp");
}

async function updateEntitlement(formData: FormData) {
  "use server";

  const adminUser = await getRfpPlatformAdmin();
  if (!adminUser) notFound();

  const orgId = formData.get("org_id");
  if (typeof orgId !== "string") {
    throw new Error("Missing org_id");
  }

  const normalizedOrgId = orgId.trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(normalizedOrgId)) {
    throw new Error("Invalid org_id");
  }

  const coverageLevel = formData.get("coverage_level");
  if (
    typeof coverageLevel !== "string" ||
    !["free", "l1", "l2", "l3"].includes(coverageLevel)
  ) {
    throw new Error("Invalid coverage level");
  }

  const reasonRaw = formData.get("override_reason");
  const overrideReason =
    typeof reasonRaw === "string" && reasonRaw.trim().length > 0
      ? reasonRaw.trim().slice(0, 240)
      : "operator override";

  const admin = createAdminClient();
  const { error } = await admin.from("rfp_entitlements").upsert(
    {
      org_id: normalizedOrgId,
      coverage_level: coverageLevel,
      monthly_ai_budget_usd: parseNullableNumber(
        formData.get("monthly_ai_budget_usd"),
      ),
      monthly_score_quota: parseNullableInteger(
        formData.get("monthly_score_quota"),
      ),
      monthly_draft_quota: parseNullableInteger(
        formData.get("monthly_draft_quota"),
      ),
      monthly_review_quota: parseNullableInteger(
        formData.get("monthly_review_quota"),
      ),
      monthly_vault_mb: parseNullableInteger(formData.get("monthly_vault_mb")),
      override_by: adminUser.user_id,
      override_reason: overrideReason,
      override_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  );

  if (error) {
    throw new Error(`Failed to update entitlement: ${error.message}`);
  }

  revalidatePath("/admin/rfp");
}

function Tile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "emerald" | "amber";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/[0.04]"
        : "border-white/5 bg-white/[0.02]";
  return (
    <div className={`rounded-lg border ${toneClasses} p-4`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-white">
        {value}
      </div>
      {sub ? (
        <div className="mt-1 font-mono text-[10px] text-zinc-500">{sub}</div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="mt-12 mb-4 flex items-baseline justify-between gap-4">
      <h2
        className="text-xl text-white italic"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {title}
      </h2>
      {detail ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

function PlatformTilesRow({ totals }: { totals: PlatformTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-9">
      <Tile label="Orgs" value={formatNumber(totals.orgs)} />
      <Tile label="Active orgs" value={formatNumber(totals.active_orgs)} />
      <Tile
        label="MRR"
        value={formatCurrency(totals.mrr_usd)}
        tone={totals.mrr_usd > 0 ? "emerald" : "default"}
      />
      <Tile
        label="Proposals"
        value={formatNumber(totals.proposals)}
        sub={`${formatNumber(totals.proposals_7d)} last 7d`}
      />
      <Tile label="Reviewer runs" value={formatNumber(totals.reviewer_runs)} />
      <Tile label="Vault chunks" value={formatNumber(totals.vault_chunks)} />
      <Tile label="Opportunities" value={formatNumber(totals.opportunities)} />
      <Tile
        label="Score coverage"
        value={
          totals.scoring_coverage_percent === null
            ? "—"
            : `${totals.scoring_coverage_percent.toFixed(1)}%`
        }
        sub={`${formatNumber(totals.matches)} / ${formatNumber(totals.expected_matches)}`}
        tone={
          totals.scoring_coverage_percent === null ||
          totals.scoring_coverage_percent < 99.5
            ? "amber"
            : "emerald"
        }
      />
      <Tile
        label="AI cost · 30d"
        value={formatCurrency(totals.ai_cost_30d_usd)}
        tone={totals.ai_cost_30d_usd > 100 ? "amber" : "emerald"}
      />
      <Tile
        label="Margin · 30d"
        value={formatCurrency(totals.gross_margin_30d_usd)}
        sub={formatPercent(totals.gross_margin_percent)}
        tone={totals.gross_margin_30d_usd >= 0 ? "emerald" : "amber"}
      />
    </div>
  );
}

function ActivationFunnelTiles({
  metrics,
}: {
  metrics: ActivationFunnelMetrics;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
      <Tile label="Orgs" value={formatNumber(metrics.orgs)} />
      <Tile
        label="Selected"
        value={formatNumber(metrics.orgs_with_matches)}
        tone={metrics.orgs_with_matches > 0 ? "emerald" : "amber"}
      />
      <Tile
        label="Drafted"
        value={formatNumber(metrics.orgs_with_proposals)}
        tone={metrics.orgs_with_proposals > 0 ? "emerald" : "amber"}
      />
      <Tile
        label="Reviewed"
        value={formatNumber(metrics.orgs_with_reviewer)}
        tone={metrics.orgs_with_reviewer > 0 ? "emerald" : "amber"}
      />
      <Tile
        label="Readiness"
        value={formatNumber(metrics.orgs_with_capture_readiness)}
        tone={metrics.orgs_with_capture_readiness > 0 ? "emerald" : "amber"}
      />
      <Tile
        label="Workroom"
        value={formatNumber(metrics.orgs_with_workroom)}
        tone={metrics.orgs_with_workroom > 0 ? "emerald" : "amber"}
      />
      <Tile label="Drafts · 7d" value={formatNumber(metrics.proposals_7d)} />
      <Tile
        label="Partial · 7d"
        value={formatNumber(metrics.partial_workflows_7d)}
        tone={metrics.partial_workflows_7d > 0 ? "amber" : "emerald"}
      />
    </div>
  );
}

function statusClass(status: SourceReadinessStatus): string {
  switch (status) {
    case "live":
      return "bg-emerald-500/15 text-emerald-200";
    case "degraded":
      return "bg-amber-500/15 text-amber-200";
    case "blocked":
      return "bg-rose-500/15 text-rose-200";
    case "planned":
    default:
      return "bg-zinc-900 text-zinc-400";
  }
}

function SourceReadinessTiles({
  summary,
}: {
  summary: SourceReadinessSummary;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
      <Tile
        label="Indexed"
        value={formatNumber(summary.indexed)}
        sub="verified records"
        tone={
          summary.indexedCoveragePercent !== null &&
          summary.indexedCoveragePercent >= 80
            ? "emerald"
            : "amber"
        }
      />
      <Tile
        label="Target"
        value={formatNumber(summary.targetIndexedEstimate)}
        sub={
          summary.indexedCoveragePercent === null
            ? "catalog estimate"
            : `${summary.indexedCoveragePercent.toFixed(1)}% covered`
        }
        tone={
          summary.indexedCoveragePercent !== null &&
          summary.indexedCoveragePercent >= 80
            ? "emerald"
            : "amber"
        }
      />
      <Tile label="Sources" value={formatNumber(summary.totalSources)} />
      <Tile label="Live" value={formatNumber(summary.live)} tone="emerald" />
      <Tile
        label="Degraded"
        value={formatNumber(summary.degraded)}
        tone={summary.degraded > 0 ? "amber" : "emerald"}
      />
      <Tile label="Planned" value={formatNumber(summary.planned)} />
      <Tile
        label="P0 gaps"
        value={formatNumber(summary.p0Remaining)}
        tone={summary.p0Remaining > 0 ? "amber" : "emerald"}
      />
    </div>
  );
}

function sourceActionLabel(row: SourceReadinessRow): string {
  if (row.effectiveStatus === "degraded") return "Repair drift";
  if (canManualRerunSource(row.source) && row.indexed === 0) return "Run ingest";
  if (canManualRerunSource(row.source)) return "Rerun and QA";
  if (row.effectiveStatus === "planned") return "Build connector";
  if (row.effectiveStatus === "blocked") return "Keep blocked";
  return "Monitor";
}

function SourcePriorityLadder({ rows }: { rows: SourceReadinessRow[] }) {
  const ranked = buildSourcePriorityQueue(rows, 5);

  if (ranked.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-sm text-emerald-100">
        All catalog sources are live with no open drift. Keep monitoring daily
        volume and freshness.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-5">
      {ranked.map((row, index) => (
        <article
          key={row.source}
          className="rounded-lg border border-white/5 bg-white/[0.03] p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              #{index + 1} · {row.priority.toUpperCase()}
            </span>
            <span
              className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClass(
                row.effectiveStatus,
              )}`}
            >
              {row.effectiveStatus}
            </span>
          </div>
          <h3 className="mt-3 text-sm font-semibold leading-5 text-zinc-100">
            {row.label}
          </h3>
          <div className="mt-3 grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            <span>{row.geography} · {row.ingestMode.replace("_", " ")}</span>
            <span>
              gap {formatNumber(sourceReadinessGap(row))} · indexed {formatNumber(row.indexed)}
            </span>
            {row.openDrift > 0 && (
              <span className="text-amber-200">{row.openDrift} open drift</span>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">{row.nextStep}</p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200">
            {sourceActionLabel(row)}
          </div>
        </article>
      ))}
    </div>
  );
}

function SavedSearchAlertTiles({
  metrics,
}: {
  metrics: SavedSearchAlertMetrics;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Tile label="Saved searches" value={formatNumber(metrics.saved_searches)} />
      <Tile
        label="Alerts on"
        value={formatNumber(metrics.alerts_enabled)}
        tone={metrics.alerts_enabled > 0 ? "emerald" : "amber"}
      />
      <Tile
        label="Due now"
        value={formatNumber(metrics.due_now)}
        tone={metrics.due_now > 0 ? "amber" : "emerald"}
      />
      <Tile label="Sent · 24h" value={formatNumber(metrics.sent_24h)} />
      <Tile label="Sent · 7d" value={formatNumber(metrics.sent_7d)} />
      <Tile
        label="Last sent"
        value={formatRelative(metrics.last_sent_at)}
        tone={metrics.last_sent_at ? "emerald" : "amber"}
      />
    </div>
  );
}

type OperatorActionSeverity = "critical" | "watch" | "healthy";

interface OperatorAction {
  id: string;
  label: string;
  detail: string;
  metric: string;
  severity: OperatorActionSeverity;
}

function actionSeverityClass(severity: OperatorActionSeverity): string {
  switch (severity) {
    case "critical":
      return "border-rose-500/25 bg-rose-500/[0.05]";
    case "watch":
      return "border-amber-500/25 bg-amber-500/[0.05]";
    case "healthy":
    default:
      return "border-emerald-500/20 bg-emerald-500/[0.04]";
  }
}

function actionBadgeClass(severity: OperatorActionSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-rose-500/15 text-rose-200";
    case "watch":
      return "bg-amber-500/15 text-amber-200";
    case "healthy":
    default:
      return "bg-emerald-500/15 text-emerald-200";
  }
}

function buildOperatorActions({
  totals,
  sourceReadinessSummary,
  openDrift,
  cronRuns,
  pursuitMetrics,
  savedSearchMetrics,
}: {
  totals: PlatformTotals;
  sourceReadinessSummary: SourceReadinessSummary;
  openDrift: OpenDriftRow[];
  cronRuns: CronRunRow[];
  pursuitMetrics: PursuitReadinessMetrics;
  savedSearchMetrics: SavedSearchAlertMetrics;
}): OperatorAction[] {
  const actions: OperatorAction[] = [];
  const latestCron = cronRuns[0] ?? null;
  const latestCronAge = ageHours(latestCron?.executed_at ?? null);

  if (!latestCron) {
    actions.push({
      id: "cron-missing",
      label: "Cron logging is missing",
      detail: "Run the federal and state/city discovery jobs, then verify rfp_cron_runs is recording executions.",
      metric: "0 runs",
      severity: "critical",
    });
  } else if (latestCron.status !== "success") {
    actions.push({
      id: "cron-error",
      label: "Latest discovery cron failed",
      detail: `${latestCron.cron_name} last reported ${latestCron.status ?? "unknown"}. Inspect Vercel logs before relying on inventory freshness.`,
      metric: formatRelative(latestCron.executed_at),
      severity: "critical",
    });
  } else if (latestCronAge !== null && latestCronAge > 36) {
    actions.push({
      id: "cron-stale",
      label: "Discovery cron is stale",
      detail: "The latest successful cron is outside the 36-hour freshness window. Trigger discovery and confirm the schedule.",
      metric: formatRelative(latestCron.executed_at),
      severity: "watch",
    });
  }

  if (openDrift.length > 0) {
    actions.push({
      id: "source-drift",
      label: "Resolve source drift",
      detail: "Parser/source anomalies are open. Verify the affected source before marking drift resolved.",
      metric: `${formatNumber(openDrift.length)} open`,
      severity: "critical",
    });
  }

  if (
    totals.scoring_coverage_percent !== null &&
    totals.scoring_coverage_percent < 99.5
  ) {
    actions.push({
      id: "scoring-coverage",
      label: "Repair scoring coverage",
      detail:
        "Some indexed opportunities are missing org-specific match rows. Run the coverage repair job before relying on rankings or alerts.",
      metric: `${formatNumber(totals.matches)} / ${formatNumber(totals.expected_matches)}`,
      severity: "critical",
    });
  }

  if (sourceReadinessSummary.p0Remaining > 0) {
    actions.push({
      id: "source-p0",
      label: "Close P0 source gaps",
      detail: "Priority source coverage is not fully live. Use the source readiness table to pick the next connector or drift repair.",
      metric: `${formatNumber(sourceReadinessSummary.p0Remaining)} gaps`,
      severity: "watch",
    });
  }

  if (
    sourceReadinessSummary.indexedCoveragePercent !== null &&
    sourceReadinessSummary.indexedCoveragePercent < 80
  ) {
    actions.push({
      id: "inventory-scale",
      label: "Scale verified inventory",
      detail: "Indexed inventory is below catalog coverage target — keep all public copy tied to the live verified count.",
      metric: `${sourceReadinessSummary.indexedCoveragePercent.toFixed(1)}% covered`,
      severity: "watch",
    });
  }

  if (savedSearchMetrics.alerts_enabled === 0 && savedSearchMetrics.saved_searches > 0) {
    actions.push({
      id: "alerts-disabled",
      label: "Convert saved searches into alerts",
      detail: "Users have saved searches but no active alert delivery. Improve activation prompts or default alert setup.",
      metric: `${formatNumber(savedSearchMetrics.saved_searches)} saved`,
      severity: "watch",
    });
  } else if (savedSearchMetrics.due_now > 0) {
    actions.push({
      id: "alerts-due",
      label: "Run due saved-search alerts",
      detail: "Saved searches are due for delivery. Use the alert ops runner or wait for the scheduled cron.",
      metric: `${formatNumber(savedSearchMetrics.due_now)} due`,
      severity: "watch",
    });
  }

  if (pursuitMetrics.critical_tasks > 0 || pursuitMetrics.blocked > 0) {
    actions.push({
      id: "pursuit-blockers",
      label: "Clear pursuit blockers",
      detail: "Proposal workrooms have critical tasks or blocked readiness. Review the org rows below and unblock the highest-risk team first.",
      metric: `${formatNumber(pursuitMetrics.critical_tasks)} critical`,
      severity: "critical",
    });
  } else if (pursuitMetrics.proposals > 0 && pursuitMetrics.average_score < 70) {
    actions.push({
      id: "pursuit-readiness",
      label: "Lift proposal readiness",
      detail: "Average readiness is below ship quality. Run capture readiness, reviewer, and packet checklist on active pursuits.",
      metric: `${formatNumber(pursuitMetrics.average_score)} avg`,
      severity: "watch",
    });
  }

  if (totals.proposals === 0 && totals.orgs > 0) {
    actions.push({
      id: "activation",
      label: "Drive first proposal activation",
      detail: "Organizations exist, but no proposals have been created. The next product goal is getting a user from discovery to a workroom.",
      metric: "0 proposals",
      severity: "watch",
    });
  }

  if (totals.mrr_usd > 0 && totals.gross_margin_percent !== null) {
    if (totals.gross_margin_percent < 70) {
      actions.push({
        id: "margin-risk",
        label: "Review AI margin",
        detail:
          "Thirty-day AI spend is compressing subscription margin. Check org budgets and high-cost agent sessions before adding more design partners.",
        metric: formatPercent(totals.gross_margin_percent),
        severity: "watch",
      });
    }
  } else if (totals.ai_cost_30d_usd > 0 && totals.mrr_usd === 0) {
    actions.push({
      id: "unfunded-ai-spend",
      label: "AI spend has no matched MRR",
      detail:
        "The product is accruing AI costs without active RFP subscription revenue. Confirm beta/test org budgets are intentional.",
      metric: formatCurrency(totals.ai_cost_30d_usd),
      severity: "watch",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "healthy",
      label: "System is clear",
      detail: "Discovery, source drift, alerts, and pursuit readiness have no current operator blockers.",
      metric: "ready",
      severity: "healthy",
    });
  }

  return actions
    .sort((a, b) => {
      const rank: Record<OperatorActionSeverity, number> = {
        critical: 0,
        watch: 1,
        healthy: 2,
      };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 6);
}

function OperatorActionQueue({ actions }: { actions: OperatorAction[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`rounded-lg border p-4 ${actionSeverityClass(action.severity)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${actionBadgeClass(
                action.severity,
              )}`}
            >
              {action.severity}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-zinc-400">
              {action.metric}
            </span>
          </div>
          <div className="mt-3 text-sm font-semibold text-zinc-100">
            {action.label}
          </div>
          <p className="mt-2 text-[12px] leading-5 text-zinc-500">
            {action.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function PursuitReadinessTiles({
  metrics,
}: {
  metrics: PursuitReadinessMetrics;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Tile
        label="Avg readiness"
        value={`${formatNumber(metrics.average_score)}`}
        sub={`${formatNumber(metrics.proposals)} proposals`}
        tone={
          metrics.average_score >= 80
            ? "emerald"
            : metrics.average_score >= 55
              ? "amber"
              : "default"
        }
      />
      <Tile
        label="Ready"
        value={formatNumber(metrics.ready + metrics.submitted)}
        tone={metrics.ready + metrics.submitted > 0 ? "emerald" : "default"}
      />
      <Tile
        label="Blocked"
        value={formatNumber(metrics.blocked)}
        tone={metrics.blocked > 0 ? "amber" : "emerald"}
      />
      <Tile label="In progress" value={formatNumber(metrics.in_progress)} />
      <Tile
        label="Critical tasks"
        value={formatNumber(metrics.critical_tasks)}
        tone={metrics.critical_tasks > 0 ? "amber" : "emerald"}
      />
      <Tile
        label="Packages"
        value={formatNumber(metrics.package_imported)}
        sub={`${formatNumber(metrics.compliance_run)} readiness runs`}
        tone={metrics.package_imported > 0 ? "emerald" : "default"}
      />
    </div>
  );
}

function PursuitReadinessOrgTable({
  rows,
}: {
  rows: PursuitReadinessOrgRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 rounded-md border border-white/5 bg-white/[0.02] p-6 text-sm text-zinc-500">
        No proposal readiness data yet. Once pursuits create proposal workrooms,
        readiness distribution appears here.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Org</th>
            <th className="px-3 py-3 text-right">Avg</th>
            <th className="px-3 py-3 text-right">Proposals</th>
            <th className="px-3 py-3 text-right">Ready</th>
            <th className="px-3 py-3 text-right">Blocked</th>
            <th className="px-3 py-3 text-right">In progress</th>
            <th className="px-4 py-3 text-right">Critical tasks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.org_id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <div className="text-zinc-200">
                  {row.org_name ?? row.org_id.slice(0, 8)}
                </div>
                <div className="mt-1 font-mono text-[10px] text-zinc-600">
                  {row.org_id.slice(0, 8)}
                </div>
              </td>
              <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-zinc-200">
                {row.average_score}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                {row.proposals}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-emerald-300">
                {row.ready + row.submitted}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-amber-300">
                {row.blocked}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                {row.in_progress}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                {row.critical_tasks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceReadinessTable({ rows }: { rows: SourceReadinessRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[1280px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Source</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Geo</th>
            <th className="px-3 py-3">Mode</th>
            <th className="px-3 py-3 text-right">Indexed</th>
            <th className="px-3 py-3 text-right">Target</th>
            <th className="px-3 py-3 text-right">Drift</th>
            <th className="px-3 py-3">Scope</th>
            <th className="px-3 py-3">Next step</th>
            <th className="px-4 py-3 text-right">Rerun</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.source}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3">
                <div className="text-zinc-100">{r.label}</div>
                <div className="mt-1 font-mono text-[10px] text-zinc-600">
                  {r.source} · {r.priority.toUpperCase()}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {r.category}
                </span>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusClass(
                    r.effectiveStatus,
                  )}`}
                >
                  {r.effectiveStatus}
                </span>
              </td>
              <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {r.geography}
              </td>
              <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {r.ingestMode.replace("_", " ")}
              </td>
              <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-zinc-300">
                {formatNumber(r.indexed)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-zinc-400">
                {r.targetIndexedEstimate === null
                  ? "—"
                  : formatNumber(r.targetIndexedEstimate)}
              </td>
              <td className="px-3 py-3 text-right">
                <div
                  className={`font-mono text-[12px] tabular-nums ${
                    r.openDrift > 0 ? "text-amber-200" : "text-zinc-600"
                  }`}
                >
                  {r.openDrift}
                </div>
                <div className="font-mono text-[10px] text-zinc-600">
                  {formatRelative(r.lastDriftAt)}
                </div>
              </td>
              <td className="max-w-[220px] px-3 py-3 text-zinc-400">
                {r.targetScale}
              </td>
              <td className="max-w-[320px] px-3 py-3 text-zinc-400">
                {r.nextStep}
              </td>
              <td className="px-4 py-3 text-right">
                {canManualRerunSource(r.source) ? (
                  <form action={rerunSource}>
                    <input type="hidden" name="source" value={r.source} />
                    <button
                      type="submit"
                      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-100"
                    >
                      Rerun
                    </button>
                  </form>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                    No runner
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrgsTable({ rows }: { rows: OrgRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-sm text-zinc-500">
        No orgs yet. The first /orgs/new submission populates this table.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[1320px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Name</th>
            <th className="px-3 py-3">Plan</th>
            <th className="px-3 py-3 text-right">Members</th>
            <th className="px-3 py-3 text-right">Proposals</th>
            <th className="px-3 py-3 text-right">7d</th>
            <th className="px-3 py-3 text-right">MRR</th>
            <th className="px-3 py-3 text-right">$ · 30d</th>
            <th className="px-3 py-3 text-right">Margin</th>
            <th className="px-3 py-3">Budget</th>
            <th className="px-3 py-3">Quotas</th>
            <th className="px-4 py-3">Override</th>
            <th className="px-4 py-3 text-right">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3 text-zinc-100">{r.name}</td>
              <td className="px-3 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                  {r.subscription_tier ?? "none"}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  {r.subscription_status ?? "no subscription"} · {r.type}
                </div>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                {r.members}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                {r.proposals}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                <span
                  className={
                    r.proposals_7d > 0 ? "text-emerald-300" : "text-zinc-600"
                  }
                >
                  {r.proposals_7d}
                </span>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-200">
                {formatCurrency(r.mrr_usd)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-200">
                {formatCurrency(r.ai_cost_30d_usd)}
              </td>
              <td className="px-3 py-3 text-right">
                <div
                  className={`tabular-nums ${
                    r.gross_margin_30d_usd >= 0
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {formatCurrency(r.gross_margin_30d_usd)}
                </div>
                <div className="mt-1 font-mono text-[10px] text-zinc-600">
                  {formatPercent(r.gross_margin_percent)}
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {r.coverage_level ?? "missing"}
                </div>
                <div
                  className={`mt-1 font-mono text-[10px] ${
                    r.monthly_ai_budget_usd !== null &&
                    r.ai_cost_30d_usd >= r.monthly_ai_budget_usd
                      ? "text-amber-300"
                      : "text-zinc-600"
                  }`}
                >
                  {formatNullableCurrency(r.monthly_ai_budget_usd)} cap
                </div>
              </td>
              <td className="px-3 py-3 font-mono text-[10px] leading-5 text-zinc-500">
                <div>score {formatNullableNumber(r.monthly_score_quota)}</div>
                <div>draft {formatNullableNumber(r.monthly_draft_quota)}</div>
                <div>review {formatNullableNumber(r.monthly_review_quota)}</div>
                <div>vault {formatNullableNumber(r.monthly_vault_mb)} MB</div>
              </td>
              <td className="px-4 py-3">
                <form action={updateEntitlement} className="min-w-[360px]">
                  <input type="hidden" name="org_id" value={r.id} />
                  <div className="grid grid-cols-5 gap-2">
                    <select
                      name="coverage_level"
                      defaultValue={r.coverage_level ?? "free"}
                      className="col-span-1 rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100"
                    >
                      <option value="free">free</option>
                      <option value="l1">l1</option>
                      <option value="l2">l2</option>
                      <option value="l3">l3</option>
                    </select>
                    <input
                      name="monthly_ai_budget_usd"
                      inputMode="decimal"
                      defaultValue={r.monthly_ai_budget_usd ?? ""}
                      placeholder="$ cap"
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                    />
                    <input
                      name="monthly_score_quota"
                      inputMode="numeric"
                      defaultValue={r.monthly_score_quota ?? ""}
                      placeholder="score"
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                    />
                    <input
                      name="monthly_draft_quota"
                      inputMode="numeric"
                      defaultValue={r.monthly_draft_quota ?? ""}
                      placeholder="draft"
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                    />
                    <input
                      name="monthly_review_quota"
                      inputMode="numeric"
                      defaultValue={r.monthly_review_quota ?? ""}
                      placeholder="review"
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_96px] gap-2">
                    <input
                      name="monthly_vault_mb"
                      inputMode="numeric"
                      defaultValue={r.monthly_vault_mb ?? ""}
                      placeholder="vault MB"
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-100 transition hover:bg-emerald-500/20"
                    >
                      Save
                    </button>
                  </div>
                  <input
                    name="override_reason"
                    defaultValue={r.override_reason ?? ""}
                    placeholder="reason"
                    className="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-700"
                  />
                  {r.override_at ? (
                    <div className="mt-1 font-mono text-[10px] text-zinc-600">
                      last override {formatRelative(r.override_at)}
                    </div>
                  ) : null}
                </form>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[11px] text-zinc-500">
                {formatRelative(r.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScraperHealthTable({ rows }: { rows: ScraperHealthRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[680px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Source</th>
            <th className="px-3 py-3 text-right">Opps</th>
            <th className="px-3 py-3 text-right">Last baseline</th>
            <th className="px-3 py-3 text-right">Last drift</th>
            <th className="px-4 py-3 text-right">Open drift</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.source}
              className="border-b border-white/5 last:border-0"
            >
              <td className="px-4 py-3 font-mono text-[12px] text-zinc-200">
                {r.source}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                {r.opportunities_total}
              </td>
              <td className="px-3 py-3 text-right">
                <div className="font-mono text-[11px] text-zinc-400">
                  {r.last_baseline_parsed === null
                    ? "—"
                    : `${r.last_baseline_parsed} rows`}
                </div>
                <div className="font-mono text-[10px] text-zinc-600">
                  {formatRelative(r.last_baseline_at)}
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                <div
                  className={`font-mono text-[11px] ${
                    r.last_drift_reason ? "text-amber-300" : "text-zinc-600"
                  }`}
                >
                  {r.last_drift_reason ?? "—"}
                </div>
                <div className="font-mono text-[10px] text-zinc-600">
                  {formatRelative(r.last_drift_at)}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-mono text-[10px] ${
                    r.open_drift_events > 0
                      ? "bg-amber-500/15 text-amber-200"
                      : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {r.open_drift_events}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpenDriftTable({ rows }: { rows: OpenDriftRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-sm text-emerald-200">
        No open drift events. Discovery sources are clear.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-amber-500/20 bg-amber-500/[0.03]">
      <table className="w-full min-w-[920px] text-[13px]">
        <thead>
          <tr className="border-b border-amber-500/10 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/70">
            <th className="px-4 py-3">Source</th>
            <th className="px-3 py-3">Reason</th>
            <th className="px-3 py-3">Details</th>
            <th className="px-3 py-3 text-right">Opened</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-amber-500/10 last:border-0"
            >
              <td className="px-4 py-3 font-mono text-[12px] text-zinc-100">
                {r.source}
              </td>
              <td className="px-3 py-3">
                <span className="rounded-full bg-amber-500/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-100">
                  {r.reason}
                </span>
              </td>
              <td className="max-w-[460px] px-3 py-3 font-mono text-[11px] leading-5 text-zinc-400">
                {summarizeJson(r.details)}
              </td>
              <td className="px-3 py-3 text-right font-mono text-[11px] text-zinc-500">
                {formatRelative(r.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <form action={resolveDrift}>
                  <input type="hidden" name="drift_id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-100"
                  >
                    Resolve
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CronTable({ rows }: { rows: CronRunRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-sm text-zinc-500">
        No RFP cron executions logged. Vercel cron schedules in vercel.json:
        rfp-discovery-federal (every 6h) and rfp-discovery-state-city.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Cron</th>
            <th className="px-3 py-3 text-right">Executed</th>
            <th className="px-3 py-3 text-right">Status</th>
            <th className="px-4 py-3 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={`${r.cron_name}-${idx}`}
              className="border-b border-white/5 last:border-0"
            >
              <td className="px-4 py-3 font-mono text-[12px] text-zinc-200">
                {r.cron_name}
              </td>
              <td className="px-3 py-3 text-right font-mono text-[11px] text-zinc-500">
                {formatRelative(r.executed_at)}
              </td>
              <td className="px-3 py-3 text-right">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                    r.status === "success"
                      ? "text-emerald-300"
                      : r.status === "error"
                        ? "text-rose-300"
                        : "text-zinc-500"
                  }`}
                >
                  {r.status ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-400">
                {r.duration_ms !== null ? `${r.duration_ms}ms` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SavedSearchAlertsTable({ rows }: { rows: SavedSearchAlertRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-sm text-zinc-500">
        No saved-search alert deliveries logged yet. Once users enable alerts,
        rfp-saved-search-alerts writes dedupe rows here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[860px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">When</th>
            <th className="px-3 py-3">Search</th>
            <th className="px-3 py-3">Org</th>
            <th className="px-3 py-3">Opportunity</th>
            <th className="px-4 py-3">Recipient</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                {formatRelative(row.sent_at)}
              </td>
              <td className="px-3 py-3">
                <div className="text-zinc-200">
                  {row.search_name ?? "Unknown search"}
                </div>
                <div className="mt-1 font-mono text-[10px] text-zinc-600">
                  {row.search_id.slice(0, 8)}
                </div>
              </td>
              <td className="px-3 py-3 text-zinc-300">
                {row.org_name ?? row.org_id.slice(0, 8)}
              </td>
              <td className="max-w-[300px] px-3 py-3 text-zinc-400">
                {row.opp_title ?? row.opp_id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                {row.email || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreCoverageOpsPanel({ totals }: { totals: PlatformTotals }) {
  const healthy =
    totals.scoring_coverage_percent !== null &&
    totals.scoring_coverage_percent >= 99.5;
  const missing = Math.max(0, totals.expected_matches - totals.matches);

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${
        healthy
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-amber-500/25 bg-amber-500/[0.05]"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Scoring coverage repair
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-400">
            {healthy
              ? "Coverage is complete. Run this only after imports, org changes, or alert/ranking drift."
              : `${formatNumber(missing)} org-opportunity match rows are missing. Repair before trusting rankings, alerts, or bid/no-bid recommendations.`}
          </p>
          <div className="mt-2 font-mono text-[11px] text-zinc-500">
            {formatNumber(totals.matches)} / {formatNumber(totals.expected_matches)} matches
            {totals.scoring_coverage_percent === null
              ? ""
              : ` · ${totals.scoring_coverage_percent.toFixed(1)}%`}
          </div>
        </div>
        <form action={repairScoreCoverage}>
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-100 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-100"
          >
            Run repair
          </button>
        </form>
      </div>
    </div>
  );
}

function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-sm text-zinc-500">
        No agent sessions yet. Drafter / voice / vault / reviewer runs all
        write here.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[820px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">When</th>
            <th className="px-3 py-3">Org</th>
            <th className="px-3 py-3">Agent</th>
            <th className="px-3 py-3">Model</th>
            <th className="px-3 py-3 text-right">Tokens</th>
            <th className="px-4 py-3 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                {formatRelative(r.created_at)}
              </td>
              <td className="px-3 py-3 text-zinc-200">
                {r.org_name ?? <span className="text-zinc-600">—</span>}
              </td>
              <td className="px-3 py-3">
                <span className="font-mono text-[11px] text-emerald-300">
                  {r.agent}
                </span>
              </td>
              <td className="px-3 py-3 font-mono text-[11px] text-zinc-400">
                {r.model ?? "—"}
              </td>
              <td className="px-3 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-400">
                {r.tokens_in ?? 0} / {r.tokens_out ?? 0}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-zinc-200">
                {formatCurrency(r.cost_usd ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminRfpPage() {
  const admin = await getRfpPlatformAdmin();
  if (!admin) {
    notFound();
  }

  // Parallelize the six queries. Each is single-table.
  const [
    totals,
    activationFunnel,
    orgs,
    scraperHealth,
    openDrift,
    cronRuns,
    pursuitReadiness,
    savedSearchAlertMetrics,
    recentSavedSearchAlerts,
    audit,
  ] =
    await Promise.all([
      loadPlatformTotals(),
      loadActivationFunnelMetrics(),
      loadOrgBreakdown(50),
      loadScraperHealth(),
      loadOpenDriftRows(25),
      loadRecentCronRuns(10),
      loadPursuitReadinessMetrics(),
      loadSavedSearchAlertMetrics(),
      loadRecentSavedSearchAlerts(25),
      loadRecentAudit(50),
    ]);
  const sourceReadiness = buildSourceReadiness(scraperHealth);
  const sourceReadinessSummary = summarizeSourceReadiness(sourceReadiness);
  const operatorActions = buildOperatorActions({
    totals,
    sourceReadinessSummary,
    openDrift,
    cronRuns,
    pursuitMetrics: pursuitReadiness.metrics,
    savedSearchMetrics: savedSearchAlertMetrics,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300">
        Platform admin · RFP Engine
      </div>
      <h1
        className="mt-3 text-3xl text-white italic"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Operator dashboard
      </h1>
      <p className="mt-2 text-[13px] text-zinc-500">
        Signed in as <span className="text-zinc-300">{admin.email}</span>.
        This page is not indexed and not exposed to tenants.
      </p>

      <SectionHeader title="Operator action queue" detail="ranked by urgency" />
      <OperatorActionQueue actions={operatorActions} />

      <SectionHeader title="Activation funnel" detail="first-run proof loop" />
      <ActivationFunnelTiles metrics={activationFunnel} />
      <p className="mt-3 text-[13px] leading-6 text-zinc-500">
        This tracks the core customer path: select a match, create a draft,
        run reviewer, generate readiness artifacts, and create the submission
        workroom.
      </p>

      <SectionHeader title="Platform totals" detail="live" />
      <PlatformTilesRow totals={totals} />
      <ScoreCoverageOpsPanel totals={totals} />

      <SectionHeader
        title="Source scale readiness"
        detail="verified coverage vs target catalog"
      />
      <SourceReadinessTiles summary={sourceReadinessSummary} />
      <p className="mt-3 text-[13px] leading-6 text-zinc-500">
        This is the operational view for scale claims. Public copy should use
        the verified indexed count until the live source catalog supports a
        larger number.
      </p>
      <SourcePriorityLadder rows={sourceReadiness} />
      <SourceReadinessTable rows={sourceReadiness} />

      <SectionHeader
        title="Orgs"
        detail={`${orgs.length} most recent · sorted by created_at`}
      />
      <OrgsTable rows={orgs} />

      <SectionHeader title="Scraper health" detail="per source" />
      <ScraperHealthTable rows={scraperHealth} />

      <SectionHeader
        title="Open drift"
        detail={`${openDrift.length} unresolved · verify before resolving`}
      />
      <OpenDriftTable rows={openDrift} />

      <SectionHeader title="Recent RFP cron runs" detail="last 10" />
      <CronTable rows={cronRuns} />

      <SectionHeader
        title="Pursuit readiness"
        detail="proposal workroom health"
      />
      <PursuitReadinessTiles metrics={pursuitReadiness.metrics} />
      <p className="mt-3 text-[13px] leading-6 text-zinc-500">
        Same scoring model used on tenant pursuit pages. This shows whether
        the engine is moving opportunities toward submission-ready packets or
        leaving teams with blocked work queues.
      </p>
      <PursuitReadinessOrgTable rows={pursuitReadiness.orgs} />

      <SectionHeader
        title="Saved-search alerts"
        detail="delivery and due-state"
      />
      <SavedSearchAlertTiles metrics={savedSearchAlertMetrics} />
      <p className="mt-3 text-[13px] leading-6 text-zinc-500">
        This is the discovery reach monitor: alerts enabled, searches due for
        the cron, and actual delivery dedupe rows written after email sends.
      </p>
      <div className="mt-4">
        <SavedSearchAlertOpsPanel />
      </div>
      <div className="mt-4">
        <SavedSearchAlertsTable rows={recentSavedSearchAlerts} />
      </div>

      <SectionHeader title="Audit log" detail="last 50 agent sessions" />
      <AuditTable rows={audit} />

      <div className="mt-16 border-t border-white/5 pt-8 text-[11px] text-zinc-600">
        Access controlled via{" "}
        <code className="font-mono text-zinc-500">
          RFP_PLATFORM_ADMIN_USER_IDS
        </code>{" "}
        env. To grant access, append a Supabase auth user_id to that
        comma-separated allowlist in Vercel.
      </div>
    </main>
  );
}
