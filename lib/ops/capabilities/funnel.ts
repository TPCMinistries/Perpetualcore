import type { Capability, Finding, MetricRow, OpsCtx, Row } from '../types';
import { BRAIN_TARGET, pushMetrics } from '../deck-push';

/**
 * funnel — the demand half of the Operator Deck.
 *
 * revenue-pulse already reads the bottom of the funnel (Stripe charges, active
 * subs) and revenue-probes proves the register still opens. Nothing read the
 * middle: whether anyone is asking to buy. This does.
 *
 * It reads public.leads on Brain and splits every lead by source into two
 * classes: REVENUE_INTENT (someone asked to talk to sales) and everything else
 * (newsletter/resource capture — real, but free). The split is the whole point.
 * A site can look alive on total lead count while the money path is stone dead,
 * which is exactly the state this capability was written from: on 2026-08-07,
 * 24 of 24 leads in 30 days were footer newsletter signups and `contact-sales`
 * had never produced a single row.
 *
 * Emits deck_metrics so the number has a history to compare against, and raises
 * a critical when demand exists but none of it is revenue intent — the one
 * shape that reads as "traffic is fine" on every other tile.
 *
 * Findings-only, like every capability here; the deck_metrics upsert is the one
 * write and it targets an internal derived table, never user data.
 */

/** Lead sources that mean "this person asked to buy". Keep in sync with the
 *  `source:` values written by app/api/contact-sales/route.ts. */
const REVENUE_INTENT_SOURCES = ['contact-sales'];

function num(rows: Row[], col: string): number {
  const v = rows[0]?.[col];
  return typeof v === 'number' ? v : Number(v ?? 0) || 0;
}

