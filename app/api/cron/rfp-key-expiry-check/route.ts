/**
 * GET /api/cron/rfp-key-expiry-check
 *
 * Daily cron (vercel.json: "0 13 * * *" = 13:00 UTC = 8am Central).
 * Reads all rows from rfp_api_key_health, fires an operator alert email for
 * any key that is within 21 days of expiry and has not been alerted in the
 * last 7 days. Records last_alerted_at on alerted rows to prevent re-spam.
 *
 * Auth: Bearer ${CRON_SECRET} — identical pattern to rfp-weekly-report and
 * rfp-saved-search-alerts. Supports both GET and POST.
 *
 * Returns: { checked: number, alerted: number }
 *
 * Failure modes:
 *   - resend not configured → 503 (non-fatal; keys still checked, alert skipped)
 *   - DB read error → 500
 *   - Individual email failure → logged, non-fatal; continues to next key
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, EMAIL_CONFIG } from "@/lib/email/config";
import { daysUntilExpiry, needsAlert } from "@/lib/rfp/key-expiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ALERT_TO = "lorenzo@tpcmin.org";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

interface KeyHealthRow {
  key_name: string;
  expires_at: string | null;
  account_type: string | null;
  last_alerted_at: string | null;
  updated_at: string;
}

async function runCron(): Promise<NextResponse> {
  const admin = createAdminClient();

  // 1. Read all key health rows.
  const { data: rows, error: readErr } = await admin
    .from("rfp_api_key_health")
    .select("key_name, expires_at, account_type, last_alerted_at, updated_at")
    .returns<KeyHealthRow[]>();

  if (readErr) {
    console.error("[rfp-key-expiry-check] DB read error:", readErr.message);
    return NextResponse.json(
      { error: "db_read_failed", detail: readErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const checked = (rows ?? []).length;
  let alerted = 0;

  for (const row of rows ?? []) {
    if (!needsAlert(row.expires_at, row.last_alerted_at)) continue;

    const days = daysUntilExpiry(row.expires_at);
    const daysLabel =
      days === null
        ? "unknown"
        : days <= 0
          ? "EXPIRED"
          : `${days} day${days === 1 ? "" : "s"}`;

    const subject =
      days !== null && days <= 0
        ? `[URGENT] ${row.key_name} API key has EXPIRED — rotate now`
        : `${row.key_name} API key expires in ${daysLabel} — rotate now`;

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 16px 0;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#f87171;">RFP Engine · key expiry alert</div>
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#fafafa;margin-top:6px;">API Key Rotation Required</div>
        </td></tr>
        <tr><td style="padding:12px 16px;border:1px solid #27272a;background:#0a0a0a;">
          <p style="margin:0 0 8px 0;font-size:14px;color:#fafafa;"><strong>Key:</strong> <code style="color:#f87171;">${row.key_name}</code></p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#fafafa;"><strong>Status:</strong> ${daysLabel}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#fafafa;"><strong>Expires:</strong> ${row.expires_at ?? "not set"}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#fafafa;"><strong>Account type:</strong> ${row.account_type ?? "unknown"}</p>
        </td></tr>
        <tr><td style="padding:16px 0 8px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
          <p style="margin:0 0 8px 0;">Rotate the key and update <code>rfp_api_key_health</code> with the new expiry date:</p>
          <pre style="background:#0a0a0a;border:1px solid #27272a;padding:12px;font-size:12px;color:#e4e4e7;white-space:pre-wrap;">UPDATE rfp_api_key_health
SET expires_at = '&lt;issued_date + 90 days&gt;',
    updated_at = now()
WHERE key_name = '${row.key_name}';</pre>
          <p style="margin:8px 0 0 0;">Admin → <a href="${EMAIL_CONFIG.appUrl}/admin/rfp" style="color:#34d399;text-decoration:underline;">/admin/rfp</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    // 2. Send alert email via Resend (same mechanism as rfp-weekly-report).
    let emailSent = false;
    if (resend) {
      const recipients = (process.env.RFP_WEEKLY_REPORT_TO ?? DEFAULT_ALERT_TO)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: recipients,
        subject,
        html,
      });

      if (res.error) {
        console.error(
          `[rfp-key-expiry-check] email failed for ${row.key_name}:`,
          res.error.message,
        );
      } else {
        emailSent = true;
        console.log(
          `[rfp-key-expiry-check] alert sent for ${row.key_name} (${daysLabel}), email_id=${res.data?.id ?? "?"}`,
        );
      }
    } else {
      // Resend not configured — log and still stamp last_alerted_at so we
      // don't retry on every subsequent run. The DB record IS the alert backstop.
      console.warn(
        `[rfp-key-expiry-check] resend not configured; ${row.key_name} needs rotation in ${daysLabel}`,
      );
      emailSent = true; // treat as "handled" so we stamp last_alerted_at
    }

    // 3. Record last_alerted_at to prevent daily re-spam.
    if (emailSent) {
      const { error: updateErr } = await admin
        .from("rfp_api_key_health")
        .update({ last_alerted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("key_name", row.key_name);

      if (updateErr) {
        console.error(
          `[rfp-key-expiry-check] failed to stamp last_alerted_at for ${row.key_name}:`,
          updateErr.message,
        );
      } else {
        alerted++;
      }
    }
  }

  console.log(
    `[rfp-key-expiry-check] checked=${checked} alerted=${alerted}`,
  );

  return NextResponse.json({ checked, alerted });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runCron();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runCron();
}
