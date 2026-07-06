import type { Capability, Finding, MetricRow, OpsCtx, Row } from '../types';
import { BRAIN_TARGET, pushMetrics } from '../deck-push';

/**
 * pipeline — the deals half of the Operator Deck.
 *
 * Reads the `crm` schema on Brain (CRM kernel, WS3) via raw SQL through the same
 * executor — no PostgREST exposure needed, the Management API runs as a privileged
 * role. DORMANT until the crm migrations are applied: `to_regclass('crm.crm_record')`
 * returns null → one info finding and return, so this can ship now and light up the
 * day WS3 deploys without any code change here.
 *
 * When live: pipeline value by stage/entity → deck_metrics; stale-deal findings
 * (no touch in >10 days, not in a won/lost stage).
 */
export const pipeline: Capability = {
  id: 'pipeline',
  label: 'PIPELINE',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const present = (await ctx.runSql(
      BRAIN_TARGET,
      "select to_regclass('crm.crm_record') is not null as ok",
    )) as Row[];
    if (!present[0]?.ok) {
      return [
        {
          severity: 'info',
          project: 'CRM',
          summary: 'crm schema not deployed yet — pipeline dormant',
          detail: 'Deploy the CRM kernel (WS3) to Brain and this capability lights up automatically.',
        },
      ];
    }

    const findings: Finding[] = [];
    const metrics: MetricRow[] = [];
    const day = ctx.now.slice(0, 10);

    // Pipeline value by workspace + stage. `amount` lives in the JSONB data column.
    const rows = (await ctx.runSql(
      BRAIN_TARGET,
      `select w.name as workspace, st.name as stage,
              count(*)::int as deals,
              coalesce(sum((r.data->>'amount')::numeric), 0) as value_usd
         from crm.crm_record r
         join crm.crm_pipeline p on p.id = r.pipeline_id
         join crm.crm_stage st on st.id = r.stage_id
         join crm.workspace w on w.id = r.workspace_id
        where r.deleted_at is null
        group by w.name, st.name
        order by value_usd desc`,
    )) as Row[];

    for (const r of rows) {
      const workspace = String(r.workspace ?? 'unknown');
      const stage = String(r.stage ?? 'unknown');
      metrics.push({ day, source: 'crm', segment: `${workspace}/${stage}`, metric: 'pipeline_usd', value: Number(r.value_usd) || 0 });
      metrics.push({ day, source: 'crm', segment: `${workspace}/${stage}`, metric: 'deal_count', value: Number(r.deals) || 0 });
    }

    // Stale deals: not touched in >10 days and not in a won/lost/closed stage.
    const stale = (await ctx.runSql(
      BRAIN_TARGET,
      `select w.name as workspace, st.name as stage, r.data->>'name' as deal,
              (r.data->>'amount')::numeric as amount,
              extract(day from now() - r.updated_at)::int as idle_days
         from crm.crm_record r
         join crm.crm_stage st on st.id = r.stage_id
         join crm.workspace w on w.id = r.workspace_id
        where r.deleted_at is null
          and r.updated_at < now() - interval '10 days'
          and st.name !~* '(won|lost|closed)'
        order by amount desc nulls last
        limit 20`,
    )) as Row[];

    for (const r of stale) {
      findings.push({
        severity: 'warn',
        project: String(r.workspace ?? 'CRM'),
        summary: `Stale deal: "${r.deal ?? '(unnamed)'}" idle ${r.idle_days}d in ${r.stage}`,
        detail: r.amount ? `Value ${r.amount}. No touch in ${r.idle_days} days.` : undefined,
      });
    }

    try {
      await pushMetrics(ctx.runSql, metrics);
    } catch (err) {
      findings.push({ severity: 'warn', project: 'deck_metrics', summary: 'Pipeline metrics upsert failed', detail: (err as Error).message.slice(0, 200) });
    }

    if (findings.length === 0) {
      findings.push({ severity: 'ok', project: 'CRM', summary: `Pipeline recorded across ${rows.length} stage buckets, no stale deals` });
    }
    return findings;
  },
};
