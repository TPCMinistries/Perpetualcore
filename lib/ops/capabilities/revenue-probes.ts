import type { Capability, Finding, OpsCtx } from '../types';
import { loadPcStudiosStripe } from '../pnl-sources';

/**
 * revenue-probes — synthetic verification that the cash registers actually work.
 *
 * Three isolated checks, none of which move real money:
 *   1. Stripe (PC Studios): create a subscription Checkout Session for the Quick
 *      Vet monthly price (resolved by metadata, never hardcoded), confirm a URL
 *      comes back, then IMMEDIATELY expire it. Create-and-expire is the standard
 *      $0 smoke-test pattern — no charge is ever attempted.
 *   2. Stripe (PC Studios): list webhook endpoints, warn on any not `enabled`.
 *   3. HTTP: fetch every engine's public pricing/landing page, crit on
 *      non-2xx/3xx or timeout.
 * Every check is wrapped in its own try/catch — one dead engine never hides a
 * broken one elsewhere. NEVER calls a Stripe endpoint that charges, refunds, or
 * mutates anything beyond the create-then-expire checkout session.
 */

const PROBE_URLS = [
  'https://sentinel.perpetualcore.com/pricing',
  'https://janice.perpetualcore.com/pricing',
  'https://sage-saas.perpetualcore.com/pricing',
  'https://rfp.perpetualcore.com',
  'https://perpetualcore.com/pricing',
  'https://academy.humanadvancementinstitute.org',
  'https://lorenzodc.com',
];

const HTTP_TIMEOUT_MS = 15_000;

async function probeUrl(url: string): Promise<Finding> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (res.status >= 200 && res.status < 400) {
      return { severity: 'ok', project: 'Revenue Probes (HTTP)', summary: `${url} → ${res.status}` };
    }
    return { severity: 'critical', project: 'Revenue Probes (HTTP)', summary: `${url} → ${res.status} (non-2xx/3xx)` };
  } catch (err) {
    return {
      severity: 'critical',
      project: 'Revenue Probes (HTTP)',
      summary: `${url} unreachable or timed out`,
      detail: (err as Error).message.slice(0, 200),
    };
  } finally {
    clearTimeout(timer);
  }
}

export const revenueProbes: Capability = {
  id: 'revenue-probes',
  label: 'REVENUE PROBES',
  cadence: '0 10 * * 1',
  destructive: false,
  run: async (_ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // --- Stripe checkout create-and-expire smoke test -------------------------
    try {
      const acct = loadPcStudiosStripe();
      if (!acct) {
        findings.push({
          severity: 'warn',
          project: 'Stripe (PC Studios)',
          summary: 'Source unavailable: keychain entry "stripe-pc-studios-live" (account "perpetual-core") not found',
        });
      } else {
        try {
          const prices = await acct.client.prices.search({
            query: "metadata['sentinel_price_key']:'quick_vet_monthly'",
            limit: 1,
          });
          const price = prices.data[0];
          if (!price) {
            findings.push({
              severity: 'warn',
              project: acct.label,
              summary: 'Quick Vet monthly price not found (metadata sentinel_price_key=quick_vet_monthly)',
              detail: 'Checkout smoke test skipped — nothing to attach the session to.',
            });
          } else {
            const session = await acct.client.checkout.sessions.create({
              mode: 'subscription',
              line_items: [{ price: price.id, quantity: 1 }],
              success_url: 'https://perpetualcore.com/checkout/probe-success',
              cancel_url: 'https://perpetualcore.com/checkout/probe-cancel',
            });
            if (!session.url) {
              findings.push({
                severity: 'critical',
                project: acct.label,
                summary: 'Checkout session created but returned no URL — checkout is broken',
                detail: `Session ${session.id}, price ${price.id}.`,
              });
            } else {
              findings.push({
                severity: 'ok',
                project: acct.label,
                summary: 'Checkout create-and-expire smoke test passed (quick_vet_monthly)',
              });
            }
            // Always expire — this is a $0 synthetic session either way.
            try {
              await acct.client.checkout.sessions.expire(session.id);
            } catch (expireErr) {
              findings.push({
                severity: 'warn',
                project: acct.label,
                summary: 'Probe checkout session created but could not be expired',
                detail: `Session ${session.id}: ${(expireErr as Error).message.slice(0, 200)}`,
              });
            }
          }
        } catch (err) {
          findings.push({
            severity: 'critical',
            project: acct.label,
            summary: 'Checkout create-and-expire smoke test FAILED — cash register may be broken',
            detail: (err as Error).message.slice(0, 200),
          });
        }

        // --- Webhook endpoint health ---------------------------------------
        try {
          const endpoints = await acct.client.webhookEndpoints.list({ limit: 100 });
          for (const we of endpoints.data) {
            if (we.status !== 'enabled') {
              findings.push({
                severity: 'warn',
                project: acct.label,
                summary: `Webhook endpoint ${we.url} status=${we.status}`,
                detail: `Endpoint ${we.id}.`,
              });
            }
          }
        } catch (err) {
          findings.push({
            severity: 'warn',
            project: acct.label,
            summary: 'Could not list webhook endpoints',
            detail: (err as Error).message.slice(0, 200),
          });
        }
      }
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'Stripe (PC Studios)',
        summary: 'Stripe probe section failed unexpectedly',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    // --- HTTP pricing/landing page probes (each isolated, run in parallel) ----
    const httpFindings = await Promise.all(PROBE_URLS.map((u) => probeUrl(u)));
    findings.push(...httpFindings);

    return findings;
  },
};
