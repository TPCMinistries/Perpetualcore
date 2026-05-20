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
 *   4. Recent cron runs — last 10 RFP cron executions.
 *   5. Audit log — last 50 rfp_agent_sessions rows.
 */

import { notFound } from "next/navigation";
import { getRfpPlatformAdmin } from "@/lib/rfp/admin";
import {
  loadOrgBreakdown,
  loadPlatformTotals,
  loadRecentAudit,
  loadRecentCronRuns,
  loadScraperHealth,
  type AuditRow,
  type CronRunRow,
  type OrgRow,
  type PlatformTotals,
  type ScraperHealthRow,
} from "@/lib/rfp/admin-metrics";

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

  // Parallelize the five queries. Each is single-table.
  const [totals, orgs, scraperHealth, cronRuns, audit] = await Promise.all([
    loadPlatformTotals(),
    loadOrgBreakdown(50),
    loadScraperHealth(),
    loadRecentCronRuns(10),
    loadRecentAudit(50),
  ]);

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
        title="Orgs"
        detail={`${orgs.length} most recent · sorted by created_at`}
      />
      <OrgsTable rows={orgs} />

      <SectionHeader title="Scraper health" detail="per source" />
      <ScraperHealthTable rows={scraperHealth} />

      <SectionHeader title="Recent RFP cron runs" detail="last 10" />
      <CronTable rows={cronRuns} />

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
