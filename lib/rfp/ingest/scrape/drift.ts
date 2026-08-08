/**
 * RFP Discovery — Schema-Drift Detector
 *
 * Phase 05-02: closes the "scraper silently breaks and we never know" gap.
 *
 * Three responsibilities:
 *   1. Persist drift events to `rfp_source_drift` (HTTP errors, parse failures,
 *      count anomalies vs rolling baseline) via service-role.
 *   2. Throttle admin-alert emails to at most one per (source, reason) per 24h.
 *   3. Maintain a 3-run rolling baseline of parsed counts in `rfp_source_baseline`
 *      so the orchestrator can detect "we usually see 50 records, now we see 2".
 *
 * RESEND DOMAIN CAVEAT
 * --------------------
 * `RESEND_FROM_EMAIL` (env var name per `lib/email/index.ts:74`) points at
 * `noreply@perpetualcore.com` by default; that domain's DNS records are still
 * pending verification (see `.planning/phases/05-discovery/deferred-items.md`
 * RESEND-DOMAIN-VERIFICATION). When `sendEmail()` returns success=false because
 * Resend rejects the domain, this module logs the alert with the prefix
 * `[DRIFT-ALERT-FALLBACK]` and STILL writes the drift row. We never throw —
 * silent breakage is exactly what this module is built to prevent.
 *
 * Service-only access: both tables have `USING (false)` RLS policies — only
 * service-role keys (which bypass RLS) can read/write. No end-user pathway.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export type DriftReason =
  | "zero_nodes"
  | "http_status"
  | "shape_mismatch"
  | "fetch_error"
  | "count_anomaly";

export interface RecordDriftOpts {
  /** Source key — matches `rfp_source_drift.source` (e.g. 'ny_state'). */
  source: string;
  reason: DriftReason;
  /** Free-form context — URL, status code, attempted fallbacks, count metrics. */
  details: Record<string, unknown>;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Resolves the From address and recipient for drift alerts.
 * Falls back through a small chain so we degrade gracefully when env vars are absent.
 */
function getAlertConfig(): { from: string; to: string } {
  const fromEmail =
    process.env.RFP_ALERT_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "noreply@perpetualcore.com";
  const to = process.env.RFP_ADMIN_EMAIL ?? "lorenzo@tpcmin.org";
  return {
    from: `Perpetual Core RFP Drift <${fromEmail}>`,
    to,
  };
}

/**
 * Has an unresolved drift row for this (source, reason) been written within the
 * last 24h? Used to throttle alert emails so a sustained outage doesn't spam.
 *
 * Note: throttle decision is made BEFORE inserting the new row. Caller of
 * recordDrift always inserts; only the email is suppressed.
 */
// Cast helper — the rfp_* tables (rfp_source_drift, rfp_source_baseline,
// rfp_opportunities) aren't in lib/supabase/database.types.ts yet. Rather than
// regen the entire 250+ table type file as part of Phase 5, we narrow at the
// call site via this `any`-typed adapter. Same shape as the federal
// orchestrator (lib/rfp/ingest/run.ts) uses with `as unknown as never[]`.
// TODO(post-Phase-5): regenerate database.types.ts and remove these casts.
function getRfpClient(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

async function shouldSuppressAlertEmail(
  source: string,
  reason: DriftReason
): Promise<boolean> {
  const supabase = getRfpClient();
  const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();
  const { data, error } = await supabase
    .from("rfp_source_drift")
    .select("id")
    .eq("source", source)
    .eq("reason", reason)
    .is("resolved_at", null)
    .gte("created_at", cutoff)
    .limit(1);

  if (error) {
    // If the throttle lookup itself fails, default to NOT suppressing: we'd
    // rather over-alert than miss a genuine new drift event.
    console.warn(
      `[drift] throttle lookup failed for ${source}/${reason}:`,
      error.message
    );
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/**
 * Writes a drift row, then (best-effort, throttled) sends an admin email.
 *
 * Behavior:
 *   - Always inserts a row in `rfp_source_drift` so the historical record is complete.
 *   - At most one email per (source, reason) per 24h (counted from latest unresolved row).
 *   - When Resend is unconfigured or returns a domain-verification error, falls
 *     back to a `[DRIFT-ALERT-FALLBACK]` console log. Never throws.
 */
export async function recordDrift(opts: RecordDriftOpts): Promise<void> {
  const { source, reason, details } = opts;
  const supabase = getRfpClient();

  // Throttle decision happens BEFORE insert so the just-inserted row doesn't
  // suppress its own email.
  const suppressEmail = await shouldSuppressAlertEmail(source, reason);

  const insertResult = await supabase.from("rfp_source_drift").insert({
    source,
    reason,
    details: details as Record<string, unknown>,
  });

  if (insertResult.error) {
    // Drift table missing or RLS misconfigured. Emit a loud console log so the
    // failure surfaces in Vercel function logs, but don't throw — the caller
    // (a scraper) should keep going for the other sources.
    console.error(
      `[DRIFT-ALERT-FALLBACK] Could NOT persist drift row for ${source}/${reason}:`,
      insertResult.error.message,
      "details=",
      JSON.stringify(details)
    );
  }

  if (suppressEmail) {
    console.log(
      `[drift] alert email suppressed (24h throttle) for ${source}/${reason}`
    );
    return;
  }

  await dispatchDriftEmail(source, reason, details);
}

/**
 * Sends the admin alert email. Wraps `sendEmail()` from the existing Resend
 * integration. Failures fall back to a console log; never throws.
 */
async function dispatchDriftEmail(
  source: string,
  reason: DriftReason,
  details: Record<string, unknown>
): Promise<void> {
  const { from, to } = getAlertConfig();
  const subject = `[Drift] ${source} — ${reason}`;
  const detailsPretty = JSON.stringify(details, null, 2);

  // Plain-ish HTML — keep it boring; this is an internal ops alert, not marketing.
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, monospace; color: #111;">
  <h2 style="margin: 0 0 12px;">RFP Discovery — Drift Detected</h2>
  <p><strong>Source:</strong> ${escapeHtml(source)}</p>
  <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
  <p><strong>Detected at:</strong> ${new Date().toISOString()}</p>
  <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto;">${escapeHtml(
    detailsPretty
  )}</pre>
  <p style="color: #666; font-size: 13px;">
    Phase 05 Discovery scrapers. Investigate via
    <code>SELECT * FROM rfp_source_drift WHERE source = '${escapeHtml(
      source
    )}' ORDER BY created_at DESC LIMIT 5;</code>
    or open <code>lib/rfp/ingest/scrape/${escapeHtml(source)}.ts</code> and
    eyeball the source URL.
  </p>
