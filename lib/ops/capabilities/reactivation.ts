import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type Stripe from 'stripe';
import type { Capability, Finding, OpsCtx } from '../types';
import { loadPcStudiosStripe, loadPersonalStripe, loadTpcStripe, type PnlStripeAccount } from '../pnl-sources';
import {
  APPROVED_TEMPLATES,
  FROM_ADDRESSES,
  OPS_DIR,
  countQueuedDrafts,
  logTouch,
  loadState,
  newDraftId,
  queueDraft,
  resolveResendKey,
  saveState,
  type Property,
  type TemplateVars,
} from '../revenue-crew';

/**
 * reactivation — dormant-customer win-back drafts. NEVER auto-sends.
 *
 * Segments dormant Stripe customers (most recent succeeded charge > 90 days
 * old) across the three wired accounts — PC Studios (`pc`), personal coaching
 * (`coaching`), TPC Ministries (`tpc`, its own ministry entity, never blended)
 * — and queues a 2-touch win-back sequence per customer into the vault queue.
 *
 * SAFETY (per the ratified autonomy charter — money/outbound always queues for
 * Lorenzo): this capability has NO send path at all. Every Stripe call is
 * read-only (`charges.list`). The optional Resend mirror creates an UNSENT
 * broadcast draft only, and only when RESEND_REVENUE_CREW_SEGMENT_ID is
 * explicitly configured — it never calls a send/schedule endpoint.
 */

export const REACTIVATION_HEADLINE = 'Reactivation';

const DAY_MS = 86_400_000;
const DORMANT_DAYS = 90;
/** Cap new drafted customers per run so a first run doesn't flood the queue. */
const MAX_NEW_DRAFTS_PER_RUN = 25;

const ACCOUNTS: Array<{ loader: () => PnlStripeAccount | null; property: Property; missing: string }> = [
  {
    loader: loadPcStudiosStripe,
    property: 'pc',
    missing: 'Stripe keychain entry "stripe-pc-studios-live" (account "perpetual-core") not found',
  },
  {
    loader: loadPersonalStripe,
    property: 'coaching',
    missing: 'Stripe keychain entry "stripe-personal-live" (account "perpetual-core") not found',
  },
  {
    loader: loadTpcStripe,
    property: 'tpc',
    missing: 'Stripe keychain entry "stripe-tpc-live" (account "tpc-ministries") not found',
  },
];

interface DormantCustomer {
  property: Property;
  accountLabel: string;
  email: string;
  name: string | null;
  engine: string;
  monthsSince: number;
}

interface AccountScan {
  property: Property;
  label: string;
  dormant: DormantCustomer[];
  activeCount: number;
  sampled: boolean; // true when charges.list has_more — history only sampled
}

function scanCharges(property: Property, label: string, charges: Stripe.ApiList<Stripe.Charge>, nowMs: number): AccountScan {
  interface CustomerAgg {
    lastChargeMs: number;
    name: string | null;
    engine: string;
  }
  const byEmail = new Map<string, CustomerAgg>();
  for (const c of charges.data) {
    if (c.status !== 'succeeded') continue;
    const email = c.billing_details?.email || c.receipt_email;
    if (!email) continue; // no address → nothing to win back
    const createdMs = c.created * 1000;
    // engine attribution convention (matches pnl-sources collectChargeSummary)
    const engine = (c.metadata && c.metadata.product) || 'untagged';
    const existing = byEmail.get(email);
    if (!existing || createdMs > existing.lastChargeMs) {
      byEmail.set(email, {
        lastChargeMs: createdMs,
        name: c.billing_details?.name || existing?.name || null,
        engine,
      });
    }
  }

  const dormant: DormantCustomer[] = [];
  let activeCount = 0;
  const cutoff = nowMs - DORMANT_DAYS * DAY_MS;
  for (const [email, agg] of byEmail) {
    if (agg.lastChargeMs < cutoff) {
      dormant.push({
        property,
        accountLabel: label,
        email,
        name: agg.name,
        engine: agg.engine,
        monthsSince: Math.max(3, Math.round((nowMs - agg.lastChargeMs) / (30 * DAY_MS))),
      });
    } else {
      activeCount += 1;
    }
  }
  return { property, label, dormant, activeCount, sampled: charges.has_more };
}

function firstName(name: string | null): string {
  return name ? name.split(/\s+/)[0] : '';
}

