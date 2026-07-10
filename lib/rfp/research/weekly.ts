/**
 * Deep Research — weekly cron orchestrator.
 *
 * Sweeps a bounded batch of eligible orgs, running ONE research vertical per
 * org (rotating through the org's plan so repeated weekly runs eventually
 * cover every vertical rather than hammering the same one). Never-researched
 * orgs go first; among the rest, the longest-stale org goes first.
 *
 * Eligible = a real org (not a demo/seed org) that already has a capture
 * profile row (loadResearchPlan requires capacity keywords, so an org with no
 * profile at all can't be researched yet).
 *
 * Cost + budget: each org's research goes through runDeepResearch, which
 * wraps its LLM call in guardedLLMCall (Phase 17). A BudgetExceededError for
 * one org is recorded as a skip and the sweep continues — one over-budget
 * tenant must never stall the whole cron.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { BudgetExceededError } from "@/lib/rfp/ai/guardrail";
import { loadResearchPlan, runDeepResearch } from "./run";
import type { ResearchLead } from "./types";

const AGENT_NAME = "research_v1";
const DEMO_ORG_PREFIX = "Demo Org ·";
const DEFAULT_MAX_ORGS = 5;

// ── Untyped admin handle (rfp_* tables aren't in database.types.ts yet) ────
// Matches the pattern in lib/rfp/scoring/recompute.ts's rfpAdmin().
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

interface EligibleOrg {
  orgId: string;
  name: string;
  sessionCount: number;
  lastResearchedAt: string | null;
}

/**
 * Real orgs (excludes "Demo Org ·..." seed orgs) that have at least one
 * capture profile row, ordered never-researched-first then oldest-last-
 * research-first. sessionCount/lastResearchedAt are read from
 * rfp_agent_sessions (agent='research_v1') so callers can rotate verticals
 * and prioritize stale orgs.
 */
async function loadEligibleOrgs(): Promise<{
  orgs: EligibleOrg[];
  error: string | null;
}> {
  const admin = rfpAdmin();

  const { data: orgRows, error: orgErr } = await admin
    .from("rfp_orgs")
    .select("id, name")
    .not("name", "ilike", `${DEMO_ORG_PREFIX}%`);
  if (orgErr) {
    // Fatal for the sweep — surfaced so the cron reports failure, not a
    // silent "success" with orgs_run: 0.
    return { orgs: [], error: `org_load_failed: ${orgErr.message}` };
  }
  const orgs = (orgRows ?? []) as Array<{ id: string; name: string }>;
  if (orgs.length === 0) return { orgs: [], error: null };

  const { data: profileRows, error: profileErr } = await admin
    .from("rfp_capture_profiles")
    .select("org_id")
    .in(
      "org_id",
      orgs.map((o) => o.id)
    );
  if (profileErr) {
    return { orgs: [], error: `profile_load_failed: ${profileErr.message}` };
  }
  const hasProfile = new Set(
    ((profileRows ?? []) as Array<{ org_id: string }>).map((r) => r.org_id)
  );
  const candidates = orgs.filter((o) => hasProfile.has(o.id));
  if (candidates.length === 0) return { orgs: [], error: null };

  const { data: sessionRows, error: sessionErr } = await admin
    .from("rfp_agent_sessions")
    .select("org_id, created_at")
    .eq("agent", AGENT_NAME)
    .in(
      "org_id",
      candidates.map((o) => o.id)
    )
    .order("created_at", { ascending: true })
    .limit(10_000);
  if (sessionErr) {
    // Non-fatal — degrade to "never researched" ordering for everyone.
    console.error(
      "[research/weekly] session history load failed:",
      sessionErr.message
    );
  }

  const countByOrg = new Map<string, number>();
  const lastByOrg = new Map<string, string>();
  for (const row of (sessionRows ?? []) as Array<{
    org_id: string;
    created_at: string;
  }>) {
    countByOrg.set(row.org_id, (countByOrg.get(row.org_id) ?? 0) + 1);
    // Ascending order means the final write per org is its most recent session.
    lastByOrg.set(row.org_id, row.created_at);
  }

  const eligible: EligibleOrg[] = candidates.map((o) => ({
    orgId: o.id,
    name: o.name,
    sessionCount: countByOrg.get(o.id) ?? 0,
    lastResearchedAt: lastByOrg.get(o.id) ?? null,
  }));

  eligible.sort((a, b) => {
    if (!a.lastResearchedAt && b.lastResearchedAt) return -1;
    if (a.lastResearchedAt && !b.lastResearchedAt) return 1;
    if (!a.lastResearchedAt && !b.lastResearchedAt) return 0;
    return a.lastResearchedAt!.localeCompare(b.lastResearchedAt!);
  });

  return { orgs: eligible, error: null };
}

