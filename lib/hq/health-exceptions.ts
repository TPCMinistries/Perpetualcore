import { z } from 'zod';
import {
  extractOperatingHealthItems,
  type OperatingHealthItem,
  type OperatingHealthSourceRow,
} from '@/lib/hq/operating-health';

const existingHealthExceptionSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  detail: z.string().nullable(),
  severity: z.string(),
  status: z.string(),
  verdict_note: z.string().nullable(),
  decided_at: z.string().nullable(),
  decided_by: z.string().nullable(),
  snooze_until: z.string().nullable(),
  synced_to_ledger: z.boolean(),
  first_seen: z.string(),
  last_seen: z.string(),
  contract_version: z.number().int().positive(),
  action_key: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  recommended_action: z.string().nullable(),
  expected_outcome: z.string().nullable(),
  risk_level: z.enum(['low', 'medium', 'high', 'prohibited']),
  side_effect_class: z.enum(['read_only', 'internal_write', 'external_write', 'money', 'outbound']),
  approval_required: z.boolean(),
  executor: z.string().nullable(),
  execution_payload: z.record(z.string(), z.unknown()),
  rollback_plan: z.string().nullable(),
  execution_state: z.string(),
  execution_requested_at: z.string().nullable(),
  execution_started_at: z.string().nullable(),
  execution_finished_at: z.string().nullable(),
  last_execution_error: z.string().nullable(),
});

