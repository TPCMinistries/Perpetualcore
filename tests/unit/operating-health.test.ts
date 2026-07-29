import { describe, expect, it } from 'vitest';
import {
  buildOperatingHealthFreshnessRow,
  extractOperatingHealthItems,
  summarizeOperatingHealth,
  type OperatingHealthReceipt,
} from '@/lib/hq/operating-health';
import { POST as receiptRoute } from '@/app/api/internal/operating-health/route';

const NOW = '2026-07-29T22:00:00.000Z';

function receipt(overrides: Partial<OperatingHealthReceipt> = {}): OperatingHealthReceipt {
  return {
    schemaVersion: 1,
    sourceKey: 'upstash.commands',
    displayName: 'Upstash command budget',
    provider: 'upstash',
    observedAt: NOW,
    ttlMinutes: 1_440,
    collectorStatus: 'healthy',
    summary: 'Bounded aggregate usage only.',
    metrics: [{
      key: 'monthly_commands',
      label: 'Monthly commands',
      value: 450_000,
      limit: 500_000,
      unit: 'commands',
      warningAt: 0.8,
      criticalAt: 1,
    }],
    evidence: [{ kind: 'billing', ref: 'upstash:2026-07', label: 'Monthly quota receipt' }],
    ...overrides,
  };
}

describe('operating health receipts', () => {
  it('rejects an unauthenticated receipt before any database work', async () => {
    const previousSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-cron-secret';
    try {
      const response = await receiptRoute(new Request('https://example.com/api/internal/operating-health', {
        method: 'POST',
        body: JSON.stringify(receipt()),
      }));
      expect(response.status).toBe(401);
    } finally {
      if (previousSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previousSecret;
    }
  });

  it('evaluates bounded usage and stores only aggregate operating metadata', () => {
    const row = buildOperatingHealthFreshnessRow(receipt());
    expect(row.source_key).toBe('operating_health:upstash.commands');
    expect(row.status).toBe('fresh');
    expect(row.metadata.healthState).toBe('warning');
    expect(row.metadata.metrics[0]).toMatchObject({ ratio: 0.9, state: 'warning' });
    expect(row.metadata.dataBoundary).toBe('aggregate-operating-health');
  });

  it('keeps a bounded correction history of thirty observations', () => {
    let metadata: Record<string, unknown> | null = null;
    for (let index = 0; index < 35; index += 1) {
      const row = buildOperatingHealthFreshnessRow(receipt({
        observedAt: new Date(Date.parse(NOW) + index * 60_000).toISOString(),
      }), metadata);
      metadata = row.metadata;
    }
    const history = (metadata as { history: unknown[] }).history;
    expect(history).toHaveLength(30);
  });

  it('marks an expired receipt as warning even when its last metric was healthy', () => {
    const row = buildOperatingHealthFreshnessRow(receipt({
      metrics: [{
        key: 'monthly_commands',
        label: 'Monthly commands',
        value: 10,
        limit: 500_000,
        unit: 'commands',
        warningAt: 0.8,
        criticalAt: 1,
      }],
    }));
    const items = extractOperatingHealthItems([row], '2026-08-01T23:00:00.000Z');
    expect(items[0]).toMatchObject({ freshness: 'stale', state: 'warning' });
  });

  it('shares only bounded status counts with the Company Graph', () => {
    const critical = buildOperatingHealthFreshnessRow(receipt({
      metrics: [{
        key: 'monthly_commands',
        label: 'Monthly commands',
        value: 500_000,
        limit: 500_000,
        unit: 'commands',
        warningAt: 0.8,
        criticalAt: 1,
      }],
    }));
    const healthy = buildOperatingHealthFreshnessRow(receipt({
      sourceKey: 'vercel.builds',
      displayName: 'Vercel build reliability',
      metrics: [{
        key: 'failed_builds',
        label: 'Failed builds',
        value: 0,
        limit: 1,
        unit: 'builds',
        warningAt: 0.5,
        criticalAt: 1,
      }],
    }));
    expect(summarizeOperatingHealth([critical, healthy], NOW)).toEqual({
      status: 'critical',
      sourceCount: 2,
      healthy: 1,
      warning: 0,
      critical: 1,
      unknown: 0,
      stale: 0,
    });
  });
});
