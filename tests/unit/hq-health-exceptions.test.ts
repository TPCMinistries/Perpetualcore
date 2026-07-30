import { describe, expect, it } from 'vitest';
import { getHqActionDefinition } from '@/lib/hq/execution/registry';
import {
  planHealthExceptionSync,
  type ExistingHealthException,
} from '@/lib/hq/health-exceptions';
import {
  buildOperatingHealthFreshnessRow,
  type OperatingHealthReceipt,
} from '@/lib/hq/operating-health';

const NOW = '2026-07-30T12:00:00.000Z';

function receipt(
  state: 'healthy' | 'warning' | 'critical',
  overrides: Partial<OperatingHealthReceipt> = {},
) {
  const values = { healthy: 10, warning: 85, critical: 100 };
  return buildOperatingHealthFreshnessRow({
    schemaVersion: 1,
    sourceKey: 'upstash.commands',
    displayName: 'Upstash command budget',
    provider: 'upstash',
    observedAt: NOW,
    ttlMinutes: 1_440,
    collectorStatus: 'healthy',
    summary: 'Bounded aggregate command usage.',
    metrics: [{
      key: 'monthly_commands',
      label: 'Monthly commands',
      value: values[state],
      limit: 100,
      unit: 'commands',
      warningAt: 0.8,
      criticalAt: 1,
    }],
    evidence: [],
    ...overrides,
  });
}

function existing(overrides: Partial<ExistingHealthException> = {}): ExistingHealthException {
  return {
    id: 'health-exception:upstash.commands',
    source: 'operating_health',
    title: 'Upstash command budget needs attention',
    detail: 'Bounded aggregate command usage.',
    severity: 'warning',
    status: 'open',
    verdict_note: null,
    decided_at: null,
    decided_by: null,
    snooze_until: null,
    synced_to_ledger: false,
    first_seen: '2026-07-30T10:00:00.000Z',
    last_seen: '2026-07-30T11:00:00.000Z',
    contract_version: 1,
    action_key: 'internal.create_task',
    idempotency_key: 'health-exception:upstash.commands:internal.create_task:v1',
    recommended_action: 'Create a tracked task.',
    expected_outcome: 'A correction task exists.',
    risk_level: 'low',
    side_effect_class: 'internal_write',
    approval_required: true,
    executor: 'hq-action-registry',
    execution_payload: { title: 'Restore Upstash command budget', priority: 'medium' },
    rollback_plan: 'Archive the task.',
    execution_state: 'ready',
    execution_requested_at: null,
    execution_started_at: null,
    execution_finished_at: null,
    last_execution_error: null,
    ...overrides,
  };
}

describe('HQ operating-health exception planning', () => {
  it('turns a critical receipt into one executable, owner-gated internal task recommendation', () => {
    const plan = planHealthExceptionSync([receipt('critical')], [], NOW);
    expect(plan).toMatchObject({ active: 1, created: 1, reopened: 0, resolved: 0 });
    expect(plan.rows).toHaveLength(1);
    const row = plan.rows[0];
    expect(row).toMatchObject({
      id: 'health-exception:upstash.commands',
      source: 'operating_health',
      severity: 'critical',
      status: 'open',
      action_key: 'internal.create_task',
      risk_level: 'low',
      side_effect_class: 'internal_write',
      approval_required: true,
      execution_state: 'ready',
      contract_version: 1,
    });
    expect(getHqActionDefinition(row.action_key ?? '')?.schema.safeParse(row.execution_payload).success).toBe(true);
  });

  it('updates one stable exception without overriding an owner dismissal', () => {
    const plan = planHealthExceptionSync(
      [receipt('warning')],
      [existing({ status: 'dismissed', decided_by: 'owner@example.com', decided_at: NOW })],
      NOW,
    );
    expect(plan).toMatchObject({ active: 1, created: 0, updated: 1, reopened: 0 });
    expect(plan.rows[0]).toMatchObject({
      status: 'dismissed',
      decided_by: 'owner@example.com',
      contract_version: 1,
    });
  });

  it('reopens a dismissed exception when its severity escalates', () => {
    const plan = planHealthExceptionSync(
      [receipt('critical')],
      [existing({ status: 'dismissed', decided_by: 'owner@example.com', decided_at: NOW })],
      NOW,
    );
    expect(plan).toMatchObject({ active: 1, reopened: 1 });
    expect(plan.rows[0]).toMatchObject({
      status: 'open',
      severity: 'critical',
      contract_version: 2,
      decided_by: null,
      execution_state: 'ready',
    });
  });

  it('resolves an open exception only after a fresh healthy receipt', () => {
    const plan = planHealthExceptionSync([receipt('healthy')], [existing()], NOW);
    expect(plan).toMatchObject({ active: 0, resolved: 1 });
    expect(plan.rows[0]).toMatchObject({
      status: 'resolved',
      decided_by: 'system:health-reconciler',
      execution_state: 'cancelled',
    });
  });

  it('closes a dismissed incident after recovery so a later regression can reopen it', () => {
    const dismissed = existing({
      status: 'dismissed',
      severity: 'critical',
      decided_by: 'owner@example.com',
      decided_at: NOW,
    });
    const recovered = planHealthExceptionSync([receipt('healthy')], [dismissed], NOW);
    expect(recovered.rows[0]).toMatchObject({ status: 'resolved', contract_version: 1 });
    expect(recovered.rows[0].verdict_note).toContain('Previous dismissal by owner@example.com');

    const regressed = planHealthExceptionSync(
      [receipt('critical')],
      [recovered.rows[0]],
      '2026-07-31T12:00:00.000Z',
    );
    expect(regressed).toMatchObject({ active: 1, reopened: 1 });
    expect(regressed.rows[0]).toMatchObject({ status: 'open', contract_version: 2 });
  });

  it('does not create noise for a healthy source with no prior exception', () => {
    const plan = planHealthExceptionSync([receipt('healthy')], [], NOW);
    expect(plan.rows).toEqual([]);
    expect(plan).toMatchObject({ active: 0, created: 0, resolved: 0 });
  });
});
