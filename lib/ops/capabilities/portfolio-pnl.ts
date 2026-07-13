import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Capability, Finding, OpsCtx } from '../types';
import {
  fetchMercurySnapshot,
  loadPcStudiosStripe,
  loadEngineProductMap,
  fetchStripeBalance,
  collectChargeSummary,
  collectActiveSubsByEngine,
  usd,
  round2,
  last4,
  type MercurySnapshot,
  type StripeBalanceUsd,
  type ChargeSummary,
  type SubAgg,
} from '../pnl-sources';

/**
 * portfolio-pnl — per-engine revenue truth report for the ops plane.
 *
 * Reads the two ground-truth money sources read-only (never a mutating call):
 *   - Mercury (PC Studios' bank) via keychain "mercury-pc-studios"
 *   - Stripe "The Perpetual Core LLC" (acct_1TYdKRI5V6IfhLCU) via keychain
 *     "stripe-pc-studios-live" — Sentinel today, more engines land on this
 *     account over time (Janice/Sage/RFP), picked up automatically via product
 *     metadata (`<engine>_product`).
 * A third source — Lorenzo's personal Stripe (lorenzodc/Janice-current/Academy)
 * — has no key reachable from this repo without copying secrets from another
 * repo's .env.local, so it's reported as an explicit "source not wired" line
 * rather than hacked around.
 *
 * Unlike revenue-pulse (24h anomaly pulse, writes deck_metrics), this is a
 * point-in-time balance-sheet snapshot: findings-only, no metrics upsert. In
 * addition to the standard dated report the runner writes for every capability
 * (writeback.ts), this also writes an always-current `portfolio-pnl.md` snapshot
 * to the same vault dir — the "one page" a HUD tile or brief can read without
 * needing to know today's date.
 */

const OPS_DIR = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'memory', 'ops-findings');

export const HEADLINE_PROJECT = 'Portfolio P&L';

function fmtChargeWindow(label: string, w: { count: number; grossUsd: number; hasMore: boolean }): string {
  const caveat = w.hasMore ? ' _(sampled from most recent 25 charges — more exist)_' : '';
  return `${label}: ${w.count} charge${w.count === 1 ? '' : 's'}, ${usd(w.grossUsd)} gross${caveat}`;
}