function renderSnapshot(opts: {
  now: string;
  scans: AccountScan[];
  unavailable: Array<{ property: Property; reason: string }>;
  draftedThisRun: number;
  capped: boolean;
  queueDepth: number;
}): string {
  const day = opts.now.slice(0, 10);
  const L: string[] = [
    '---',
    'name: revenue-crew-reactivation',
    `description: Reactivation — always-current dormant-customer segmentation (last run ${day})`,
    'metadata:',
    '  type: reference',
    '  source: ops-revenue-crew',
    '---',
    '',
    '# Reactivation — Dormant Customers',
    '',
    `Run at ${opts.now}`,
    '',
    `> ${opts.draftedThisRun} win-back sequence(s) queued this run · total queue depth ${opts.queueDepth} draft(s) · 0 sent — outbound queues for Lorenzo per the autonomy charter.`,
    '',
    '## Segments (property · engine → dormant count)',
    '',
  ];

  let anySegment = false;
  for (const scan of opts.scans) {
    const byEngine = new Map<string, number>();
    for (const d of scan.dormant) byEngine.set(d.engine, (byEngine.get(d.engine) ?? 0) + 1);
    L.push(`### ${scan.label} (${scan.property})`, '');
    if (scan.dormant.length === 0) {
      L.push(`- No dormant customers (${scan.activeCount} active in window).`);
    } else {
      anySegment = true;
      for (const [engine, count] of [...byEngine.entries()].sort((a, b) => b[1] - a[1])) {
        L.push(`- ${scan.property} · ${engine}: ${count} dormant`);
      }
      L.push(`- (${scan.activeCount} customer(s) charged within the last ${DORMANT_DAYS} days)`);
    }
    if (scan.sampled) {
      L.push(`- _history sampled — only the most recent 100 charges were read; older customers may be missing_`);
    }
    L.push('');
  }
  for (const u of opts.unavailable) {
    L.push(`### ${u.property}`, '', `- source unavailable: ${u.reason}`, '');
  }
  if (!anySegment && opts.unavailable.length === ACCOUNTS.length) {
    L.push('- No Stripe account reachable this run — nothing segmented.', '');
  }
  if (opts.capped) {
    L.push(`> Draft cap hit: only ${MAX_NEW_DRAFTS_PER_RUN} new customer sequences queued this run; the rest queue on subsequent runs.`, '');
  }
  L.push('> Findings only — read-only Stripe list calls, no mutating endpoints, nothing sent.', '');
  return L.join('\n');
}

