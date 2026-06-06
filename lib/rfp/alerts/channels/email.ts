/**
 * Phase 05-07 — Email channel adapter.
 *
 * Reuses the project-wide `sendEmail()` wrapper at lib/email/index.ts (canonical
 * Resend integration; no separate provider module exists). Subject and body
 * are inline HTML — no templating dep added.
 *
 * Graceful fallback contract:
 *   When Resend rejects the From: domain (e.g., perpetualcore.com not yet
 *   verified — see .planning/phases/05-discovery/deferred-items.md →
 *   RESEND-DOMAIN-VERIFICATION), we log a `[ALERT-FALLBACK-EMAIL]` line and
 *   return { ok: false, error: 'domain_unverified' }. The dispatcher maps that
 *   to a log row with status='skipped_unverified' so the audit trail still
 *   captures the attempt — and the dispatcher continues with the other
 *   enabled channels for the user.
 *
 * From: header precedence:
 *   RFP_ALERT_FROM_EMAIL ?? RESEND_FROM_EMAIL ?? 'noreply@perpetualcore.com'
 *   (matches the project-wide pattern in lib/email/index.ts:74.)
 */

import { sendEmail } from '@/lib/email';
import {
  buildOppUrl,
  escapeHtml,
  formatAmount,
  formatDeadline,
} from '../format';
import type { AlertMatch, AlertOpportunity, ChannelResult } from '../types';

export interface EmailAlertArgs {
  to: string;
  opp: AlertOpportunity;
  match: AlertMatch;
  orgId: string;
  appUrl: string;
}

/** Heuristic check on Resend's error shape — strings to look for in failures. */
function isDomainUnverifiedError(err: string | null | undefined): boolean {
  if (!err) return false;
  const e = err.toLowerCase();
  return (
    e.includes('domain') ||
    e.includes('verify') ||
    e.includes('verification') ||
    e.includes('from address') ||
    e.includes('not allowed') ||
    e.includes('forbidden')
  );
}

function buildSubject(match: AlertMatch, opp: AlertOpportunity): string {
  const agency = opp.agency ?? '';
  return `[${match.tier} · ${match.fit_score}] ${opp.title}${agency ? ` — ${agency}` : ''}`;
}

function buildHtml(args: EmailAlertArgs): string {
  const { opp, match, orgId, appUrl } = args;
  const oppUrl = buildOppUrl({ appUrl, orgId, oppId: opp.id });
  const brief = opp.brief ? opp.brief.slice(0, 400) : '';
  const truncated = (opp.brief?.length ?? 0) > 400;
  const chipsLine = match.chips.map(escapeHtml).join(' · ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(buildSubject(match, opp))}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#09090b;color:#e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#71717a;">High-fit opportunity</div>
              <div style="margin-top:6px;font-size:22px;font-weight:700;color:#fafafa;">
                <span style="color:#6ee7b7;">${match.fit_score}</span>
                <span style="color:#a1a1aa;font-weight:500;"> · ${escapeHtml(match.tier)}</span>
              </div>
              <div style="margin-top:6px;font-size:16px;font-weight:600;color:#e4e4e7;">${escapeHtml(opp.title)}</div>
              <div style="margin-top:4px;font-size:13px;color:#a1a1aa;">
                ${escapeHtml(opp.agency ?? '—')} · ${formatAmount(opp.amount_max ?? opp.amount_min)} · Deadline ${formatDeadline(opp.deadline)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 8px;">
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#71717a;margin-bottom:6px;">Fit reasoning</div>
              <div style="font-size:13px;color:#d4d4d8;">${chipsLine || '—'}</div>
            </td>
          </tr>

          ${
            match.summary
              ? `<tr>
            <td style="padding:8px 28px 8px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#d4d4d8;font-style:italic;">${escapeHtml(match.summary)}</p>
            </td>
          </tr>`
              : ''
          }

          ${
            brief
              ? `<tr>
            <td style="padding:8px 28px 16px;">
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#71717a;margin-bottom:6px;">Brief</div>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#a1a1aa;">${escapeHtml(brief)}${truncated ? '…' : ''}</p>
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td style="padding:8px 28px 28px;text-align:center;">
              <a href="${oppUrl}" style="display:inline-block;background:#6ee7b7;color:#052e16;text-decoration:none;padding:11px 22px;border-radius:6px;font-weight:600;font-size:14px;">View in Discovery →</a>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #27272a;">
              <p style="margin:0;font-size:11px;color:#71717a;">
                You're getting this because fit ≥ your alert threshold. Change settings at
                <a href="${args.appUrl.replace(/\/$/, '')}/org/${orgId}/settings/alerts" style="color:#6ee7b7;text-decoration:none;">/org/${escapeHtml(orgId)}/settings/alerts</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainText(args: EmailAlertArgs): string {
  const { opp, match, orgId, appUrl } = args;
  const oppUrl = buildOppUrl({ appUrl, orgId, oppId: opp.id });
  const amount = formatAmount(opp.amount_max ?? opp.amount_min);
  const deadline = formatDeadline(opp.deadline);
  const lines: string[] = [
    `${match.fit_score} · ${match.tier} — ${opp.title}`,
    `${opp.agency ?? '—'} · ${amount} · Deadline ${deadline}`,
    '',
    `Fit reasoning: ${match.chips.join(' · ')}`,
  ];
  if (match.summary) {
    lines.push('', match.summary);
  }
  if (opp.brief) {
    lines.push('', `Brief: ${opp.brief.slice(0, 400)}${opp.brief.length > 400 ? '…' : ''}`);
  }
  lines.push('', `View in Discovery: ${oppUrl}`);
  return lines.join('\n');
}

function resolveFromHeader(): string {
  const sender =
    process.env.RFP_ALERT_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    'noreply@perpetualcore.com';
  return `Perpetual Core Alerts <${sender}>`;
}

export async function sendEmailAlert(
  args: EmailAlertArgs
): Promise<ChannelResult> {
  if (!args.to) {
    return { ok: false, error: 'no_address', message: 'recipient email missing' };
  }

  const subject = buildSubject(args.match, args.opp);
  const html = buildHtml(args);
  const text = buildPlainText(args);
  const from = resolveFromHeader();

  // Log the plain-text version too — useful when we're in fallback mode.
  // sendEmail() doesn't currently take a text body but Resend SDK accepts
  // HTML + text. For now we rely on most clients rendering the HTML; the
  // fallback path below still logs the text for human inspection.

  try {
    const result = await sendEmail(args.to, subject, html, from);
    if (result.success) {
      return { ok: true };
    }

    // sendEmail returns success=false in two situations we care about:
    //   1. RESEND_API_KEY missing                  → treat as domain_unverified
    //      (same audit category — "alert email could not be delivered, fell
    //       back to console" — and operationally identical for the user).
    //   2. Resend rejected the send (e.g., domain) → domain_unverified
    if (
      result.error === 'Email service not configured' ||
      isDomainUnverifiedError(result.error)
    ) {
      console.log(
        `[ALERT-FALLBACK-EMAIL] to=${args.to} subject=${subject}\n${text}`
      );
      return {
        ok: false,
        error: 'domain_unverified',
        message: result.error ?? undefined,
      };
    }

    return {
      ok: false,
      error: 'send_failed',
      message: result.error,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isDomainUnverifiedError(msg)) {
      console.log(
        `[ALERT-FALLBACK-EMAIL] to=${args.to} subject=${subject}\n${text}`
      );
      return { ok: false, error: 'domain_unverified', message: msg };
    }
    return { ok: false, error: 'send_failed', message: msg };
  }
}
