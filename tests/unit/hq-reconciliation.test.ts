import { describe, expect, it, vi } from 'vitest';
import { buildFreshnessObservations, parseReconciliationQueueRows, reconcileHq } from '@/lib/hq/reconciliation';
import { GET as reconcileRoute } from '@/app/api/cron/hq-reconcile/route';

const NOW = '2026-07-15T16:00:00.000Z';

describe('HQ cloud reconciliation', () => {
  it('accepts Supabase timestamptz values with an explicit UTC offset', () => {
    const rows = parseReconciliationQueueRows([
      { id: 'q1', source: 'hq', status: 'open', last_seen: '2026-07-15T09:12:56.587+00:00' },
    ]);
    expect(rows[0].last_seen).toBe('2026-07-15T09:12:56.587+00:00');
  });

  it('rejects a cron request without the shared secret', async () => {
    const previousSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-cron-secret';
    try {
      const response = await reconcileRoute(new Request('https://example.com/api/cron/hq-reconcile'));
      expect(response.status).toBe(401);
    } finally {
      if (previousSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previousSecret;
    }
  });

  it('does not claim source-level freshness from one containing snapshot timestamp', () => {
    const sources = buildFreshnessObservations({
      updated_at: '2026-07-15T15:55:00.000Z',
      data: { generated_at: '2026-07-15T15:55:00.000Z', strategist_memo_md: '# Memo' },
    }, NOW);
    expect(sources.find((s) => s.sourceKey === 'hq_local_snapshot')?.status).toBe('fresh');
    const memo = sources.find((s) => s.sourceKey === 'strategist_memo');
    expect(memo?.status).toBe('unknown');
    expect(memo?.metadata.presentInLastSnapshot).toBe(true);
    expect(memo?.sourceGeneratedAt).toBeNull();
  });

  it('marks the local publisher stale after its TTL', () => {
    const sources = buildFreshnessObservations({
      data: { generated_at: '2026-07-13T12:00:00.000Z' },
    }, NOW);
    expect(sources[0].status).toBe('stale');
  });

  it('honors producer-published source timestamps and detects their expiry', () => {
    const sources = buildFreshnessObservations({
      data: {
        generated_at: '2026-07-15T15:00:00.000Z',
        pnl_md: '# P&L',
        strategist_memo_md: '# Memo',
        source_freshness: {
          portfolio_pnl: { generated_at: '2026-07-15T15:30:00.000Z', ttl_minutes: 120 },
          strategist_memo: { generated_at: '2026-07-13T12:00:00.000Z', ttl_minutes: 60 },
        },
      },
    }, NOW);
    expect(sources.find((s) => s.sourceKey === 'portfolio_pnl')?.status).toBe('fresh');
    expect(sources.find((s) => s.sourceKey === 'strategist_memo')?.status).toBe('stale');
  });

  it('reopens lapsed snoozes, rolls up cloud state, and persists health plus heartbeat', async () => {
    const store = {
      readSnapshot: vi.fn().mockResolvedValue({ data: { generated_at: '2026-07-15T15:00:00.000Z' } }),
      reopenExpiredSnoozes: vi.fn().mockResolvedValue(2),
      readQueue: vi.fn().mockResolvedValue([
        { id: 'q1', source: 'strategist', status: 'open', last_seen: NOW },
        { id: 'q2', source: 'compliance', status: 'approved', last_seen: NOW, execution_state: 'ready' },
      ]),
      readActionRuns: vi.fn().mockResolvedValue([
        { id: 'r1', status: 'succeeded', created_at: NOW, finished_at: NOW },
      ]),
      upsertFreshness: vi.fn().mockResolvedValue(undefined),
      writeHeartbeat: vi.fn().mockResolvedValue(undefined),
    };
    const result = await reconcileHq(store, NOW);
    expect(result.reopenedSnoozes).toBe(2);
    expect(result.queue).toEqual({ open: 1, approved: 1 });
    expect(result.actionRuns).toEqual({ succeeded: 1 });
    expect(store.upsertFreshness).toHaveBeenCalledOnce();
    expect(store.writeHeartbeat).toHaveBeenCalledOnce();
  });

  it('dispatches only approved low-risk ready internal actions and caps the batch at ten', async () => {
    const eligible = Array.from({ length: 12 }, (_, index) => ({
      id: `eligible-${index}`,
      source: 'strategist',
      status: 'approved',
      last_seen: NOW,
      execution_state: 'ready',
      action_key: 'internal.create_task',
      risk_level: 'low' as const,
      side_effect_class: 'internal_write' as const,
    }));
    const store = {
      readSnapshot: vi.fn().mockResolvedValue({ data: { generated_at: '2026-07-15T15:00:00.000Z' } }),
      reopenExpiredSnoozes: vi.fn().mockResolvedValue(0),
      readQueue: vi.fn().mockResolvedValue([
        ...eligible,
        { id: 'medium', source: 'hq', status: 'approved', last_seen: NOW, execution_state: 'ready', action_key: 'x', risk_level: 'medium', side_effect_class: 'internal_write' },
        { id: 'unapproved', source: 'hq', status: 'open', last_seen: NOW, execution_state: 'ready', action_key: 'x', risk_level: 'low', side_effect_class: 'internal_write' },
        { id: 'outbound', source: 'hq', status: 'approved', last_seen: NOW, execution_state: 'ready', action_key: 'x', risk_level: 'low', side_effect_class: 'outbound' },
      ]),
      readActionRuns: vi.fn().mockResolvedValue([]),
      upsertFreshness: vi.fn().mockResolvedValue(undefined),
      writeHeartbeat: vi.fn().mockResolvedValue(undefined),
    };
    const dispatchApprovedAction = vi.fn().mockResolvedValue({ ok: true, duplicate: false, message: 'done' });
    const result = await reconcileHq(store, NOW, {
      requestedBy: 'owner@perpetualcore.com',
      dispatchApprovedAction,
    });
    expect(dispatchApprovedAction).toHaveBeenCalledTimes(10);
    expect(result.dispatch).toEqual({ eligible: 10, attempted: 10, succeeded: 10, failed: 0, duplicate: 0 });
    expect(dispatchApprovedAction).not.toHaveBeenCalledWith(expect.objectContaining({ queueItemId: 'medium' }));
    expect(dispatchApprovedAction).not.toHaveBeenCalledWith(expect.objectContaining({ queueItemId: 'unapproved' }));
    expect(dispatchApprovedAction).not.toHaveBeenCalledWith(expect.objectContaining({ queueItemId: 'outbound' }));
  });

  it('leaves eligible actions untouched when no validated cloud actor is configured', async () => {
    const store = {
      readSnapshot: vi.fn().mockResolvedValue(null),
      reopenExpiredSnoozes: vi.fn().mockResolvedValue(0),
      readQueue: vi.fn().mockResolvedValue([{ id: 'q1', source: 'hq', status: 'approved', last_seen: NOW, execution_state: 'ready', action_key: 'x', risk_level: 'low', side_effect_class: 'read_only' }]),
      readActionRuns: vi.fn().mockResolvedValue([]),
      upsertFreshness: vi.fn().mockResolvedValue(undefined),
      writeHeartbeat: vi.fn().mockResolvedValue(undefined),
    };
    const dispatchApprovedAction = vi.fn();
    const result = await reconcileHq(store, NOW, { requestedBy: null, dispatchApprovedAction });
    expect(dispatchApprovedAction).not.toHaveBeenCalled();
    expect(result.dispatch.attempted).toBe(0);
    expect(result.warnings.join(' ')).toContain('execution actor');
  });
});