</body>
</html>`.trim();

  let result: { success: boolean; error?: string };
  try {
    result = await sendEmail(to, subject, html, from);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[DRIFT-ALERT-FALLBACK] sendEmail() threw for ${source}/${reason}: ${msg}`
    );
    console.warn(`[DRIFT-ALERT-FALLBACK] details:`, detailsPretty);
    return;
  }

  if (!result.success) {
    // Common case during pre-DNS-verification: Resend returns
    // "The from address is not verified" or 403. Log and move on.
    console.warn(
      `[DRIFT-ALERT-FALLBACK] Email not sent for ${source}/${reason}: ${result.error ?? "unknown error"}`
    );
    console.warn(`[DRIFT-ALERT-FALLBACK] details:`, detailsPretty);
  }
}

/**
 * Records a successful parse run. Caller (orchestrator) decides "successful"
 * (i.e., HTTP 200 + parsed_count >= 1). The rolling baseline self-heals: if a
 * source legitimately shrinks, the next 3 runs re-establish a new lower
 * baseline, and count_anomaly stops firing.
 */
export async function recordBaseline(
  source: string,
  parsed_count: number
): Promise<void> {
  if (!Number.isFinite(parsed_count) || parsed_count < 0) {
    console.warn(
      `[drift] recordBaseline ignored invalid count for ${source}: ${parsed_count}`
    );
    return;
  }
  const supabase = getRfpClient();
  const { error } = await supabase
    .from("rfp_source_baseline")
    .insert({ source, parsed_count });
  if (error) {
    // Non-fatal: baselines are advisory. A missing entry just means the next
    // run will skip the count_anomaly check until 3 entries accumulate.
    console.warn(
      `[drift] recordBaseline insert failed for ${source}: ${error.message}`
    );
  }
}

/**
 * Average parsed_count of the most recent 3 successful baselines for a source.
 * Returns null when fewer than 3 rows exist (caller should treat null as
 * "no baseline yet — skip count_anomaly check").
 */
export async function getRollingBaseline(
  source: string
): Promise<number | null> {
  const supabase = getRfpClient();
  const { data, error } = await supabase
    .from("rfp_source_baseline")
    .select("parsed_count")
    .eq("source", source)
    .order("recorded_at", { ascending: false })
    .limit(3);

  if (error) {
    console.warn(
      `[drift] getRollingBaseline failed for ${source}: ${error.message}`
    );
    return null;
  }
  if (!data || (data as unknown[]).length < 3) return null;

  type BaselineRow = { parsed_count: number };
  const rows = data as BaselineRow[];
  const sum = rows.reduce(
    (acc: number, row: BaselineRow) => acc + row.parsed_count,
    0
  );
  return sum / rows.length;
}

/**
 * Tiny HTML-escape helper for the email body. Avoids pulling a runtime dep
 * for a few characters.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
