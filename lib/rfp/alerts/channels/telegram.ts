/**
 * Phase 05-07 — Telegram channel adapter.
 *
 * POST to the Telegram Bot API `sendMessage` endpoint with HTML parse mode.
 * Token lives in TELEGRAM_BOT_TOKEN env (already present for the Phase 1-3
 * agent runtime — see .env.example). When the token is unset, the dispatcher
 * skips this channel and logs status='skipped_unverified' so admins can spot
 * misconfiguration without breaking the rest of the alert path.
 *
 * Why HTML and not Markdown:
 *   Telegram's MarkdownV2 escaping rules are aggressive (every '.', '-', '!',
 *   etc. must be escaped) and easy to get wrong. HTML is forgiving and matches
 *   the format we already use for email.
 */

import {
  buildOppUrl,
  escapeHtml,
  formatAmount,
  formatDeadline,
} from '../format';
import type { AlertMatch, AlertOpportunity, ChannelResult } from '../types';

export interface TelegramAlertArgs {
  chat_id: string;
  opp: AlertOpportunity;
  match: AlertMatch;
  orgId: string;
  appUrl: string;
}

const TELEGRAM_BASE = 'https://api.telegram.org';

function buildMessage(args: TelegramAlertArgs): string {
  const { opp, match, orgId, appUrl } = args;
  const oppUrl = buildOppUrl({ appUrl, orgId, oppId: opp.id });
  const amount = formatAmount(opp.amount_max ?? opp.amount_min);
  const deadline = formatDeadline(opp.deadline);
  const agency = opp.agency ? escapeHtml(opp.agency) : '—';

  return [
    `<b>${match.fit_score} · ${escapeHtml(match.tier)}</b> · ${agency}`,
    `<i>${escapeHtml(opp.title)}</i>`,
    `${amount} · deadline ${deadline}`,
    match.chips.length > 0 ? escapeHtml(match.chips.join(' · ')) : null,
    `<a href="${oppUrl}">View in Discovery →</a>`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export async function sendTelegramAlert(
  args: TelegramAlertArgs
): Promise<ChannelResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: 'token_unset',
      message: 'TELEGRAM_BOT_TOKEN is not set',
    };
  }

  if (!args.chat_id) {
    return { ok: false, error: 'no_address', message: 'chat_id missing' };
  }

  const url = `${TELEGRAM_BASE}/bot${token}/sendMessage`;
  const body = {
    chat_id: args.chat_id,
    text: buildMessage(args),
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Telegram returns JSON like { ok: false, description: '...' }
      let detail = `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { description?: string };
        if (data?.description) detail = `HTTP ${res.status}: ${data.description}`;
      } catch {
        // ignore JSON parse failure
      }
      return { ok: false, error: 'send_failed', message: detail };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: 'send_failed', message: msg };
  }
}