function renderSnapshot(opts: {
  now: string;
  mercury: MercurySnapshot | null;
  mercuryError: string | null;
  stripe: {
    label: string;
    acctIdLast4: string;
    balance: StripeBalanceUsd;
    charges: ChargeSummary;
    subs: SubAgg[];
  } | null;
  stripeError: string | null;
  personalStripeNote: string;
  totalMrrUsd: number;
  total7dGrossUsd: number;
  engineRows: Array<{ engine: string; account: string; mrrUsd: number; gross7dUsd: number; lifetimeGrossUsd: number }>;
}): string {
  const day = opts.now.slice(0, 10);
  const mercuryBalanceUsd = opts.mercury ? opts.mercury.accounts.reduce((s, a) => s + a.availableUsd, 0) : null;

  const L: string[] = [
    '---',
    `name: portfolio-pnl-snapshot`,
    `description: Portfolio P&L — always-current per-engine revenue snapshot (last run ${day})`,
    'metadata:',
    '  type: reference',
    '  source: ops-runner',
    '---',
    '',
    '# Portfolio P&L',
    '',
    `Run at ${opts.now}`,
    '',
    `> **Headline:** Portfolio MRR ${usd(opts.totalMrrUsd)} · 7d gross ${usd(opts.total7dGrossUsd)} · ` +
      `Mercury balance ${mercuryBalanceUsd === null ? 'unavailable' : usd(mercuryBalanceUsd)}`,
    '',
    '## Bank — Mercury (PC Studios)',
    '',
  ];

  if (opts.mercury) {
    for (const a of opts.mercury.accounts) {
      L.push(`- **${a.name}** (••${a.last4}, ${a.status}): available ${usd(a.availableUsd)} · current ${usd(a.currentUsd)}`);
    }
    L.push(
      `- Last 7 days: ${usd(opts.mercury.inflow7dUsd)} in / ${usd(opts.mercury.outflow7dUsd)} out ` +
        `(${opts.mercury.txCount7d} posted transaction${opts.mercury.txCount7d === 1 ? '' : 's'})`,
    );
  } else {
    L.push(`- source unavailable: ${opts.mercuryError ?? 'Mercury keychain entry "mercury-pc-studios" not found'}`);
  }
  L.push('');

  L.push('## Stripe', '');
  if (opts.stripe) {
    const s = opts.stripe;
    L.push(`### ${s.label} (acct ••${s.acctIdLast4})`, '');
    L.push(`- Balance: ${usd(s.balance.availableUsd)} available · ${usd(s.balance.pendingUsd)} pending`);
    L.push(`- ${fmtChargeWindow('Last 7d', s.charges.window7d)}`);
    L.push(`- ${fmtChargeWindow('Last 30d', s.charges.window30d)}`);
    L.push(`- ${fmtChargeWindow('Lifetime', s.charges.lifetime)}${s.charges.lifetime.hasMore ? '' : ' _(exact — full charge history fits in one page)_'}`);
    if (s.subs.length === 0) {
      L.push('- No active subscriptions.');
    } else {
      L.push('- Active subscriptions:');
      for (const sub of s.subs) {
        L.push(`  - ${sub.engine}: ${sub.count} sub${sub.count === 1 ? '' : 's'}, MRR ${usd(sub.mrrUsd)}`);
      }
    }
  } else {
    L.push(`- source unavailable: ${opts.stripeError ?? 'Stripe keychain entry "stripe-pc-studios-live" not found'}`);
  }
  L.push('');
  L.push(`### Lorenzo Daughtry-Chambers Personal (lorenzodc / Janice-current / Academy)`, '');
  L.push(`- source unavailable: ${opts.personalStripeNote}`);
  L.push('');

  L.push('## Per-engine rollup', '');
  if (opts.engineRows.length === 0) {
    L.push('- No engine revenue rows — no Stripe source produced charge or subscription data.');
  } else {
    L.push('| Engine | Account | MRR | 7d gross | Lifetime gross |');
    L.push('|---|---|---|---|---|');
    for (const r of opts.engineRows) {
      L.push(`| ${r.engine} | ${r.account} | ${usd(r.mrrUsd)} | ${usd(r.gross7dUsd)} | ${usd(r.lifetimeGrossUsd)} |`);
    }
  }
  L.push('');
  L.push('> Findings only — nothing was changed. Read-only balances/lists, no mutating calls.', '');

  return L.join('\n');
}