export const reactivation: Capability = {
  id: 'reactivation',
  label: 'REACTIVATION',
  cadence: '0 9 * * 1',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const push = (f: Finding | null): void => {
      if (f) findings.push(f);
    };
    const nowMs = Date.parse(ctx.now);

    const { state, finding: stateFinding } = await loadState();
    push(stateFinding);

    // --- 1) Scan each Stripe account in isolation (read-only) -----------------
    const scans: AccountScan[] = [];
    const unavailable: Array<{ property: Property; reason: string }> = [];
    for (const spec of ACCOUNTS) {
      try {
        const acct = spec.loader();
        if (!acct) {
          unavailable.push({ property: spec.property, reason: spec.missing });
          findings.push({ severity: 'warn', project: `Reactivation (${spec.property})`, summary: `Source unavailable: ${spec.missing}` });
          continue;
        }
        const charges = await acct.client.charges.list({ limit: 100 });
        const scan = scanCharges(spec.property, acct.label, charges, nowMs);
        scans.push(scan);
        if (scan.sampled) {
          findings.push({
            severity: 'info',
            project: `Reactivation (${spec.property})`,
            summary: 'Charge history sampled — most recent 100 charges only (more exist); older dormant customers may be missing',
          });
        }
      } catch (err) {
        const reason = (err as Error).message.slice(0, 200);
        unavailable.push({ property: spec.property, reason });
        findings.push({ severity: 'warn', project: `Reactivation (${spec.property})`, summary: `Source unavailable: ${reason}` });
      }
    }

    const allDormant = scans.flatMap((s) => s.dormant);

    // --- 2) Queue 2-touch win-back sequences (never send — no send path here) --
    let draftedThisRun = 0;
    let capped = false;
    for (const customer of allDormant) {
      const key = `${customer.property}:${customer.email}`;
      if (state.reactivation.draftedCustomerKeys.includes(key)) continue;
      if (draftedThisRun >= MAX_NEW_DRAFTS_PER_RUN) {
        capped = true;
        break;
      }
      const isTpc = customer.property === 'tpc'; // ministry entity — its own tone, never blended
      const touchIds: Array<{ templateId: string; touch: 1 | 2 }> = [
        { templateId: isTpc ? 'reactivation-tpc-touch-1' : 'reactivation-touch-1', touch: 1 },
        { templateId: isTpc ? 'reactivation-tpc-touch-2' : 'reactivation-touch-2', touch: 2 },
      ];
      const fromEntry = FROM_ADDRESSES[customer.property];
      const vars: TemplateVars = {
        firstName: firstName(customer.name),
        engine: customer.engine === 'untagged' ? '' : customer.engine,
        monthsSince: String(customer.monthsSince),
      };
      for (const { templateId, touch } of touchIds) {
        const template = APPROVED_TEMPLATES[templateId];
        if (!template) continue; // registry gap — nothing to draft from
        const draftId = newDraftId('reactivation');
        push(
          await queueDraft({
            id: draftId,
            ts: ctx.now,
            capability: 'reactivation',
            source: `${customer.property}/touch-${touch}${touch === 2 ? ' (send 7 days after touch 1)' : ''}`,
            to: customer.email,
            from: fromEntry.from,
            subject: template.subject(vars),
            body: template.body(vars),
          }),
        );
        push(
          await logTouch({
            ts: ctx.now,
            capability: 'reactivation',
            source: `${customer.property}:${customer.engine}`,
            leadRef: customer.email,
            action: `queued win-back touch ${touch} (${draftId})`,
          }),
        );
      }
      state.reactivation.draftedCustomerKeys.push(key);
      draftedThisRun += 1;
    }
    if (capped) {
      findings.push({
        severity: 'info',
        project: REACTIVATION_HEADLINE,
        summary: `Draft cap reached — ${MAX_NEW_DRAFTS_PER_RUN} new customer sequences queued this run; remaining dormant customers queue on later runs`,
      });
    }

    // --- 3) Optional Resend DRAFT mirror (unsent broadcast; explicit opt-in) ---
    const segmentId = process.env.RESEND_REVENUE_CREW_SEGMENT_ID;
    if (!segmentId) {
      findings.push({
        severity: 'info',
        project: REACTIVATION_HEADLINE,
        summary: 'Resend draft mirror skipped — RESEND_REVENUE_CREW_SEGMENT_ID not configured; drafts queued in vault only',
      });
    } else if (draftedThisRun > 0) {
      const apiKey = resolveResendKey();
      if (!apiKey) {
        findings.push({
          severity: 'warn',
          project: REACTIVATION_HEADLINE,
          summary: 'Resend draft mirror skipped — RESEND_API_KEY not found (env or .env.local); drafts queued in vault only',
        });
      } else {
        try {
          const template = APPROVED_TEMPLATES['reactivation-touch-1'];
          // Creates an UNSENT broadcast draft only. NEVER calls a send/schedule
          // endpoint. Resend renamed Audiences→Segments — the wire field is
          // segment_id (stale audience_id would 4xx).
          const res = await fetch('https://api.resend.com/broadcasts', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              segment_id: segmentId,
              from: FROM_ADDRESSES.pc.from,
              subject: template.subject({}),
              text: template.body({}),
              name: `reactivation win-back draft ${ctx.now.slice(0, 10)}`,
            }),
          });
          if (!res.ok) throw new Error(`Resend broadcasts ${res.status}`);
          findings.push({
            severity: 'info',
            project: REACTIVATION_HEADLINE,
            summary: 'Resend broadcast DRAFT created (unsent — send stays with Lorenzo in the Resend UI)',
          });
        } catch (err) {
          findings.push({
            severity: 'warn',
            project: REACTIVATION_HEADLINE,
            summary: 'Resend draft mirror failed (vault queue unaffected)',
            detail: (err as Error).message.slice(0, 200),
          });
        }
      }
    }

    // --- 4) Always-current snapshot -------------------------------------------
    const queueDepth = await countQueuedDrafts();
    try {
      await fs.mkdir(OPS_DIR, { recursive: true });
      const md = renderSnapshot({ now: ctx.now, scans, unavailable, draftedThisRun, capped, queueDepth });
      await fs.writeFile(path.join(OPS_DIR, 'revenue-crew-reactivation.md'), md, 'utf8');
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'revenue-crew-reactivation.md',
        summary: 'Could not write reactivation snapshot (findings still valid)',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    // --- 5) Persist state + headline -------------------------------------------
    state.reactivation.lastRunIso = ctx.now;
    push(await saveState(state));

    findings.unshift({
      severity: 'ok',
      project: REACTIVATION_HEADLINE,
      summary:
        `${allDormant.length} dormant customer(s) across ${scans.length} account(s) — ` +
        `${draftedThisRun} win-back draft(s) queued, 0 sent (charter: outbound queues for Lorenzo)`,
    });

    return findings;
  },
};
