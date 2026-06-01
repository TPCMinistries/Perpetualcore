import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { EMAIL_CONFIG, resend } from "@/lib/email/config";
import {
  normalizeSavedSearchRow,
  type RfpSavedSearch,
} from "@/lib/rfp/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MatchRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  rfp_opportunities: {
    source: string;
    title: string;
    agency: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    brief: string | null;
    url: string | null;
    created_at: string;
  } | null;
}

function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

function dueSince(search: RfpSavedSearch, now: Date): string | null {
  const lastRun = search.last_run_at ? new Date(search.last_run_at) : null;
  if (!lastRun || Number.isNaN(lastRun.getTime())) {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  const elapsed = now.getTime() - lastRun.getTime();
  const day = 24 * 60 * 60 * 1000;
  const required =
    search.alert_frequency === "instant"
      ? 60 * 60 * 1000
      : search.alert_frequency === "daily"
        ? day
        : 7 * day;
  return elapsed >= required ? lastRun.toISOString() : null;
}

function amountText(min: number | null, max: number | null): string {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return "Amount not listed";
}

function matchesFilters(row: MatchRow, search: RfpSavedSearch, sinceIso: string): boolean {
  const opp = row.rfp_opportunities;
  if (!opp) return false;
  if (new Date(opp.created_at).getTime() < new Date(sinceIso).getTime()) return false;

  const { filters } = search;
  if (filters.sources.length > 0 && !filters.sources.includes(opp.source as never)) {
    return false;
  }
  if (filters.min_amount && (!opp.amount_max || opp.amount_max < filters.min_amount)) {
    return false;
  }
  if (filters.deadline_within_days) {
    if (!opp.deadline) return false;
    const deadline = new Date(opp.deadline);
    const upper = new Date(Date.now() + filters.deadline_within_days * 24 * 60 * 60 * 1000);
    if (deadline < new Date() || deadline > upper) return false;
  }
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const haystack = [opp.title, opp.agency, opp.brief].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function buildHtml(search: RfpSavedSearch, rows: MatchRow[]): string {
  const items = rows
    .slice(0, 10)
    .map((row) => {
      const opp = row.rfp_opportunities;
      if (!opp) return "";
      const href = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://rfp.perpetualcore.com"}/org/${search.org_id}/pursuits/${row.opp_id}`;
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e4e4e7;">
          <div style="font-size:15px;font-weight:700;color:#111827;">${escapeHtml(opp.title)}</div>
          <div style="margin-top:4px;font-size:12px;color:#52525b;">${escapeHtml(opp.agency ?? "Agency not listed")} · ${escapeHtml(opp.source)} · score ${Math.round(row.fit_score)}</div>
          <div style="margin-top:4px;font-size:12px;color:#52525b;">${escapeHtml(amountText(opp.amount_min, opp.amount_max))}${opp.deadline ? ` · due ${escapeHtml(new Date(opp.deadline).toLocaleDateString("en-US"))}` : ""}</div>
          ${row.summary ? `<div style="margin-top:8px;font-size:13px;line-height:1.5;color:#3f3f46;">${escapeHtml(row.summary)}</div>` : ""}
          <a href="${href}" style="display:inline-block;margin-top:10px;color:#047857;font-size:13px;font-weight:700;text-decoration:none;">Open pursuit →</a>
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
        <tr><td>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#047857;">Saved opportunity search</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;color:#111827;">${escapeHtml(search.name)}</h1>
          <p style="margin:8px 0 18px;font-size:14px;color:#52525b;">${rows.length} new match${rows.length === 1 ? "" : "es"} met this saved search.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function lookupEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

async function loadCandidateMatches(search: RfpSavedSearch): Promise<MatchRow[]> {
  const { data, error } = await rfpAdmin()
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, created_at )",
    )
    .eq("org_id", search.org_id)
    .gte("fit_score", search.min_fit_score)
    .order("fit_score", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[rfp-saved-search-alerts] match load failed", error.message);
    return [];
  }
  return (data ?? []) as MatchRow[];
}

async function touchSearch(searchId: string, nowIso: string): Promise<void> {
  const { error } = await rfpAdmin()
    .from("rfp_saved_searches")
    .update({ last_run_at: nowIso })
    .eq("id", searchId);
  if (error) {
    console.error("[rfp-saved-search-alerts] last_run_at update failed", error.message);
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!resend) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 503 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const { data, error } = await rfpAdmin()
    .from("rfp_saved_searches")
    .select("id, org_id, created_by, name, filters, mode, is_shared, alert_enabled, alert_frequency, min_fit_score, last_run_at, created_at, updated_at")
    .eq("alert_enabled", true)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "load_failed", detail: error.message }, { status: 500 });
  }

  let checked = 0;
  let sent = 0;
  let matched = 0;

  for (const raw of (data ?? []) as unknown[]) {
    const search = normalizeSavedSearchRow(raw);
    const sinceIso = dueSince(search, now);
    if (!sinceIso) continue;
    checked++;

    const candidates = await loadCandidateMatches(search);
    const rows = candidates.filter((row) => matchesFilters(row, search, sinceIso));
    matched += rows.length;

    if (rows.length === 0) {
      await touchSearch(search.id, nowIso);
      continue;
    }

    const email = await lookupEmail(search.created_by);
    if (!email) {
      await touchSearch(search.id, nowIso);
      continue;
    }

    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `New grant/RFP matches · ${search.name}`,
      html: buildHtml(search, rows),
    });

    if (response.error) {
      console.error("[rfp-saved-search-alerts] resend failed", response.error.message);
      continue;
    }

    sent++;
    await touchSearch(search.id, nowIso);
  }

  return NextResponse.json({ checked, matched, sent });
}
