import { execFileSync } from 'node:child_process';
import Stripe from 'stripe';

/**
 * Data sources for the portfolio-pnl capability. Two ground-truth reads, both
 * strictly read-only (balances / lists — never a mutating endpoint):
 *
 *   - Mercury (PC Studios' bank): keychain service "mercury-pc-studios".
 *   - Stripe "The Perpetual Core LLC" (acct_1TYdKRI5V6IfhLCU): keychain service
 *     "stripe-pc-studios-live". Distinct from the ~/.secrets-based account
 *     stripe-reader.ts loads for revenue-pulse — a different Stripe account,
 *     left untouched here.
 *
 * A third source (Lorenzo's personal Stripe — lorenzodc/Janice/Academy) has no
 * keychain or ~/.secrets entry reachable from this repo; portfolio-pnl.ts emits
 * an explicit "source not wired" finding for it rather than reaching into
 * another repo's .env.local.
 *
 * Account/bank identifiers are truncated to last-4 before they ever leave this
 * module — callers never see (and can never accidentally log) the full number.
 */

function keychainSecret(service: string, account: string): string | null {
  try {
    return execFileSync('security', ['find-generic-password', '-s', service, '-a', account, '-w'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

export function last4(v: string | null | undefined): string {
  const s = String(v ?? '');
  return s.length > 4 ? s.slice(-4) : s;
}

const DAY_MS = 86_400_000;

// --- Mercury -----------------------------------------------------------------

export interface MercuryAccountBalance {
  last4: string;
  name: string;
  availableUsd: number;
  currentUsd: number;
  status: string;
}

export interface MercurySnapshot {
  accounts: MercuryAccountBalance[];
  inflow7dUsd: number;
  outflow7dUsd: number;
  txCount7d: number;
}

interface MercuryApiAccount {
  id: string;
  name: string;
  accountNumber?: string;
  availableBalance?: number;
  currentBalance?: number;
  status?: string;
}

interface MercuryApiTransaction {
  amount: number;
  status: string;
  postedAt?: string | null;
  createdAt?: string;
}

/** Mercury bank snapshot: balances + last-7-day inflow/outflow. Null = keychain entry missing. */
export async function fetchMercurySnapshot(nowIso: string): Promise<MercurySnapshot | null> {
  const token = keychainSecret('mercury-pc-studios', 'perpetual-core');
  if (!token) return null;

  const headers = { Authorization: `Bearer ${token}` };
  const acctRes = await fetch('https://api.mercury.com/api/v1/accounts', { headers });
  if (!acctRes.ok) {
    throw new Error(`Mercury /accounts ${acctRes.status}`);
  }
  const acctData = (await acctRes.json()) as { accounts: MercuryApiAccount[] };
  const apiAccounts = acctData.accounts ?? [];

  const accounts: MercuryAccountBalance[] = apiAccounts.map((a) => ({
    last4: last4(a.accountNumber),
    name: a.name ?? 'Mercury account',
    availableUsd: Number(a.availableBalance) || 0,
    currentUsd: Number(a.currentBalance) || 0,
    status: a.status ?? 'unknown',
  }));

  const since = Date.parse(nowIso) - 7 * DAY_MS;
  let inflow7dUsd = 0;
  let outflow7dUsd = 0;
  let txCount7d = 0;

  for (const a of apiAccounts) {
    const txRes = await fetch(`https://api.mercury.com/api/v1/account/${a.id}/transactions?limit=50`, { headers });
    if (!txRes.ok) continue; // one account's tx failure degrades that account only
    const txData = (await txRes.json()) as { transactions: MercuryApiTransaction[] };
    for (const t of txData.transactions ?? []) {
      if (t.status !== 'sent') continue; // pending/failed/cancelled never moved money
      const posted = Date.parse(t.postedAt || t.createdAt || '');
      if (Number.isNaN(posted) || posted < since) continue;
      const amt = Number(t.amount) || 0;
      if (amt >= 0) inflow7dUsd += amt;
      else outflow7dUsd += -amt;
      txCount7d += 1;
    }
  }

  return {
    accounts,
    inflow7dUsd: round2(inflow7dUsd),
    outflow7dUsd: round2(outflow7dUsd),
    txCount7d,
  };
}

// --- Stripe (PC Studios / "The Perpetual Core LLC") ---------------------------

export interface PnlStripeAccount {
  slug: string;
  label: string;
  acctIdLast4: string;
  client: Stripe;
}

/** Loads the PC Studios Stripe client from the keychain. Null = keychain entry missing. */
export function loadPcStudiosStripe(): PnlStripeAccount | null {
  const key = keychainSecret('stripe-pc-studios-live', 'perpetual-core');
  if (!key) return null;
  return {
    slug: 'pc-studios',
    label: 'The Perpetual Core LLC',
    acctIdLast4: last4(key), // key itself, only ever shown as last4 in reports
    client: new Stripe(key, { maxNetworkRetries: 2 }),
  };
}

/**
 * Lorenzo's personal Stripe (acct_1PaRTg…) — coaching services, classified
 * under Perpetual Core per owner directive 2026-07-14. Null = keychain entry
 * "stripe-personal-live" missing.
 */
export function loadPersonalStripe(): PnlStripeAccount | null {
  const key = keychainSecret('stripe-personal-live', 'perpetual-core');
  if (!key) return null;
  return {
    slug: 'pc-coaching',
    label: 'Perpetual Core — Coaching (personal acct)',
    acctIdLast4: last4(key),
    client: new Stripe(key, { maxNetworkRetries: 2 }),
  };
}

export interface EngineProduct {
  productId: string;
  engine: string;
  name: string;
}

/** product_id -> engine, derived from a metadata key shaped "<engine>_product" (e.g. sentinel_product). */
export async function loadEngineProductMap(client: Stripe): Promise<Map<string, EngineProduct>> {
  const map = new Map<string, EngineProduct>();
  for await (const p of client.products.list({ limit: 100 })) {
    const metaKey = Object.keys(p.metadata || {}).find((k) => /_product$/.test(k));
    const engine = metaKey ? metaKey.replace(/_product$/, '') : 'untagged';
    map.set(p.id, { productId: p.id, engine, name: p.name });
  }
  return map;
}

export interface StripeBalanceUsd {
  availableUsd: number;
  pendingUsd: number;
}

export async function fetchStripeBalance(client: Stripe): Promise<StripeBalanceUsd> {
  const bal = await client.balance.retrieve();
  const sum = (rows: Stripe.Balance['available']) =>
    round2(rows.filter((r) => r.currency === 'usd').reduce((s, r) => s + r.amount, 0) / 100);
  return { availableUsd: sum(bal.available), pendingUsd: sum(bal.pending) };
}

export interface ChargeWindow {
  count: number;
  grossUsd: number;
  hasMore: boolean;
}

export interface EngineChargeAgg {
  gross7dUsd: number;
  grossLifetimeUsd: number;
  count7d: number;
  countLifetime: number;
}

export interface ChargeSummary {
  window7d: ChargeWindow;
  window30d: ChargeWindow;
  /** exact lifetime gross only when the fetched page covers all charges (list.has_more === false) */
  lifetime: ChargeWindow;
  /** per-engine breakdown, mirroring the same 7d/lifetime split as the totals above */
  byEngine: Map<string, EngineChargeAgg>;
}

/** Charges over the requested limit (25, per capability spec), bucketed into 7d/30d/lifetime + engine. */
export async function collectChargeSummary(
  client: Stripe,
  engineMap: Map<string, EngineProduct>,
  nowIso: string,
): Promise<ChargeSummary> {
  const now = Date.parse(nowIso);
  const since7d = Math.floor((now - 7 * DAY_MS) / 1000);
  const since30d = Math.floor((now - 30 * DAY_MS) / 1000);

  const list = await client.charges.list({ limit: 25 });
  const byEngine = new Map<string, EngineChargeAgg>();
  const w7: ChargeWindow = { count: 0, grossUsd: 0, hasMore: list.has_more };
  const w30: ChargeWindow = { count: 0, grossUsd: 0, hasMore: list.has_more };
  const life: ChargeWindow = { count: 0, grossUsd: 0, hasMore: list.has_more };

  for (const c of list.data) {
    if (c.status !== 'succeeded') continue;
    const netUsd = (c.amount - (c.amount_refunded || 0)) / 100;
    const inLast7d = c.created >= since7d;
    life.count += 1;
    life.grossUsd += netUsd;
    if (c.created >= since30d) {
      w30.count += 1;
      w30.grossUsd += netUsd;
    }
    if (inLast7d) {
      w7.count += 1;
      w7.grossUsd += netUsd;
    }
    // engine attribution convention (matches revenue-pulse): metadata.product tag on the charge
    const productMeta = (c.metadata && c.metadata.product) || null;
    const engine = productMeta ? resolveEngineSlug(productMeta, engineMap) : 'untagged';
    const b = byEngine.get(engine) ?? { gross7dUsd: 0, grossLifetimeUsd: 0, count7d: 0, countLifetime: 0 };
    b.grossLifetimeUsd += netUsd;
    b.countLifetime += 1;
    if (inLast7d) {
      b.gross7dUsd += netUsd;
      b.count7d += 1;
    }
    byEngine.set(engine, b);
  }

  w7.grossUsd = round2(w7.grossUsd);
  w30.grossUsd = round2(w30.grossUsd);
  life.grossUsd = round2(life.grossUsd);
  for (const b of byEngine.values()) {
    b.gross7dUsd = round2(b.gross7dUsd);
    b.grossLifetimeUsd = round2(b.grossLifetimeUsd);
  }

  return { window7d: w7, window30d: w30, lifetime: life, byEngine };
}

function resolveEngineSlug(tag: string, engineMap: Map<string, EngineProduct>): string {
  // tag may already be an engine slug (e.g. "sentinel") or a Stripe product id.
  const byProduct = engineMap.get(tag);
  if (byProduct) return byProduct.engine;
  return tag;
}

export interface SubAgg {
  engine: string;
  count: number;
  mrrUsd: number;
}

const INTERVAL_TO_MONTHLY: Record<string, number> = {
  day: 365 / 12,
  week: 52 / 12,
  month: 1,
  year: 1 / 12,
};

/** Active subscriptions grouped by engine (via item price -> product -> engine map), with MRR. */
export async function collectActiveSubsByEngine(
  client: Stripe,
  engineMap: Map<string, EngineProduct>,
): Promise<SubAgg[]> {
  const by = new Map<string, SubAgg>();
  for await (const sub of client.subscriptions.list({ status: 'active', limit: 25 })) {
    const firstItem = sub.items.data[0];
    const productId = firstItem ? (typeof firstItem.price.product === 'string' ? firstItem.price.product : firstItem.price.product?.id) : undefined;
    const engine = (productId && engineMap.get(productId)?.engine) || 'untagged';
    let b = by.get(engine);
    if (!b) {
      b = { engine, count: 0, mrrUsd: 0 };
      by.set(engine, b);
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
  for (const b of by.values()) b.mrrUsd = round2(b.mrrUsd);
  return [...by.values()].sort((a, b) => b.mrrUsd - a.mrrUsd);
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function usd(v: number): string {
  return `$${round2(v).toLocaleString('en-US')}`;
}