/** Emails of every org owner, via auth admin lookup (mirrors lib/rfp/saved-search-alerts.ts). */
async function loadOwnerEmails(orgId: string): Promise<string[]> {
  const admin = rfpAdmin();
  const { data, error } = await admin
    .from("rfp_user_orgs")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner");
  if (error) {
    console.error("[research/weekly] owner lookup failed:", error.message);
    return [];
  }

  const authAdmin = createAdminClient();
  const emails: string[] = [];
  for (const row of (data ?? []) as Array<{ user_id: string }>) {
    const { data: userResp, error: userErr } = await authAdmin.auth.admin.getUserById(
      row.user_id
    );
    if (userErr) continue;
    const email = userResp?.user?.email;
    if (email) emails.push(email);
  }
  return emails;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Plain digest listing: name — funder — deadline — url, one lead per line. */
function buildDigestHtml(orgName: string, leads: ResearchLead[]): string {
  const items = leads
    .map((l) => {
      const deadline = l.deadline_iso
        ? new Date(l.deadline_iso).toLocaleDateString("en-US")
        : "no fixed deadline";
      return `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#111827;">${escapeHtml(l.name)} &mdash; ${escapeHtml(l.funder)} &mdash; ${escapeHtml(deadline)} &mdash; <a href="${escapeHtml(l.url)}" style="color:#047857;">${escapeHtml(l.url)}</a></p>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;background:#ffffff;">
  <h2 style="margin:0 0 16px;font-size:18px;">New opportunities for ${escapeHtml(orgName)}</h2>
  ${items}
</body></html>`;
}

export interface WeeklyRunResult {
  orgs_run: number;
  leads_found: number;
  leads_ingested: number;
  emails_sent: number;
  skipped_budget: number;
  errors: string[];
  cost_usd: number;
}

/**
 * Run the weekly research sweep. Runs ONE vertical per eligible org (up to
 * opts.maxOrgs, default 5), rotating verticals by prior session count so
 * repeat runs cover an org's whole plan over time.
 */
export async function runWeeklyResearch(
  opts: { maxOrgs?: number } = {}
): Promise<WeeklyRunResult> {
  const maxOrgs = opts.maxOrgs ?? DEFAULT_MAX_ORGS;
  const result: WeeklyRunResult = {
    orgs_run: 0,
    leads_found: 0,
    leads_ingested: 0,
    emails_sent: 0,
    skipped_budget: 0,
    errors: [],
    cost_usd: 0,
  };

  const { orgs: eligible, error: loadError } = await loadEligibleOrgs();
  if (loadError) {
    result.errors.push(loadError);
    return result;
  }
  const batch = eligible.slice(0, Math.max(0, maxOrgs));

  for (const org of batch) {
    let plan;
    try {
      plan = await loadResearchPlan(org.orgId);
    } catch (err) {
      result.errors.push(
        `${org.orgId}: plan_load_failed: ${err instanceof Error ? err.message.slice(0, 200) : "unknown"}`
      );
      continue;
    }
    if (!plan || plan.plan.length === 0) {
      // No capacity keywords yet — not an error, just not researchable this week.
      continue;
    }

    const verticalIdx = org.sessionCount % plan.plan.length;
    const verticalKey = plan.plan[verticalIdx].key;

    try {
      const summary = await runDeepResearch(org.orgId, { verticalKey });
      result.orgs_run++;
      result.leads_found += summary.leads_found;
      result.leads_ingested += summary.leads_ingested;
      result.cost_usd += summary.total_cost_usd;

      for (const r of summary.results) {
        if (r.errors.length > 0) {
          result.errors.push(
            ...r.errors.map((e) => `${org.orgId}/${r.vertical}: ${e}`)
          );
        }
      }

      if (summary.leads_ingested > 0) {
        const emails = await loadOwnerEmails(org.orgId);
        const allLeads = summary.results.flatMap((r) => r.leads);
        const html = buildDigestHtml(org.name, allLeads);
        for (const email of emails) {
          const sent = await sendEmail(
            email,
            `Your capture agent found ${summary.leads_ingested} new opportunities`,
            html
          );
          if (sent.success) {
            result.emails_sent++;
          } else {
            result.errors.push(
              `${org.orgId}: email_send_failed: ${sent.error ?? "unknown"}`
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        result.skipped_budget++;
        continue;
      }
      result.errors.push(
        `${org.orgId}: ${err instanceof Error ? err.message.slice(0, 200) : "unknown error"}`
      );
      continue;
    }
  }

  result.cost_usd = Number(result.cost_usd.toFixed(4));
  return result;
}
