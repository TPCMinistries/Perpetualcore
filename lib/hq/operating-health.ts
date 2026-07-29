import { createHash } from 'node:crypto';
import { z } from 'zod';

const healthStateSchema = z.enum(['healthy', 'warning', 'critical', 'unknown']);

const metricReceiptSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{1,63}$/),
  label: z.string().trim().min(1).max(100),
  value: z.number().finite().nonnegative(),
  limit: z.number().finite().positive().nullable(),
  unit: z.string().trim().min(1).max(32),
  warningAt: z.number().finite().min(0).max(1).default(0.8),
  criticalAt: z.number().finite().min(0).max(2).default(1),
});

const evidenceSchema = z.object({
  kind: z.enum(['deployment', 'runtime', 'billing', 'log', 'configuration']),
  ref: z.string().trim().min(1).max(240),
  label: z.string().trim().min(1).max(120),
});

export const operatingHealthReceiptSchema = z.object({
  schemaVersion: z.literal(1),
  sourceKey: z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{1,63}$/),
  displayName: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(64),
  observedAt: z.iso.datetime({ offset: true }),
  ttlMinutes: z.number().int().min(5).max(10_080).default(1_440),
  collectorStatus: z.enum(['healthy', 'error']).default('healthy'),
  summary: z.string().trim().min(1).max(500),
  metrics: z.array(metricReceiptSchema).min(1).max(20),
  evidence: z.array(evidenceSchema).max(10).default([]),
});

export type OperatingHealthReceipt = z.infer<typeof operatingHealthReceiptSchema>;
export type OperatingHealthState = z.infer<typeof healthStateSchema>;

export interface OperatingHealthMetric {
  key: string;
  label: string;
  value: number;
  limit: number | null;
  unit: string;
  ratio: number | null;
  state: OperatingHealthState;
}

export interface OperatingHealthItem {
  key: string;
  label: string;
  provider: string;
  summary: string;
  state: OperatingHealthState;
  freshness: 'fresh' | 'stale' | 'error';
  observedAt: string;
  expiresAt: string;
  metrics: OperatingHealthMetric[];
  evidence: z.infer<typeof evidenceSchema>[];
}

