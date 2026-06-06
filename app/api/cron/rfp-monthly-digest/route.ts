/**
 * GET /api/cron/rfp-monthly-digest
 *
 * First-of-month cron (vercel.json: "0 14 1 * *" — 14:00 UTC = 9am
 * Central on day 1). For each org with ANY activity in the last 30
 * days, sends the owner a digest of:
 *
 *   - Opportunities surfaced (new opps in their feed window)
 *   - Drafts created
 *   - Reviewer runs
 *   - Win/loss outcomes
 *   - AI cost ($ across drafter/voice/vault/reviewer)
 *
 * Different from sequences (which step from a trigger). This is a
 * pure recurring per-org email. One row per org per month.
 *
 * Tenant respect: orgs that have unsubscribed from ANY rfp sequence
 * are NOT skipped here — this is a transactional ops digest, not a
 * marketing nurture. A future tenant-facing email-prefs UI may add
 * an opt-out specifically for this; today we send to all owners.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, EMAIL_CONFIG } from "@/lib/email/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const FROM_ADDRESS = EMAIL_CONFIG.from;

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

interface OrgDigest {
  org_id: string;
  org_name: string;
  owner_email: string;
  proposals_30d: number;
  reviewer_runs_30d: number;
  vault_chunks_added_30d: number;
  won_30d: number;
  lost_30d: number;
  submitted_30d: number;
  ai_cost_30d_usd: number;
}

async function buildDigests(): Promise<OrgDigest[]> {
  const admin = createAdminClient();
  const thirtyDaysAgo = isoDaysAgo(30);

  const { data: orgs } = await admin
    .from("rfp_orgs")
    .select("id, name")
    .returns<{ id: string; name: string }[]>();
  if (!orgs || orgs.length === 0) return [];

  const orgIds = orgs.map((o) => o.id);

  const [proposalsRes, agentRes, vaultRes] = await Promise.all([
    admin
      .from("rfp_proposals")
      .select("org_id, status, created_at, updated_at")
      .in("org_id", orgIds)
      .returns<
        {
          org_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        }[]
      >(),
    admin
      .from("rfp_agent_sessions")
      .select("org_id, agent, cost_usd, created_at")
      .in("org_id", orgIds)
      .gte("created_at", thirtyDaysAgo)
      .returns<
        {
          org_id: string;
          agent: string;
          cost_usd: number | string | null;
          created_at: string;
        }[]
      >(),
    admin
      .from("rfp_vault_artifacts")
      .select("org_id, created_at")
      .in("org_id", orgIds)
      .gte("created_at", thirtyDaysAgo)
      .returns<{ org_id: string; created_at: string }[]>(),
  ]);

  // Roll up per-org.
  const init = (): Omit<OrgDigest, "org_id" | "org_name" | "owner_email"> => ({
    proposals_30d: 0,
    reviewer_runs_30d: 0,
    vault_chunks_added_30d: 0,
    won_30d: 0,
    lost_30d: 0,
    submitted_30d: 0,
    ai_cost_30d_usd: 0,
  });
  const roll = new Map<string, ReturnType<typeof init>>();
  for (const id of orgIds) roll.set(id, init());

  for (const p of proposalsRes.data ?? []) {
    const bucket = roll.get(p.org_id);
    if (!bucket) continue;
    if (p.created_at >= thirtyDaysAgo) bucket.proposals_30d++;
    // Status transitions in the last 30 days — approximated by
    // updated_at (the status PATCH bumps updated_at).
    if (p.updated_at >= thirtyDaysAgo) {
      if (p.status === "won") bucket.won_30d++;
      else if (p.status === "lost") bucket.lost_30d++;
      else if (p.status === "submitted") bucket.submitted_30d++;
    }
  }

  for (const a of agentRes.data ?? []) {
    const bucket = roll.get(a.org_id);
    if (!bucket) continue;
    bucket.ai_cost_30d_usd += toNum(a.cost_usd);
    if (a.agent === "reviewer_v1") bucket.reviewer_runs_30d++;
  }

  for (const v of vaultRes.data ?? []) {
    const bucket = roll.get(v.org_id);
    if (!bucket) continue;
    bucket.vault_chunks_added_30d++;
  }

  // Filter to orgs with ANY activity.
  const activeOrgs = orgs.filter((o) => {
    const r = roll.get(o.id);
    if (!r) return false;
    return (
      r.proposals_30d +
        r.reviewer_runs_30d +
        r.vault_chunks_added_30d +
        r.won_30d +
        r.lost_30d +
        r.submitted_30d >
      0
    );
  });

  // Resolve owner email per active org.
  const digests: OrgDigest[] = [];
  for (const org of activeOrgs) {
    const { data: ownerMembership } = await admin
      .from("rfp_user_orgs")
      .select("user_id")
      .eq("org_id", org.id)
      .eq("role", "owner")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ user_id: string }>();
    if (!ownerMembership?.user_id) continue;
    const { data: userResp } = await admin.auth.admin.getUserById(
      ownerMembership.user_id,
    );
    const email = userResp?.user?.email;
    if (!email) continue;

    digests.push({
      org_id: org.id,
      org_name: org.name,
      owner_email: email,
      ...(roll.get(org.id) ?? init()),
    });
  }
  return digests;
}

function buildHtml(d: OrgDigest, rangeLabel: string): string {
  const tile = (label: string, value: string, sub?: string): string =>
    `<td style="padding:14px 16px;border:1px solid #27272a;background:#0a0a0a;width:50%;vertical-align:top;">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#71717a;">${label}</div>
      <div style="font-size:24px;font-weight:600;color:#fafafa;margin-top:6px;font-variant-numeric:tabular-nums;">${value}</div>
      ${sub ? `<div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#71717a;margin-top:4px;">${sub}</div>` : ""}
    </td>`;

  const winRateLabel =
    d.won_30d + d.lost_30d === 0
      ? "no outcomes yet"
      : `${Math.round((d.won_30d / (d.won_30d + d.lost_30d)) * 100)}% win rate`;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 16px 0;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#34d399;">RFP Engine · monthly</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#fafafa;margin-top:6px;">${d.org_name}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#71717a;margin-top:4px;">${rangeLabel}</div>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 8px;">
            <tr>
              ${tile("Proposals drafted", String(d.proposals_30d))}
              ${tile("Reviewer runs", String(d.reviewer_runs_30d))}
            </tr>
            <tr>
              ${tile("Won", String(d.won_30d), winRateLabel)}
              ${tile("Lost", String(d.lost_30d))}
            </tr>
            <tr>
              ${tile("Submitted (pending)", String(d.submitted_30d))}
              ${tile("Vault chunks added", String(d.vault_chunks_added_30d))}
            </tr>
            <tr>
              ${tile("AI cost", fmtUsd(d.ai_cost_30d_usd), "drafter + voice + vault + reviewer")}
              ${tile("Open dashboard", "→", "rfp.perpetualcore.com")}
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
          <p style="margin:0;">Full activity → <a href="https://rfp.perpetualcore.com/org/${d.org_id}/discovery" style="color:#34d399;text-decoration:underline;">your dashboard</a></p>
        </td></tr>
        <tr><td style="padding:40px 0 0 0;border-top:1px solid #27272a;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#52525b;">
            Perpetual Core LLC · monthly operations digest
          </div>
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

  let digests: OrgDigest[];
  try {
    digests = await buildDigests();
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "build_failed", detail: detail.slice(0, 200) },
      { status: 500 },
    );
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const rangeLabel = `${fmt(thirtyDaysAgo)} → ${fmt(now)}`;

  let sent = 0;
  let failed = 0;
  const errors: { org_id: string; error: string }[] = [];

  for (const d of digests) {
    try {
      const res = await resend.emails.send({
        from: FROM_ADDRESS,
        to: d.owner_email,
        subject: `RFP Engine · ${d.org_name} · ${rangeLabel}`,
        html: buildHtml(d, rangeLabel),
      });
      if (res.error) {
        failed++;
        errors.push({ org_id: d.org_id, error: res.error.message ?? "send_failed" });
      } else {
        sent++;
      }
    } catch (err) {
      failed++;
      errors.push({
        org_id: d.org_id,
        error: err instanceof Error ? err.message.slice(0, 120) : "unknown",
      });
    }
  }

  return NextResponse.json({
    eligible_orgs: digests.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}