const operatingHealthSourceSchema = z.object({
  source_key: z.string(),
  display_name: z.string(),
  status: z.enum(['unknown', 'fresh', 'stale', 'error']),
  observed_at: z.string(),
  expires_at: z.string().nullable(),
  error_message: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

export type ExistingHealthException = z.infer<typeof existingHealthExceptionSchema>;

export interface HealthExceptionQueueRow extends ExistingHealthException {
  updated_at: string;
}

export interface HealthExceptionSyncPlan {
  rows: HealthExceptionQueueRow[];
  active: number;
  created: number;
  updated: number;
  reopened: number;
  resolved: number;
}

const SEVERITY_RANK: Record<string, number> = {
  info: 0,
  low: 0,
  warn: 1,
  warning: 1,
  medium: 1,
  high: 2,
  critical: 2,
};

function severityFor(item: OperatingHealthItem): 'critical' | 'warning' {
  return item.state === 'critical' || item.freshness === 'error' ? 'critical' : 'warning';
}

function queueId(sourceKey: string): string {
  return `health-exception:${sourceKey.replace(/^operating_health:/, '')}`;
}

function metricSummary(item: OperatingHealthItem): string {
  return item.metrics
    .map((metric) => {
      const current = `${metric.value.toLocaleString()} ${metric.unit}`;
      const limit = metric.limit === null ? 'no verified limit' : `${metric.limit.toLocaleString()} ${metric.unit} limit`;
      return `${metric.label}: ${current} (${limit}; ${metric.state})`;
    })
    .join('; ');
}

function activeRow(
  item: OperatingHealthItem,
  now: string,
  version: number,
  existing?: ExistingHealthException,
  reopen = false,
): HealthExceptionQueueRow {
  const severity = severityFor(item);
  const id = queueId(item.key);
  const taskTitle = `Restore ${item.label}`;
  const description = [
    `Sage detected a ${item.state} operating-health receipt from ${item.provider}.`,
    item.summary,
    metricSummary(item),
    `Source: ${item.key}. Observed: ${item.observedAt}. Receipt expires: ${item.expiresAt}.`,
    'Investigate the cause, record the correction, and verify that a later receipt returns healthy before closing the work.',
  ].join('\n\n');
  const reset = !existing || reopen;

  return {
    id,
    source: 'operating_health',
    title: `${item.label} needs attention`,
    detail: item.summary,
    severity,
    status: reset ? 'open' : existing.status,
    verdict_note: reset ? null : existing.verdict_note,
    decided_at: reset ? null : existing.decided_at,
    decided_by: reset ? null : existing.decided_by,
    snooze_until: reset ? null : existing.snooze_until,
    synced_to_ledger: false,
    first_seen: existing?.first_seen ?? now,
    last_seen: now,
    contract_version: version,
    action_key: 'internal.create_task',
    idempotency_key: `${id}:internal.create_task:v${version}`,
    recommended_action: `Create a tracked internal task to restore ${item.label} and verify a healthy receipt.`,
    expected_outcome: `A correction task exists with the current ${item.state} evidence and an explicit healthy-receipt verification gate.`,
    risk_level: 'low',
    side_effect_class: 'internal_write',
    approval_required: true,
    executor: 'hq-action-registry',
    execution_payload: {
      title: taskTitle.slice(0, 200),
      description: description.slice(0, 4_000),
      priority: severity === 'critical' ? 'high' : 'medium',
    },
    rollback_plan: 'Archive or close the generated internal task; no external system is changed by this action.',
    execution_state: reset ? 'ready' : existing.execution_state,
    execution_requested_at: reset ? null : existing.execution_requested_at,
    execution_started_at: reset ? null : existing.execution_started_at,
    execution_finished_at: reset ? null : existing.execution_finished_at,
    last_execution_error: reset ? null : existing.last_execution_error,
    updated_at: now,
  };
}

function recoveredRow(
  item: OperatingHealthItem,
  existing: ExistingHealthException,
  now: string,
): HealthExceptionQueueRow {
  const priorDecision = existing.status === 'dismissed' && existing.decided_by
    ? ` Previous dismissal by ${existing.decided_by} was retained in the audit history.`
    : '';
  return {
    ...existing,
    detail: `${item.summary} A fresh healthy receipt was observed at ${item.observedAt}.`,
    status: 'resolved',
    verdict_note: `Resolved automatically after a fresh healthy operating-health receipt.${priorDecision}`,
    decided_at: now,
    decided_by: 'system:health-reconciler',
    snooze_until: null,
    synced_to_ledger: false,
    last_seen: now,
    execution_state:
      existing.execution_state === 'succeeded'
        ? 'succeeded'
        : existing.execution_state === 'running'
          ? 'running'
          : 'cancelled',
    updated_at: now,
  };
}

export function parseExistingHealthExceptions(data: unknown): ExistingHealthException[] {
  return z.array(existingHealthExceptionSchema).parse(data);
}

export function parseOperatingHealthSources(data: unknown): OperatingHealthSourceRow[] {
  return z.array(operatingHealthSourceSchema).parse(data);
}

export function planHealthExceptionSync(
  sources: OperatingHealthSourceRow[],
  existingRows: ExistingHealthException[],
  now = new Date().toISOString(),
): HealthExceptionSyncPlan {
  const items = extractOperatingHealthItems(sources, now);
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const rows: HealthExceptionQueueRow[] = [];
  let created = 0;
  let updated = 0;
  let reopened = 0;
  let resolved = 0;
  let active = 0;

  for (const item of items) {
    const id = queueId(item.key);
    const existing = existingById.get(id);
    if (item.state === 'healthy') {
      if (
        existing
        && existing.status !== 'resolved'
        && existing.execution_state !== 'running'
      ) {
        rows.push(recoveredRow(item, existing, now));
        resolved += 1;
      }
      continue;
    }

    active += 1;
    if (!existing) {
      rows.push(activeRow(item, now, 1));
      created += 1;
      continue;
    }

    const severityEscalated =
      (SEVERITY_RANK[severityFor(item)] ?? 0) > (SEVERITY_RANK[existing.severity.toLowerCase()] ?? 0);
    const shouldReopen = existing.status === 'resolved' || severityEscalated;
    const version = shouldReopen ? existing.contract_version + 1 : existing.contract_version;
    rows.push(activeRow(item, now, version, existing, shouldReopen));
    if (shouldReopen) reopened += 1;
    else updated += 1;
  }

  return { rows, active, created, updated, reopened, resolved };
}