export const funnel: Capability = {
  id: 'funnel',
  label: 'FUNNEL',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const metrics: MetricRow[] = [];
    const day = ctx.now.slice(0, 10);

    const present = (await ctx.runSql(
      BRAIN_TARGET,
      "select to_regclass('public.leads') is not null as ok",
    )) as Row[];
    if (!present[0]?.ok) {
      return [
        {
          severity: 'info',
          project: 'Funnel',
          summary: 'public.leads not present — funnel dormant',
        },
      ];
    }

    // Per-source volume over the two windows that matter: yesterday (is it
    // moving?) and 30 days (is the shape healthy?).
    const bySource = (await ctx.runSql(
      BRAIN_TARGET,
      `select coalesce(source, '(none)') as source,
              count(*) filter (where created_at >= now() - interval '1 day')::int  as d1,
              count(*) filter (where created_at >= now() - interval '7 days')::int  as d7,
              count(*) filter (where created_at >= now() - interval '30 days')::int as d30
         from public.leads
        group by 1
        order by d30 desc`,
    )) as Row[];

    let intent30 = 0;
    let other30 = 0;
    let intent1 = 0;

    for (const r of bySource) {
      const source = String(r.source ?? '(none)');
      const d1 = Number(r.d1 ?? 0);
      const d7 = Number(r.d7 ?? 0);
      const d30 = Number(r.d30 ?? 0);
      const isIntent = REVENUE_INTENT_SOURCES.includes(source);

      if (isIntent) {
        intent30 += d30;
        intent1 += d1;
      } else {
        other30 += d30;
      }

      metrics.push(
        { day, source: 'site:perpetualcore', segment: source, metric: 'leads_24h', value: d1 },
        { day, source: 'site:perpetualcore', segment: source, metric: 'leads_7d', value: d7 },
        { day, source: 'site:perpetualcore', segment: source, metric: 'leads_30d', value: d30 },
      );

      findings.push({
        severity: 'info',
        project: 'Funnel',
        summary: `${source}: ${d1} in 24h, ${d7} in 7d, ${d30} in 30d`,
      });
    }

    // Each declared revenue-intent source gets its own row even at zero, so a
    // dead money path is visible as a number rather than as an absent line.
    for (const source of REVENUE_INTENT_SOURCES) {
      if (!bySource.some((r) => String(r.source ?? '') === source)) {
        metrics.push(
          { day, source: 'site:perpetualcore', segment: source, metric: 'leads_24h', value: 0 },
          { day, source: 'site:perpetualcore', segment: source, metric: 'leads_7d', value: 0 },
          { day, source: 'site:perpetualcore', segment: source, metric: 'leads_30d', value: 0 },
        );
      }
    }

    const total30 = (await ctx.runSql(
      BRAIN_TARGET,
      `select count(*)::int as c from public.leads where created_at >= now() - interval '30 days'`,
    )) as Row[];
    const all30 = num(total30, 'c');

    // Traffic denominator. Counted by DISTINCT ip_address, deliberately NOT by
    // anonymous_id: proxy.ts only issues the pc_anon_id cookie when consent is
    // accepted, so every non-consenting visitor carries anonymous_id = NULL and
    // they all collapse into one bucket. Counting identities that way showed
    // visitors "falling" 87 -> 1 between April and August 2026 while distinct
    // IPs were at their HIGHEST in July — a pure artifact that briefly convinced
    // this capability's author the site had no traffic at all. IPs include bots,
    // so treat these as an upper bound, but they are not consent-gated.
    const traffic = (await ctx.runSql(
      BRAIN_TARGET,
      `select
         count(distinct ip_address) filter (where created_at >= now() - interval '1 day')::int   as d1,
         count(distinct ip_address) filter (where created_at >= now() - interval '7 days')::int  as d7,
         count(distinct ip_address) filter (where created_at >= now() - interval '30 days')::int as d30,
         count(*) filter (where created_at >= now() - interval '30 days')::int                   as events30,
         count(*) filter (where created_at >= now() - interval '30 days'
                            and anonymous_id is null and user_id is null)::int                   as anon_null30
       from public.analytics_events`,
    )) as Row[];
    const visits1 = num(traffic, 'd1');
    const visits7 = num(traffic, 'd7');
    const visits30 = num(traffic, 'd30');
    const events30 = num(traffic, 'events30');
    const anonNull30 = num(traffic, 'anon_null30');

    metrics.push(
      { day, source: 'site:perpetualcore', segment: 'ip', metric: 'visits_24h', value: visits1 },
      { day, source: 'site:perpetualcore', segment: 'ip', metric: 'visits_7d', value: visits7 },
      { day, source: 'site:perpetualcore', segment: 'ip', metric: 'visits_30d', value: visits30 },
    );

    findings.push({
      severity: 'info',
      project: 'Funnel',
      summary: `traffic: ${visits1} distinct IPs in 24h, ${visits7} in 7d, ${visits30} in 30d`,
      detail: 'Counted by IP because consent-gated anonymous_id under-counts. IPs include bots — upper bound.',
    });

    // If most events carry no identity, any conversion RATE computed from
    // anonymous_id is meaningless. Say so rather than let someone quote it.
    if (events30 > 0 && anonNull30 / events30 > 0.5) {
      findings.push({
        severity: 'warn',
        project: 'Funnel',
        summary: `${anonNull30}/${events30} events in 30d have no identity — conversion RATE is not measurable by anonymous_id`,
        detail:
          'proxy.ts issues pc_anon_id only on consent, so unconsented visitors are indistinguishable. ' +
          'This is GDPR-correct, not a bug. Use IP counts, or restrict rate maths to consented traffic.',
      });
    }

    metrics.push(
      { day, source: 'site:perpetualcore', segment: 'revenue_intent', metric: 'leads_30d', value: intent30 },
      { day, source: 'site:perpetualcore', segment: 'all', metric: 'leads_30d', value: all30 },
    );

    // The shape this capability exists to catch: demand is arriving and none of
    // it is asking to buy. Every other tile reads healthy in this state.
    if (other30 > 0 && intent30 === 0) {
      findings.push({
        severity: 'critical',
        project: 'Funnel',
        summary: `${other30} leads in 30d, ZERO revenue intent — the money CTA is producing nothing`,
        detail:
          `Sources counted as revenue intent: ${REVENUE_INTENT_SOURCES.join(', ')}. ` +
          `Traffic converts to free capture but never to a sales conversation, so the ` +
          `break is between landing on the site and submitting /contact-sales — not upstream traffic.`,
        fixHint:
          'Check /contact-sales renders and submits (POST /api/contact-sales writes source="contact-sales"), ' +
          'then check the homepage CTA actually routes there.',
      });
    } else if (all30 === 0) {
      findings.push({
        severity: 'warn',
        project: 'Funnel',
        summary: 'No leads at all in 30 days — capture is dead or nobody is arriving',
      });
    } else if (intent1 > 0) {
      findings.push({
        severity: 'ok',
        project: 'Funnel',
        summary: `${intent1} revenue-intent lead(s) in the last 24h`,
      });
    }

    // Measurement-integrity guard. funnel_daily_summary is a matview over
    // analytics_events, refreshed hourly by /api/cron/refresh-funnel. On
    // 2026-08-07 it was found holding 0 rows while analytics_events held 485,
    // because refresh_funnel_summary() uses REFRESH ... CONCURRENTLY and the
    // only unique index is on expressions (COALESCE(...)), which Postgres does
    // not accept for a concurrent refresh — so every hourly run had thrown
    // 55000 since creation and no surface reading the view ever showed a number.
    // A dead measurement reads exactly like a dead business, so check the
    // instrument itself, not only what it reports.
    try {
      const integrity = (await ctx.runSql(
        BRAIN_TARGET,
        `select (select count(*) from public.analytics_events)::int as events,
                (select count(*) from public.funnel_daily_summary)::int as summarised,
                (select max(day)::text from public.funnel_daily_summary) as latest_day`,
      )) as Row[];
      const events = num(integrity, 'events');
      const summarised = num(integrity, 'summarised');
      const latestDay = integrity[0]?.latest_day ? String(integrity[0].latest_day) : null;

      if (events > 0 && summarised === 0) {
        findings.push({
          severity: 'critical',
          project: 'Funnel',
          summary: `funnel_daily_summary is empty while analytics_events holds ${events} rows — the funnel view is not refreshing`,
          detail: 'Every surface reading funnel_daily_summary is showing zero for a reason that has nothing to do with demand.',
          fixHint:
            'refresh_funnel_summary() uses REFRESH MATERIALIZED VIEW CONCURRENTLY, which requires a unique index on plain ' +
            'columns; idx_funnel_daily_unique is built on COALESCE() expressions and does not qualify. Drop CONCURRENTLY ' +
            'or rebuild the index on non-null columns.',
        });
      } else if (latestDay && latestDay < day) {
        findings.push({
          severity: 'warn',
          project: 'Funnel',
          summary: `funnel_daily_summary latest day is ${latestDay}, expected ${day} — refresh is lagging`,
        });
      }
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'Funnel',
        summary: 'Funnel integrity check failed',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    try {
      await pushMetrics(ctx.runSql, metrics);
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'deck_metrics',
        summary: 'Funnel metrics upsert failed',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    return findings;
  },
};
