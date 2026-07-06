import Stripe from 'stripe';
import { readFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Stripe reader for the revenue-pulse capability.
 *
 * Resolves keys the same way executor.ts resolves the Supabase PAT: read them off
 * disk (~/.secrets/*.env), never from a bundled env, because this runs headless
 * under launchd with no shell profile. Prefers a READ-ONLY restricted key.
 *
 * Two accounts: 'perpetualcore' (Lorenzo / PC / lorenzodc / sage) and 'iha'
 * (theiha.org — Ascent tickets/sponsorships). IHA degrades to absent until Lorenzo
 * mints a restricted key at ~/.secrets/stripe-iha-live.env — the capability then
 * emits an info finding rather than failing. Keys are never logged.
 */

export interface StripeAccount {
  slug: string; // 'perpetualcore' | 'iha'
  label: string;
  client: Stripe;
  expiresAt: string | null;
}

const SECRETS = path.join(os.homedir(), '.secrets');

function parseEnvFile(p: string): Record<string, string> {
  const out: Record<string, string> = {};
  let raw: string;
  try {
    raw = readFileSync(p, 'utf8');
  } catch {
    return out;
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function loadAccount(
  slug: string,
  label: string,
  file: string,
  keyNames: string[],
): StripeAccount | null {
  const env = parseEnvFile(path.join(SECRETS, file));
  const key = keyNames.map((n) => env[n]).find((v) => v && v.length > 0);
  if (!key) return null;
  // Pin an apiVersion-agnostic client; omit apiVersion to use the account default.
  const client = new Stripe(key, { maxNetworkRetries: 2 });
  return { slug, label, client, expiresAt: env.STRIPE_KEY_EXPIRES_AT || null };
}

/** Every connected Stripe account. Empty array if no secrets present. */
export function loadStripeAccounts(): StripeAccount[] {
  const accts: StripeAccount[] = [];
  const pc = loadAccount(
    'perpetualcore',
    'Perpetual Core / Lorenzo',
    'stripe-perpetualcore-live.env',
    ['STRIPE_API_KEY_PCLLC_READONLY', 'STRIPE_API_KEY'],
  );
  if (pc) accts.push(pc);
  const iha = loadAccount('iha', 'IHA (theiha.org)', 'stripe-iha-live.env', [
    'STRIPE_API_KEY_READONLY',
    'STRIPE_API_KEY',
  ]);
  if (iha) accts.push(iha);
  return accts;
}

export interface ChargeAgg {
  product: string;
  grossUsd: number;
  count: number;
  failed: number;
}

/** Succeeded gross + failed count over the last window, grouped by metadata.product. */
export async function collectCharges(acct: StripeAccount, sinceUnix: number): Promise<ChargeAgg[]> {
  const by = new Map<string, ChargeAgg>();
  const bucket = (product: string): ChargeAgg => {
    let b = by.get(product);
    if (!b) {
      b = { product, grossUsd: 0, count: 0, failed: 0 };
      by.set(product, b);
    }
    return b;
  };
  for await (const ch of acct.client.charges.list({ created: { gte: sinceUnix }, limit: 100 })) {
    const product = (ch.metadata && ch.metadata.product) || '(untagged)';
    const b = bucket(product);
    if (ch.status === 'succeeded' && !ch.refunded) {
      b.grossUsd += (ch.amount - (ch.amount_refunded || 0)) / 100;
      b.count += 1;
    } else if (ch.status === 'failed') {
      b.failed += 1;
    }
  }
  return [...by.values()].sort((a, b) => b.grossUsd - a.grossUsd);
}

export interface SubAgg {
  product: string;
  count: number;
  mrrUsd: number;
}

const INTERVAL_TO_MONTHLY: Record<string, number> = {
  day: 365 / 12,
  week: 52 / 12,
  month: 1,
  year: 1 / 12,
};

/** Active subscriptions and approximate MRR, grouped by metadata.product. */
export async function collectActiveSubs(acct: StripeAccount): Promise<SubAgg[]> {
  const by = new Map<string, SubAgg>();
  for await (const sub of acct.client.subscriptions.list({ status: 'active', limit: 100 })) {
    const product = (sub.metadata && sub.metadata.product) || '(untagged)';
    let b = by.get(product);
    if (!b) {
      b = { product, count: 0, mrrUsd: 0 };
      by.set(product, b);
    }
    b.count += 1;
    for (const item of sub.items.data) {
      const price = item.price;
      const unit = (price.unit_amount || 0) / 100;
      const factor = INTERVAL_TO_MONTHLY[price.recurring?.interval || 'month'] ?? 1;
      const count = price.recurring?.interval_count || 1;
      b.mrrUsd += (unit * (item.quantity || 1) * factor) / count;
    }
  }
  return [...by.values()].sort((a, b) => b.mrrUsd - a.mrrUsd);
}

/** Whole days until the key expires (from STRIPE_KEY_EXPIRES_AT), or null if unknown. */
export function keyExpiryDays(acct: StripeAccount, nowIso: string): number | null {
  if (!acct.expiresAt) return null;
  const exp = Date.parse(acct.expiresAt);
  const now = Date.parse(nowIso);
  if (Number.isNaN(exp) || Number.isNaN(now)) return null;
  return Math.floor((exp - now) / 86_400_000);
}
