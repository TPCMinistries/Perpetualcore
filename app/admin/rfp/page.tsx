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
  loadOrgBreakdown,
  loadOpenDriftRows,
  loadPlatformTotals,
  loadRecentAudit,
  loadRecentCronRuns,
  loadRecentSavedSearchAlerts,
  loadSavedSearchAlertMetrics,
  loadScraperHealth,
  type AuditRow,
  type CronRunRow,
  type OpenDriftRow,
  type OrgRow,
  type PlatformTotals,
  type SavedSearchAlertMetrics,
  type SavedSearchAlertRow,
  type ScraperHealthRow,
} from "@/lib/rfp/admin-metrics";
import {
  buildSourceReadiness,
  summarizeSourceReadiness,
  type SourceReadinessRow,
  type SourceReadinessStatus,
  type SourceReadinessSummary,
} from "@/lib/rfp/source-readiness";
import { SavedSearchAlertOpsPanel } from "@/components/rfp/admin/SavedSearchAlertOpsPanel";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

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

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Tile label="Orgs" value={formatNumber(totals.orgs)} />
      <Tile
        label="Proposals"
        value={formatNumber(totals.proposals)}
        sub={`${formatNumber(totals.proposals_7d)} last 7d`}
      />
      <Tile label="Reviewer runs" value={formatNumber(totals.reviewer_runs)} />
      <Tile label="Vault chunks" value={formatNumber(totals.vault_chunks)} />
      <Tile label="Opportunities" value={formatNumber(totals.opportunities)} />
      <Tile
        label="AI cost · 30d"
        value={formatCurrency(totals.ai_cost_30d_usd)}
        tone={totals.ai_cost_30d_usd > 100 ? "amber" : "emerald"}
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Tile
        label="Indexed"
        value={formatNumber(summary.indexed)}
        sub="verified records"
        tone={summary.indexed >= 80000 ? "emerald" : "amber"}
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

function SourceReadinessTable({ rows }: { rows: SourceReadinessRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-white/5 bg-white/[0.02]">
      <table className="w-full min-w-[980px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Source</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-right">Indexed</th>
            <th className="px-3 py-3 text-right">Drift</th>
            <th className="px-3 py-3">Target</th>
            <th className="px-4 py-3">Next step</th>
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
              <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums text-zinc-300">
                {formatNumber(r.indexed)}
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
              <td className="max-w-[320px] px-4 py-3 text-zinc-400">
                {r.nextStep}
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
      <table className="w-full min-w-[760px] text-[13px]">
        <thead>
          <tr className="border-b border-white/5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <th className="px-4 py-3">Name</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3 text-right">Members</th>
            <th className="px-3 py-3 text-right">Proposals</th>
            <th className="px-3 py-3 text-right">7d</th>
            <th className="px-3 py-3 text-right">$ · 30d</th>
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
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  {r.type}
                </span>
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
                {formatCurrency(r.ai_cost_30d_usd)}
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
    orgs,
    scraperHealth,
    openDrift,
    cronRuns,
    savedSearchAlertMetrics,
    recentSavedSearchAlerts,
    audit,
  ] =
    await Promise.all([
      loadPlatformTotals(),
      loadOrgBreakdown(50),
      loadScraperHealth(),
      loadOpenDriftRows(25),
      loadRecentCronRuns(10),
      loadSavedSearchAlertMetrics(),
      loadRecentSavedSearchAlerts(25),
      loadRecentAudit(50),
    ]);
  const sourceReadiness = buildSourceReadiness(scraperHealth);
  const sourceReadinessSummary = summarizeSourceReadiness(sourceReadiness);

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

      <SectionHeader title="Platform totals" detail="live" />
      <PlatformTilesRow totals={totals} />

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
