import type { Capability, Finding, MetricRow, OpsCtx, Row } from '../types';
import { CONNECTED_TARGETS } from '../targets';
import { pushMetrics } from '../deck-push';
import {
  loadStripeAccounts,
  collectCharges,
  collectActiveSubs,
  keyExpiryDays,
} from '../stripe-reader';

/**
 * revenue-pulse — the money half of the Operator Deck.
 *
 * Nightly it reads every connected Stripe account (charges + active subs in the
 * last 24h, grouped by metadata.product — NEVER lumped across products/accounts)
 * and a per-entity Supabase signup count, then:
 *   - upserts a daily row per (source, segment, metric) into public.deck_metrics
 *     (the series the $1M-by-Dec-2026 line draws from), and
 *   - returns Findings for anomalies (failed payments, key expiry, no Stripe key).
 *
 * Self-resolves its Stripe keys off ~/.secrets like executor.ts resolves the PAT,
 * so it works headless under launchd. Findings-only; the metric upsert is the one
 * write, and it targets an internal derived table (deck_metrics), not user data.
 */

const DAY_MS = 86_400_000;

function num(rows: Row[], col = 'c'): number {
  const v = rows[0]?.[col];
  return typeof v === 'number' ? v : Number(v ?? 0) || 0;
}

export const revenuePulse: Capability = {
  id: 'revenue-pulse',
  label: 'REVENUE PULSE',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const metrics: MetricRow[] = [];
    const day = ctx.now.slice(0, 10);
    const sinceUnix = Math.floor((Date.parse(ctx.now) - DAY_MS) / 1000);

    // --- Stripe half -------------------------------------------------------
    const accounts = loadStripeAccounts();
    if (accounts.length === 0) {
      findings.push({
        severity: 'warn',
        project: 'Stripe',
        summary: 'No Stripe secrets found — revenue is invisible',
        detail: 'Expected ~/.secrets/stripe-perpetualcore-live.env with STRIPE_API_KEY_PCLLC_READONLY.',
      });
    }
    if (!accounts.some((a) => a.slug === 'iha')) {
      findings.push({
        severity: 'info',
        project: 'IHA (theiha.org)',
        summary: 'IHA Stripe not connected — Ascent tickets/sponsorships not in the pulse',
        detail: 'Mint a restricted read key on the IHA account → ~/.secrets/stripe-iha-live.env; auto-detected.',
      });
    }

    for (const acct of accounts) {
      const source = `stripe:${acct.slug}`;
      try {
        const charges = await collectCharges(acct, sinceUnix);
        let acctGross = 0;
        for (const c of charges) {
          acctGross += c.grossUsd;
          metrics.push({ day, source, segment: c.product, metric: 'gross_usd_24h', value: round2(c.grossUsd), meta: { count: c.count } });
          if (c.failed > 0) {
            metrics.push({ day, source, segment: c.product, metric: 'failed_charges_24h', value: c.failed });
            findings.push({
              severity: 'warn',
              project: acct.label,
              summary: `${c.failed} failed payment${c.failed > 1 ? 's' : ''} on ${c.product} in the last 24h`,
              detail: `Stripe account ${acct.slug}. Succeeded gross ${usd(c.grossUsd)} (${c.count}).`,
            });
          }
        }
        if (acctGross === 0 && charges.length === 0) {
          findings.push({
            severity: 'info',
            project: acct.label,
            summary: 'No charges in the last 24h',
          });
        }

        const subs = await collectActiveSubs(acct);
        for (const s of subs) {
          metrics.push({ day, source, segment: s.product, metric: 'active_subs', value: s.count });
          metrics.push({ day, source, segment: s.product, metric: 'mrr_usd', value: round2(s.mrrUsd) });
        }

        const days = keyExpiryDays(acct, ctx.now);
        if (days !== null && days <= 14) {
          findings.push({
            severity: 'warn',
            project: acct.label,
            summary: `Stripe key expires in ${days} day${days === 1 ? '' : 's'} — rotate before it breaks checkout`,
            detail: `Account ${acct.slug}, expires ${acct.expiresAt}.`,
          });
        } else if (days !== null && days <= 30) {
          findings.push({
            severity: 'info',
            project: acct.label,
            summary: `Stripe key expires in ${days} days`,
          });
        }
      } catch (err) {
        findings.push({
          severity: 'warn',
          project: acct.label,
          summary: `Could not read Stripe (${acct.slug})`,
          detail: (err as Error).message.slice(0, 200),
        });
      }
    }

    // --- Supabase signups half (per entity, 24h) ---------------------------
    for (const t of CONNECTED_TARGETS) {
      try {
        const rows = await ctx.runSql(
          t,
          "select count(*)::int as c from auth.users where created_at > now() - interval '24 hours'",
        );
        const n = num(rows);
        metrics.push({ day, source: `supabase:${t.key}`, segment: 'signups', metric: 'new_users_24h', value: n });
      } catch {
        // a target that doesn't expose auth.users (or a transient error) is skipped,
        // not failed — matches the rls-audit per-target stance.
      }
    }

    // --- Persist the day's series (idempotent) -----------------------------
    try {
      await pushMetrics(ctx.runSql, metrics);
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'deck_metrics',
        summary: 'Metrics upsert failed (pulse findings still valid)',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    if (findings.length === 0) {
      findings.push({ severity: 'ok', project: 'all', summary: `Revenue pulse recorded ${metrics.length} metric points, no anomalies` });
    }
    return findings;

    function round2(v: number): number {
      return Math.round(v * 100) / 100;
    }
    function usd(v: number): string {
      return `$${round2(v).toLocaleString('en-US')}`;
    }
  },
};
