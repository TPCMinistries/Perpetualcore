import { EMAIL_CONFIG, resend } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/server";
import {
  normalizeSavedSearchRow,
  type RfpSavedSearch,
} from "@/lib/rfp/saved-searches";
import {
  defaultSavedSearchSince,
  dueSince,
  loadSavedSearchMatches,
  type SavedSearchMatchRow,
} from "@/lib/rfp/saved-search-execution";

type RfpTableClient = { from: (table: string) => unknown };

export interface SavedSearchAlertRunOptions {
  dryRun?: boolean;
  force?: boolean;
  limit?: number;
  now?: Date;
}

export interface SavedSearchAlertRunResult {
  checked: number;
  matched: number;
  sent: number;
  dry_run: boolean;
  force: boolean;
  skipped: {
    not_due: number;
    no_email: number;
    resend_not_configured: number;
  };
  searches: Array<{
    search_id: string;
    name: string;
    org_id: string;
    frequency: RfpSavedSearch["alert_frequency"];
    matches: number;
    would_send: boolean;
    sent: boolean;
  }>;
}

function rfpAdmin(): RfpTableClient {
  return createAdminClient() as unknown as RfpTableClient;
}

function amountText(min: number | null, max: number | null): string {
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return "Amount not listed";
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(search: RfpSavedSearch, rows: SavedSearchMatchRow[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rfp.perpetualcore.com";
  const items = rows
    .slice(0, 10)
    .map((row) => {
      const opp = row.rfp_opportunities;
      if (!opp) return "";
      const href = `${appUrl.replace(/\/$/, "")}/org/${search.org_id}/pursuits/${row.opp_id}`;
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e4e4e7;">
          <div style="font-size:15px;font-weight:700;color:#111827;">${escapeHtml(opp.title)}</div>
          <div style="margin-top:4px;font-size:12px;color:#52525b;">${escapeHtml(opp.agency ?? "Agency not listed")} · ${escapeHtml(opp.source)} · score ${Math.round(row.fit_score)}</div>
          <div style="margin-top:4px;font-size:12px;color:#52525b;">${escapeHtml(amountText(opp.amount_min, opp.amount_max))}${opp.deadline ? ` · due ${escapeHtml(new Date(opp.deadline).toLocaleDateString("en-US"))}` : ""}</div>
          ${row.summary ? `<div style="margin-top:8px;font-size:13px;line-height:1.5;color:#3f3f46;">${escapeHtml(row.summary)}</div>` : ""}
          <a href="${href}" style="display:inline-block;margin-top:10px;color:#047857;font-size:13px;font-weight:700;text-decoration:none;">Open pursuit</a>
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

async function lookupEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

async function touchSearch(searchId: string, nowIso: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("rfp_saved_searches")
    .update({ last_run_at: nowIso })
    .eq("id", searchId);
  if (error) {
    console.error("[rfp-saved-search-alerts] last_run_at update failed", error.message);
  }
}

async function loadSentOppIds(searchId: string, userId: string): Promise<Set<string>> {
  const { data, error } = await createAdminClient()
    .from("rfp_saved_search_alert_log")
    .select("opp_id")
    .eq("search_id", searchId)
    .eq("user_id", userId)
    .limit(5_000);
  if (error) {
    console.error("[rfp-saved-search-alerts] dedupe load failed", error.message);
    return new Set<string>();
  }
  return new Set(((data ?? []) as Array<{ opp_id: string }>).map((row) => row.opp_id));
}

async function logSentRows(args: {
  search: RfpSavedSearch;
  rows: SavedSearchMatchRow[];
  email: string;
}): Promise<void> {
  if (args.rows.length === 0) return;
  const { error } = await createAdminClient()
    .from("rfp_saved_search_alert_log")
    .upsert(
      args.rows.map((row) => ({
        search_id: args.search.id,
        org_id: args.search.org_id,
        user_id: args.search.created_by,
        opp_id: row.opp_id,
        email: args.email,
      })),
      { onConflict: "search_id,user_id,opp_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("[rfp-saved-search-alerts] sent log failed", error.message);
  }
}

async function loadEnabledSearches(limit: number): Promise<RfpSavedSearch[]> {
  const { data, error } = await createAdminClient()
    .from("rfp_saved_searches")
    .select(
      "id, org_id, created_by, name, filters, mode, is_shared, alert_enabled, alert_frequency, min_fit_score, last_run_at, created_at, updated_at",
    )
    .eq("alert_enabled", true)
    .limit(limit);

  if (error) {
    throw new Error(`saved_search_alert_load_failed: ${error.message}`);
  }

  return ((data ?? []) as unknown[]).map((row) => normalizeSavedSearchRow(row));
}

function sinceForSearch(
  search: RfpSavedSearch,
  now: Date,
  force: boolean,
): string | null {
  if (!force) return dueSince(search, now);
  return search.last_run_at ?? defaultSavedSearchSince(now);
}

export async function runSavedSearchAlerts(
  options: SavedSearchAlertRunOptions = {},
): Promise<SavedSearchAlertRunResult> {
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const searches = await loadEnabledSearches(limit);

  const result: SavedSearchAlertRunResult = {
    checked: 0,
    matched: 0,
    sent: 0,
    dry_run: dryRun,
    force,
    skipped: {
      not_due: 0,
      no_email: 0,
      resend_not_configured: 0,
    },
    searches: [],
  };

  for (const search of searches) {
    const sinceIso = sinceForSearch(search, now, force);
    if (!sinceIso) {
      result.skipped.not_due++;
      continue;
    }
    result.checked++;

    const sentOppIds = await loadSentOppIds(search.id, search.created_by);
    const rows = await loadSavedSearchMatches({
      client: rfpAdmin(),
      search,
      sinceIso,
      excludeOppIds: sentOppIds,
      limit: 500,
    }).catch((error: unknown) => {
      console.error(
        "[rfp-saved-search-alerts] match load failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    });

    result.matched += rows.length;

    if (rows.length === 0) {
      if (!dryRun) await touchSearch(search.id, nowIso);
      result.searches.push({
        search_id: search.id,
        name: search.name,
        org_id: search.org_id,
        frequency: search.alert_frequency,
        matches: 0,
        would_send: false,
        sent: false,
      });
      continue;
    }

    const email = await lookupEmail(search.created_by);
    if (!email) {
      result.skipped.no_email++;
      if (!dryRun) await touchSearch(search.id, nowIso);
      result.searches.push({
        search_id: search.id,
        name: search.name,
        org_id: search.org_id,
        frequency: search.alert_frequency,
        matches: rows.length,
        would_send: false,
        sent: false,
      });
      continue;
    }

    const sentRows = rows.slice(0, 50);
    if (dryRun) {
      result.searches.push({
        search_id: search.id,
        name: search.name,
        org_id: search.org_id,
        frequency: search.alert_frequency,
        matches: rows.length,
        would_send: true,
        sent: false,
      });
      continue;
    }

    if (!resend) {
      result.skipped.resend_not_configured++;
      result.searches.push({
        search_id: search.id,
        name: search.name,
        org_id: search.org_id,
        frequency: search.alert_frequency,
        matches: rows.length,
        would_send: true,
        sent: false,
      });
      continue;
    }

    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: `New grant/RFP matches · ${search.name}`,
      html: buildHtml(search, sentRows),
    });

    if (response.error) {
      console.error("[rfp-saved-search-alerts] resend failed", response.error.message);
      result.searches.push({
        search_id: search.id,
        name: search.name,
        org_id: search.org_id,
        frequency: search.alert_frequency,
        matches: rows.length,
        would_send: true,
        sent: false,
      });
      continue;
    }

    result.sent++;
    await logSentRows({ search, rows: sentRows, email });
    await touchSearch(search.id, nowIso);
    result.searches.push({
      search_id: search.id,
      name: search.name,
      org_id: search.org_id,
      frequency: search.alert_frequency,
      matches: rows.length,
      would_send: true,
      sent: true,
    });
  }

  return result;
}
