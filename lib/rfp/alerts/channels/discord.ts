/**
 * Phase 05-07 — Discord channel adapter.
 *
 * Discord webhooks accept a JSON POST to a per-channel URL the user creates
 * in their server settings → Integrations → Webhooks. We send a rich embed
 * (no @everyone or @here pings — purely informational).
 *
 * Success status: 204 No Content for plain POSTs. (200 would imply ?wait=true,
 * which we don't use.) Treat any 2xx as success defensively.
 *
 * No new dependency — uses global `fetch`.
 */

import {
  buildOppUrl,
  formatAmount,
  formatDeadline,
} from '../format';
import type { AlertMatch, AlertOpportunity, ChannelResult } from '../types';

export interface DiscordAlertArgs {
  webhook_url: string;
  opp: AlertOpportunity;
  match: AlertMatch;
  orgId: string;
  appUrl: string;
}

/** Emerald-300 (strong), zinc-300 (good), zinc-500 (marginal/weak). */
function colorForTier(tier: string): number {
  const t = tier.toLowerCase();
  if (t.startsWith('strong')) return 0x6ee7b7; // emerald-300
  if (t.startsWith('good')) return 0xd4d4d8; // zinc-300
  return 0x71717a; // zinc-500
}

/** Discord embed text fields cap at 1024 chars; titles at 256. */
function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, Math.max(0, max - 1)) + '…';
}

function buildEmbed(args: DiscordAlertArgs) {
  const { opp, match, orgId, appUrl } = args;
  const url = buildOppUrl({ appUrl, orgId, oppId: opp.id });
  const title = truncate(
    `${match.fit_score} · ${match.tier} — ${opp.title}`,
    256
  );
  const description = opp.brief ? truncate(opp.brief, 300) : '';
  const amount = formatAmount(opp.amount_max ?? opp.amount_min);
  const deadline = formatDeadline(opp.deadline);

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Agency', value: truncate(opp.agency ?? '—', 1024), inline: true },
    { name: 'Amount', value: amount, inline: true },
    { name: 'Deadline', value: deadline, inline: true },
  ];
  if (match.chips.length > 0) {
    fields.push({
      name: 'Fit reasoning',
      value: truncate(match.chips.join(' · '), 1024),
    });
  }
  if (match.summary) {
    fields.push({
      name: 'AI summary',
      value: truncate(match.summary, 1024),
    });
  }

  return {
    title,
    url,
    description,
    color: colorForTier(match.tier),
    fields,
  };
}

export async function sendDiscordAlert(
  args: DiscordAlertArgs
): Promise<ChannelResult> {
  if (!args.webhook_url) {
    return { ok: false, error: 'no_address', message: 'webhook URL missing' };
  }

  // Defensive URL validation — Discord webhooks are HTTPS only.
  let parsed: URL;
  try {
    parsed = new URL(args.webhook_url);
  } catch {
    return { ok: false, error: 'no_address', message: 'invalid webhook URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'no_address', message: 'webhook URL must be https' };
  }

  const body = {
    embeds: [buildEmbed(args)],
    // allowed_mentions empty = never ping anyone, even if the description
    // contains @everyone-looking text.
    allowed_mentions: { parse: [] as string[] },
  };

  try {
    const res = await fetch(args.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { message?: string };
        if (data?.message) detail = `HTTP ${res.status}: ${data.message}`;
      } catch {
        // ignore
      }
      return { ok: false, error: 'send_failed', message: detail };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: 'send_failed', message: msg };
  }
}
