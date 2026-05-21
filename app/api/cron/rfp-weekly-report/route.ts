/**
 * GET /api/cron/rfp-weekly-report
 *
 * Sunday cron (vercel.json: "0 14 * * 0" = Sunday 14:00 UTC = 9am Central).
 * Emails Lorenzo a 7-day operator summary so he doesn't have to remember
 * to check /admin/rfp.
 *
 * Recipients: RFP_WEEKLY_REPORT_TO env (comma-separated). Falls back to
 * lorenzo@tpcmin.org. Subject line includes the date range.
 *
 * Same metrics as /admin/rfp top-row tiles, framed as deltas-this-week.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, EMAIL_CONFIG } from "@/lib/email/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM_ADDRESS = EMAIL_CONFIG.from;
const DEFAULT_TO = "lorenzo@tpcmin.org";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

interface Metrics {
  orgs_new_7d: number;
  proposals_7d: number;
  reviewer_runs_7d: number;
  vault_chunks_added_7d: number;
  ai_cost_7d_usd: number;
  open_drift_events: number;
  last_opportunity_at: string | null;
  total_orgs: number;
}

async function loadMetrics(): Promise<Metrics> {
  const admin = createAdminClient();
  const sevenDaysAgo = isoDaysAgo(7);

  const [
    orgsNew,
    totalOrgs,
    proposals,
    reviewer,
    vault,
    cost,
    drift,
    lastOpp,
  ] = await Promise.all([
    admin
      .from("rfp_orgs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin.from("rfp_orgs").select("id", { count: "exact", head: true }),
    admin
      .from("rfp_proposals")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("rfp_agent_sessions")
      .select("id", { count: "exact", head: true })
      .eq("agent", "reviewer_v1")
      .gte("created_at", sevenDaysAgo),
    admin
      .from("rfp_vault_artifacts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("rfp_agent_sessions")
      .select("cost_usd")
      .gte("created_at", sevenDaysAgo)
      .returns<{ cost_usd: number | string | null }[]>(),
    admin
      .from("rfp_source_drift")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    admin
      .from("rfp_opportunities")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
  ]);

  return {
    orgs_new_7d: orgsNew.count ?? 0,
    total_orgs: totalOrgs.count ?? 0,
    proposals_7d: proposals.count ?? 0,
    reviewer_runs_7d: reviewer.count ?? 0,
    vault_chunks_added_7d: vault.count ?? 0,
    ai_cost_7d_usd: (cost.data ?? []).reduce((s, r) => s + toNum(r.cost_usd), 0),
    open_drift_events: drift.count ?? 0,
    last_opportunity_at: lastOpp.data?.created_at ?? null,
  };
}

function buildHtml(m: Metrics, rangeLabel: string): string {
  const tile = (label: string, value: string, sub?: string): string =>
    `<td style="padding:14px 16px;border:1px solid #27272a;background:#0a0a0a;width:50%;">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#71717a;">${label}</div>
      <div style="font-size:24px;font-weight:600;color:#fafafa;margin-top:6px;font-variant-numeric:tabular-nums;">${value}</div>
      ${sub ? `<div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#71717a;margin-top:4px;">${sub}</div>` : ""}
    </td>`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 16px 0;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#34d399;">RFP Engine · weekly</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#fafafa;margin-top:6px;">Operator report</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#71717a;margin-top:4px;">${rangeLabel}</div>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 8px;">
            <tr>
              ${tile("New orgs · 7d", String(m.orgs_new_7d), `of ${m.total_orgs} total`)}
              ${tile("Proposals · 7d", String(m.proposals_7d))}
            </tr>
            <tr>
              ${tile("Reviewer runs · 7d", String(m.reviewer_runs_7d))}
              ${tile("Vault chunks added · 7d", String(m.vault_chunks_added_7d))}
            </tr>
            <tr>
              ${tile("AI cost · 7d", fmtUsd(m.ai_cost_7d_usd))}
              ${tile("Open scraper drift", String(m.open_drift_events), m.open_drift_events > 0 ? "needs triage" : "all green")}
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 8px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
          <p style="margin:0 0 12px 0;">Last opportunity ingested: <span style="color:#e4e4e7;">${m.last_opportunity_at ? new Date(m.last_opportunity_at).toLocaleString("en-US") : "never"}</span></p>
          <p style="margin:0;">Full breakdown → <a href="https://rfp.perpetualcore.com/admin/rfp" style="color:#34d399;text-decoration:underline;">/admin/rfp</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 503 });
  }

  const recipients = (process.env.RFP_WEEKLY_REPORT_TO ?? DEFAULT_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "no_recipients" }, { status: 503 });
  }

  let metrics: Metrics;
  try {
    metrics = await loadMetrics();
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "metrics_failed", detail: detail.slice(0, 200) },
      { status: 500 },
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const rangeLabel = `${fmt(sevenDaysAgo)} → ${fmt(now)}`;

  const html = buildHtml(metrics, rangeLabel);
  const subject = `RFP Engine · weekly · ${rangeLabel}`;

  const res = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipients,
    subject,
    html,
  });

  if (res.error) {
    return NextResponse.json(
      { error: "resend_failed", detail: res.error.message?.slice(0, 200) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    sent_to: recipients,
    email_id: res.data?.id ?? null,
    metrics,
  });
}
