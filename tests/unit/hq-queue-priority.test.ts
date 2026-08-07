import { describe, expect, it } from 'vitest';
import { partitionQueueItems, type QueueItem } from '@/lib/hq/queue';
import { canonicalQueueIdentity, queueId } from '@/lib/ops/queue-sync';

function item(overrides: Partial<QueueItem>): QueueItem {
  return {
    id: 'item',
    source: 'handoff',
    title: 'Background task',
    detail: null,
    severity: 'info',
    status: 'open',
    verdictNote: null,
    decidedAt: null,
    decidedBy: null,
    snoozeUntil: null,
    syncedToLedger: false,
    firstSeen: '2026-07-29T00:00:00.000Z',
    lastSeen: '2026-07-29T00:00:00.000Z',
    actionKey: 'internal.create_task',
    recommendedAction: null,
    expectedOutcome: null,
    riskLevel: 'low',
    sideEffectClass: 'internal_write',
    approvalRequired: true,
    executor: 'hq-registry',
    executionPayload: {},
    rollbackPlan: null,
    executionState: 'ready',
    lastExecutionError: null,
    ...overrides,
  };
}

describe('HQ queue identity and priority', () => {
  it('uses one stable identity as compliance countdown wording changes', () => {
    const due = 'Rotate Mercury token — due 2026-07-20 (2d out)';
    const overdue = 'Rotate Mercury token — 10d overdue (was 2026-07-20)';
    expect(canonicalQueueIdentity('compliance', due)).toBe('rotate mercury token');
    expect(queueId('compliance', due)).toBe(queueId('compliance', overdue));
  });

  it('does not merge distinct compliance items', () => {
    expect(queueId('compliance', 'Rotate Mercury token — 1d overdue (was 2026-07-20)'))
      .not.toBe(queueId('compliance', 'Rotate Stripe token — 1d overdue (was 2026-07-20)'));
  });

  it('puts approved work, operating exceptions, and strategist decisions ahead of background items', () => {
    const items = [
      item({ id: 'background' }),
      item({ id: 'compliance', source: 'compliance', severity: 'critical' }),
      item({ id: 'strategist', source: 'strategist', severity: 'high' }),
      item({ id: 'health', source: 'operating_health', severity: 'critical' }),
      item({ id: 'approved', status: 'approved' }),
      item({ id: 'another-background' }),
    ];
    const result = partitionQueueItems(items, 5);
    expect(result.priority.map((entry) => entry.id)).toEqual([
      'approved',
      'health',
      'strategist',
      'compliance',
      'background',
    ]);
    expect(result.background.map((entry) => entry.id)).toEqual(['another-background']);
  });
});
