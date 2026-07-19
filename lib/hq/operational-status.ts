import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const sourceSchema = z.object({
  source_key: z.string(),
  display_name: z.string(),
  status: z.enum(['unknown', 'fresh', 'stale', 'error']),
  observed_at: z.string(),
  source_generated_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
  error_message: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

const runSchema = z.object({
  id: z.string(),
  queue_item_id: z.string().nullable(),
  action_key: z.string(),
  status: z.string(),
  queued_at: z.string(),
  finished_at: z.string().nullable(),
  error_message: z.string().nullable(),
  dry_run: z.boolean(),
});

const metricSchema = z.object({
  id: z.string(),
  metric_key: z.string(),
  metric_name: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string(),
  direction: z.string(),
  engine_key: z.string().nullable(),
  measured_at: z.string(),
  action_run_id: z.string().nullable(),
});

const queueStateSchema = z.object({
  status: z.string(),
  execution_state: z.string(),
});

export interface HqOperationalStatus {
  sources: z.infer<typeof sourceSchema>[];
  recentRuns: z.infer<typeof runSchema>[];
  runCounts: Record<string, number>;
  queueCounts: Record<string, number>;
  executionStateCounts: Record<string, number>;
  outcomes: Array<Omit<z.infer<typeof metricSchema>, 'value'> & { value: number }>;
  verifiedRunIds: string[];
}

const EMPTY: HqOperationalStatus = {
  sources: [],
  recentRuns: [],
  runCounts: {},
  queueCounts: {},
  executionStateCounts: {},
  outcomes: [],
  verifiedRunIds: [],
};

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

/** Owner-page server read. Missing/unapplied execution-plane tables degrade to an empty state. */
export async function getHqOperationalStatus(): Promise<HqOperationalStatus> {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const [sourcesResult, runsResult, metricsResult, queueResult] = await Promise.all([
      admin.from('hq_source_freshness').select('source_key, display_name, status, observed_at, source_generated_at, expires_at, last_success_at, error_message, metadata').order('display_name'),
      admin.from('hq_action_runs').select('id, queue_item_id, action_key, status, queued_at, finished_at, error_message, dry_run').order('queued_at', { ascending: false }).limit(100),
      admin.from('hq_outcome_metrics').select('id, metric_key, metric_name, value, unit, direction, engine_key, measured_at, action_run_id').order('measured_at', { ascending: false }).limit(200),
      admin.from('hq_queue').select('status, execution_state').limit(500),
    ]);
    if (sourcesResult.error || runsResult.error || metricsResult.error || queueResult.error) return EMPTY;
    const sources = z.array(sourceSchema).parse(sourcesResult.data ?? []);
    const recentRuns = z.array(runSchema).parse(runsResult.data ?? []);
    const rawOutcomes = z.array(metricSchema).parse(metricsResult.data ?? []);
    const queueStates = z.array(queueStateSchema).parse(queueResult.data ?? []);
    const outcomes = rawOutcomes.flatMap((metric) => {
      const value = Number(metric.value);
      return Number.isFinite(value) ? [{ ...metric, value }] : [];
    });
    const realRuns = recentRuns.filter((run) => !run.dry_run);
    const runCounts = countValues(realRuns.map((run) => run.status));
    const queueCounts = countValues(queueStates.map((row) => row.status));
    const executionStateCounts = countValues(queueStates.map((row) => row.execution_state));
    const verifiedRunIds = [...new Set(outcomes.flatMap((metric) => metric.action_run_id ? [metric.action_run_id] : []))];
    return { sources, recentRuns, runCounts, queueCounts, executionStateCounts, outcomes, verifiedRunIds };
  } catch {
    return EMPTY;
  }
}