export interface OperatingHealthSourceRow {
  source_key: string;
  display_name: string;
  status: 'unknown' | 'fresh' | 'stale' | 'error';
  observed_at: string;
  expires_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

export interface OperatingHealthRollup {
  status: OperatingHealthState;
  sourceCount: number;
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
  stale: number;
}

interface OperatingHealthHistoryEntry {
  observedAt: string;
  state: OperatingHealthState;
  metrics: Array<Pick<OperatingHealthMetric, 'key' | 'value' | 'limit' | 'state'>>;
}

const storedMetadataSchema = z.object({
  operatingHealth: z.literal(true),
  schemaVersion: z.literal(1),
  provider: z.string(),
  summary: z.string(),
  healthState: healthStateSchema,
  metrics: z.array(z.object({
    key: z.string(),
    label: z.string(),
    value: z.number(),
    limit: z.number().nullable(),
    unit: z.string(),
    ratio: z.number().nullable(),
    state: healthStateSchema,
  })),
  evidence: z.array(evidenceSchema),
  history: z.array(z.object({
    observedAt: z.string(),
    state: healthStateSchema,
    metrics: z.array(z.object({
      key: z.string(),
      value: z.number(),
      limit: z.number().nullable(),
      state: healthStateSchema,
    })),
  })).default([]),
});

const STATE_RANK: Record<OperatingHealthState, number> = {
  unknown: 0,
  healthy: 1,
  warning: 2,
  critical: 3,
};

function evaluateMetric(metric: z.infer<typeof metricReceiptSchema>): OperatingHealthMetric {
  if (metric.limit === null) {
    return { ...metric, ratio: null, state: 'unknown' };
  }
  const ratio = metric.value / metric.limit;
  const state: OperatingHealthState = ratio >= metric.criticalAt
    ? 'critical'
    : ratio >= metric.warningAt
      ? 'warning'
      : 'healthy';
  return { ...metric, ratio, state };
}

function overallState(metrics: OperatingHealthMetric[]): OperatingHealthState {
  return metrics.reduce<OperatingHealthState>(
    (worst, metric) => STATE_RANK[metric.state] > STATE_RANK[worst] ? metric.state : worst,
    'unknown',
  );
}

function historyFrom(metadata: Record<string, unknown> | null | undefined): OperatingHealthHistoryEntry[] {
  const parsed = storedMetadataSchema.safeParse(metadata);
  return parsed.success ? parsed.data.history : [];
}

export function buildOperatingHealthFreshnessRow(
  input: OperatingHealthReceipt,
  existingMetadata?: Record<string, unknown> | null,
) {
  const receipt = operatingHealthReceiptSchema.parse(input);
  const metrics = receipt.metrics.map(evaluateMetric);
  const healthState = receipt.collectorStatus === 'error' ? 'unknown' : overallState(metrics);
  const expiresAt = new Date(Date.parse(receipt.observedAt) + receipt.ttlMinutes * 60_000).toISOString();
  const historyEntry: OperatingHealthHistoryEntry = {
    observedAt: receipt.observedAt,
    state: healthState,
    metrics: metrics.map(({ key, value, limit, state }) => ({ key, value, limit, state })),
  };
  const history = [...historyFrom(existingMetadata), historyEntry].slice(-30);
  const metadata = {
    operatingHealth: true as const,
    schemaVersion: 1 as const,
    dataBoundary: 'aggregate-operating-health',
    provider: receipt.provider,
    summary: receipt.summary,
    healthState,
    metrics,
    evidence: receipt.evidence,
    history,
  };

  return {
    source_key: `operating_health:${receipt.sourceKey}`,
    display_name: receipt.displayName,
    status: receipt.collectorStatus === 'error' ? 'error' as const : 'fresh' as const,
    observed_at: receipt.observedAt,
    source_generated_at: receipt.observedAt,
    expires_at: expiresAt,
    last_success_at: receipt.collectorStatus === 'healthy' ? receipt.observedAt : null,
    last_error_at: receipt.collectorStatus === 'error' ? receipt.observedAt : null,
    error_message: receipt.collectorStatus === 'error' ? receipt.summary : null,
    content_hash: createHash('sha256').update(JSON.stringify(metadata)).digest('hex'),
    metadata,
    updated_at: receipt.observedAt,
  };
}

export function extractOperatingHealthItems(
  sources: OperatingHealthSourceRow[],
  now = new Date().toISOString(),
): OperatingHealthItem[] {
  const nowMs = Date.parse(now);
  return sources.flatMap((source) => {
    const parsed = storedMetadataSchema.safeParse(source.metadata);
    if (!parsed.success || !source.source_key.startsWith('operating_health:') || !source.expires_at) return [];
    const freshness: OperatingHealthItem['freshness'] = source.status === 'error'
      ? 'error'
      : Date.parse(source.expires_at) <= nowMs || source.status === 'stale'
        ? 'stale'
        : 'fresh';
    const state: OperatingHealthState = freshness === 'error'
      ? 'critical'
      : freshness === 'stale'
        ? 'warning'
        : parsed.data.healthState;
    return [{
      key: source.source_key,
      label: source.display_name,
      provider: parsed.data.provider,
      summary: source.error_message ?? parsed.data.summary,
      state,
      freshness,
      observedAt: source.observed_at,
      expiresAt: source.expires_at,
      metrics: parsed.data.metrics,
      evidence: parsed.data.evidence,
    }];
  }).sort((a, b) => STATE_RANK[b.state] - STATE_RANK[a.state] || a.label.localeCompare(b.label));
}

export function summarizeOperatingHealth(
  sources: OperatingHealthSourceRow[],
  now = new Date().toISOString(),
): OperatingHealthRollup {
  const items = extractOperatingHealthItems(sources, now);
  const counts = items.reduce(
    (summary, item) => {
      summary[item.state] += 1;
      if (item.freshness !== 'fresh') summary.stale += 1;
      return summary;
    },
    { healthy: 0, warning: 0, critical: 0, unknown: 0, stale: 0 },
  );
  const status: OperatingHealthState = counts.critical > 0
    ? 'critical'
    : counts.warning > 0 || counts.stale > 0
      ? 'warning'
      : counts.unknown > 0 || items.length === 0
        ? 'unknown'
        : 'healthy';

  return {
    status,
    sourceCount: items.length,
    ...counts,
  };
}