export const portfolioPnl: Capability = {
  id: 'portfolio-pnl',
  label: 'PORTFOLIO P&L',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // --- Mercury -------------------------------------------------------------
    let mercury: MercurySnapshot | null = null;
    let mercuryError: string | null = null;
    try {
      mercury = await fetchMercurySnapshot(ctx.now);
      if (!mercury) {
        mercuryError = 'Mercury keychain entry "mercury-pc-studios" (account "perpetual-core") not found';
        findings.push({ severity: 'warn', project: 'Mercury', summary: `Source unavailable: ${mercuryError}` });
      }
    } catch (err) {
      mercuryError = (err as Error).message.slice(0, 200);
      findings.push({ severity: 'warn', project: 'Mercury', summary: `Source unavailable: ${mercuryError}` });
    }

    // --- Stripe PC Studios -----------------------------------------------------
    let stripeSection: {
      label: string;
      acctIdLast4: string;
      balance: StripeBalanceUsd;
      charges: ChargeSummary;
      subs: SubAgg[];
    } | null = null;
    let stripeError: string | null = null;
    try {
      const acct = loadPcStudiosStripe();
      if (!acct) {
        stripeError = 'Stripe keychain entry "stripe-pc-studios-live" (account "perpetual-core") not found';
        findings.push({ severity: 'warn', project: 'Stripe (PC Studios)', summary: `Source unavailable: ${stripeError}` });
      } else {
        const engineMap = await loadEngineProductMap(acct.client);
        const [balance, charges, subs, acctInfo] = await Promise.all([
          fetchStripeBalance(acct.client),
          collectChargeSummary(acct.client, engineMap, ctx.now),
          collectActiveSubsByEngine(acct.client, engineMap),
          acct.client.accounts.retrieve().catch(() => null),
        ]);
        stripeSection = {
          label: acct.label,
          // real account id when reachable; loader's key-derived fallback otherwise
          acctIdLast4: acctInfo ? last4(acctInfo.id) : acct.acctIdLast4,
          balance,
          charges,
          subs,
        };

        for (const sub of subs) {
          if (sub.engine === 'untagged') {
            findings.push({
              severity: 'info',
              project: acct.label,
              summary: `${sub.count} active subscription(s) with no engine tag on the product`,
              detail: 'Add a "<engine>_product" metadata key to the Stripe product to attribute MRR.',
            });
          }
        }
      }
    } catch (err) {
      stripeError = (err as Error).message.slice(0, 200);
      findings.push({ severity: 'warn', project: 'Stripe (PC Studios)', summary: `Source unavailable: ${stripeError}` });
    }

    // --- Personal Stripe (always unwired from this repo) ----------------------
    const personalStripeNote =
      'no key reachable from perpetual-core (lives in another repo\'s .env.local) — not copied per security policy';
    findings.push({
      severity: 'info',
      project: 'Stripe (Personal)',
      summary: `Source unavailable: ${personalStripeNote}`,
      detail: 'Engines pending this source: lorenzodc, Janice (current), Academy (current).',
    });

    // --- Per-engine rollup + totals --------------------------------------------
    const engineRows: Array<{ engine: string; account: string; mrrUsd: number; gross7dUsd: number; lifetimeGrossUsd: number }> = [];
    if (stripeSection) {
      const engines = new Set<string>([...stripeSection.subs.map((s) => s.engine), ...stripeSection.charges.byEngine.keys()]);
      for (const engine of engines) {
        const sub = stripeSection.subs.find((s) => s.engine === engine);
        const chargeAgg = stripeSection.charges.byEngine.get(engine);
        engineRows.push({
          engine,
          account: stripeSection.label,
          mrrUsd: sub?.mrrUsd ?? 0,
          gross7dUsd: chargeAgg?.gross7dUsd ?? 0,
          lifetimeGrossUsd: chargeAgg?.grossLifetimeUsd ?? 0,
        });
      }
      engineRows.sort((a, b) => b.mrrUsd - a.mrrUsd);
    }

    const totalMrrUsd = round2(engineRows.reduce((s, r) => s + r.mrrUsd, 0));
    const total7dGrossUsd = round2(stripeSection?.charges.window7d.grossUsd ?? 0);

    // --- Headline finding (first — daily-brief.ts pulls this by project name) --
    const mercuryBalanceUsd = mercury ? mercury.accounts.reduce((s, a) => s + a.availableUsd, 0) : null;
    findings.unshift({
      severity: 'ok',
      project: HEADLINE_PROJECT,
      summary:
        `Portfolio MRR ${usd(totalMrrUsd)} · 7d gross ${usd(total7dGrossUsd)} · ` +
        `Mercury balance ${mercuryBalanceUsd === null ? 'unavailable' : usd(mercuryBalanceUsd)}`,
    });

    // --- Write the always-current snapshot alongside the dated report ----------
    try {
      await fs.mkdir(OPS_DIR, { recursive: true });
      const md = renderSnapshot({
        now: ctx.now,
        mercury,
        mercuryError,
        stripe: stripeSection,
        stripeError,
        personalStripeNote,
        totalMrrUsd,
        total7dGrossUsd,
        engineRows,
      });
      await fs.writeFile(path.join(OPS_DIR, 'portfolio-pnl.md'), md, 'utf8');
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'portfolio-pnl.md',
        summary: 'Could not write snapshot file (findings still valid)',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    return findings;
  },
};
