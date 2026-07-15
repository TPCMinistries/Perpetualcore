import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { executeHqQueueAction } from '@/lib/hq/execution';

const HOUR_MS = 60 * 60 * 1000;
const LOCAL_SOURCE_TTL_MS = 26 * HOUR_MS;

const snapshotSchema = z.object({
  updated_at: z.string().datetime().nullable().optional(),
  data: z.record(z.string(), z.unknown()),
});

const queueRowSchema = z.object({
  id: z.string(),
  source: z.string(),
  status: z.string(),
  last_seen: z.string().datetime().nullable(),
  execution_state: z.string().nullable().optional(),
  action_key: z.string().nullable().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'prohibited']).nullable().optional(),
  side_effect_class: z.enum(['read_only', 'internal_write', 'external_write', 'money', 'outbound']).nullable().optional(),
});

const actionRunSchema = z.object({
  id: z.string(),
  status: z.string(),
  created_at: z.string().datetime(),
  finished_at: z.string().datetime().nullable().optional(),
});

const publishedFreshnessSchema = z.record(z.string(), z.object({
  generated_at: z.string().datetime(),
  ttl_minutes: z.number().int().positive().max(43_200).optional(),
  error: z.string().trim().min(1).max(2_000).nullable().optional(),
}));

export type FreshnessStatus = 'unknown' | 'fresh' | 'stale' | 'error';

export interface FreshnessObservation {
  sourceKey: string;
  displayName: string;
  status: FreshnessStatus;
  observedAt: string;
  sourceGeneratedAt: string | null;
  expiresAt: string | null;
  lastSuccessAt: string | null;
  errorMessage: string | null;
  contentHash: string | null;
  metadata: Record<string, unknown>;
}

export interface ReconciliationResult {
  ok: boolean;
  heartbeatAt: string;
  overallStatus: 'healthy' | 'degraded';
  reopenedSnoozes: number;
  queue: Record<string, number>;
  actionRuns: Record<string, number>;
  dispatch: { eligible: number; attempted: number; succeeded: number; failed: number; duplicate: number };
  sources: FreshnessObservation[];
  warnings: string[];
}

interface HqSnapshotRow {
  updated_at?: string | null;
  data: Record<string, unknown>;
}

interface ReconciliationStore {
  readSnapshot(): Promise<HqSnapshotRow | null>;
  reopenExpiredSnoozes(now: string): Promise<number>;
  readQueue(): Promise<z.infer<typeof queueRowSchema>[]>;
  readActionRuns(): Promise<z.infer<typeof actionRunSchema>[]>;
  upsertFreshness(observations: FreshnessObservation[]): Promise<void>;
  writeHeartbeat(result: ReconciliationResult): Promise<void>;
}

type DispatchApprovedAction = (input: {
  queueItemId: string;
  requestedBy: string;
  dryRun: false;
}) => Promise<{ ok: boolean; duplicate: boolean; message: string }>;

const LOCAL_FIELDS = [
  ['portfolio_pnl', 'Portfolio P&L', 'pnl_md'],
  ['strategist_memo', 'Strategist memo', 'strategist_memo_md'],
  ['decision_ledger', 'Decision ledger', 'decision_ledger_tail'],
  ['compliance_watch', 'Compliance watch', 'compliance'],
  ['revenue_probes', 'Revenue probes', 'probes'],
  ['content_calendar', 'Content calendar', 'content_calendar_md'],
  ['moments', 'Moments feed', 'moments_tail'],
  ['manual_revenue', 'Manual revenue ledger', 'revenue_2026'],
] as const;

function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function countBy(rows: Array<{ status: string }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function buildFreshnessObservations(
  snapshot: HqSnapshotRow | null,
  now: string,
): FreshnessObservation[] {
  const nowMs = Date.parse(now);
  const generatedAt = isoOrNull(snapshot?.data.generated_at) ?? isoOrNull(snapshot?.updated_at);
  const expiresAt = generatedAt ? new Date(Date.parse(generatedAt) + LOCAL_SOURCE_TTL_MS).toISOString() : null;

  const snapshotStatus: FreshnessStatus = !generatedAt
    ? 'unknown'
    : Date.parse(generatedAt) + LOCAL_SOURCE_TTL_MS <= nowMs
      ? 'stale'
      : 'fresh';

  const observations: FreshnessObservation[] = [{
    sourceKey: 'hq_local_snapshot',
    displayName: 'Local HQ snapshot publisher',
    status: snapshotStatus,
    observedAt: now,
    sourceGeneratedAt: generatedAt,
    expiresAt,
    lastSuccessAt: generatedAt,
    errorMessage: null,
    contentHash: snapshot ? hash(snapshot.data) : null,
    metadata: {
      runtime: 'local',
      cloudReadable: false,
      note: 'Vercel can observe the last published snapshot but cannot read the local vault.',
    },
  }];

  for (const [sourceKey, displayName, field] of LOCAL_FIELDS) {
    const value = snapshot?.data[field];
    const present = value !== null && value !== undefined;
    const publishedMap = publishedFreshnessSchema.safeParse(snapshot?.data.source_freshness);
    const published = publishedMap.success ? publishedMap.data[sourceKey] : undefined;
    const publishedAt = isoOrNull(published?.generated_at);
    const sourceExpiresAt = publishedAt
      ? new Date(Date.parse(publishedAt) + (published?.ttl_minutes ?? 24 * 60) * 60_000).toISOString()
      : null;
    const status: FreshnessStatus = published?.error
      ? 'error'
      : !publishedAt
        ? 'unknown'
        : sourceExpiresAt && Date.parse(sourceExpiresAt) <= nowMs
          ? 'stale'
          : 'fresh';
    observations.push({
      sourceKey,
      displayName,
      // A containing snapshot timestamp is not source-level proof. Until local
      // publishers include their own timestamp, report unknown rather than lie.
      status,
      observedAt: now,
      sourceGeneratedAt: publishedAt,
      expiresAt: sourceExpiresAt,
      lastSuccessAt: published?.error ? null : publishedAt,
      errorMessage: published?.error ?? null,
      contentHash: present ? hash(value) : null,
      metadata: {
        runtime: 'local',
        cloudReadable: false,
        presentInLastSnapshot: present,
        containingSnapshotGeneratedAt: generatedAt,
        note: publishedAt
          ? 'Producer-published source timestamp.'
          : present
            ? 'Present, but the producer did not publish a source-level timestamp.'
            : 'Not present in the last published HQ snapshot.',
      },
    });
  }
  return observations;
}

function cloudObservation(
  sourceKey: string,
  displayName: string,
  now: string,
  metadata: Record<string, unknown>,
): FreshnessObservation {
  return {
    sourceKey,
    displayName,
    status: 'fresh',
    observedAt: now,
    sourceGeneratedAt: now,
    expiresAt: new Date(Date.parse(now) + HOUR_MS).toISOString(),
    lastSuccessAt: now,
    errorMessage: null,
    contentHash: hash(metadata),
    metadata: { runtime: 'cloud', cloudReadable: true, ...metadata },
  };
}

export async function reconcileHq(
  store: ReconciliationStore,
  now = new Date().toISOString(),
  options: { requestedBy?: string | null; dispatchApprovedAction?: DispatchApprovedAction } = {},
): Promise<ReconciliationResult> {
  const warnings: string[] = [];
  const reopenedSnoozes = await store.reopenExpiredSnoozes(now);
  const [snapshot, queueRows, actionRuns] = await Promise.all([
    store.readSnapshot(),
    store.readQueue(),
    store.readActionRuns(),
  ]);
  const queue = countBy(queueRows);
  let actionRunCounts = countBy(actionRuns);
  const eligible = queueRows
    .filter((row) =>
      row.status === 'approved'
      && row.execution_state === 'ready'
      && row.risk_level === 'low'
      && (row.side_effect_class === 'read_only' || row.side_effect_class === 'internal_write')
      && Boolean(row.action_key))
    .slice(0, 10);
  const dispatch = { eligible: eligible.length, attempted: 0, succeeded: 0, failed: 0, duplicate: 0 };
  const actor = z.string().email().safeParse(options.requestedBy);
  if (eligible.length > 0 && (!actor.success || !options.dispatchApprovedAction)) {
    warnings.push('Approved low-risk actions are waiting, but the cloud execution actor or registry is unavailable.');
  } else if (actor.success && options.dispatchApprovedAction) {
    for (const row of eligible) {
      dispatch.attempted += 1;
      try {
        const executed = await options.dispatchApprovedAction({
          queueItemId: row.id,
          requestedBy: actor.data,
          dryRun: false,
        });
        if (executed.duplicate) dispatch.duplicate += 1;
        if (executed.ok) dispatch.succeeded += 1;
        else {
          dispatch.failed += 1;
          warnings.push(`Action ${row.id} did not complete: ${executed.message}`);
        }
      } catch (error: unknown) {
        dispatch.failed += 1;
        const message = error instanceof Error ? error.message : 'unknown dispatch error';
        warnings.push(`Action ${row.id} was left for review: ${message}`);
      }
    }
    if (dispatch.attempted > 0) {
      actionRunCounts = countBy(await store.readActionRuns());
    }
  }
  const sources = [
    ...buildFreshnessObservations(snapshot, now),
    cloudObservation('hq_queue', 'HQ decision and action queue', now, {
      rowCount: queueRows.length,
      statusCounts: queue,
      reopenedSnoozes,
    }),
    cloudObservation('hq_action_runs', 'HQ action run history', now, {
      rowCount: actionRuns.length,
      statusCounts: actionRunCounts,
    }),
    cloudObservation('hq_cloud_reconciler', 'HQ cloud reconciler', now, { cadenceMinutes: 30 }),
  ];

  const localSnapshot = sources.find((source) => source.sourceKey === 'hq_local_snapshot');
  if (localSnapshot?.status !== 'fresh') {
    warnings.push('The local HQ publisher is stale or has never published; cloud reconciliation cannot read local vault files.');
  }
  if ((actionRunCounts.failed ?? 0) > 0 || (actionRunCounts.blocked ?? 0) > 0) {
    warnings.push('One or more action runs need attention.');
  }

  const result: ReconciliationResult = {
    ok: true,
    heartbeatAt: now,
    overallStatus: warnings.length === 0 ? 'healthy' : 'degraded',
    reopenedSnoozes,
    queue,
    actionRuns: actionRunCounts,
    dispatch,
    sources,
    warnings,
  };
  await store.upsertFreshness(sources);
  await store.writeHeartbeat(result);
  return result;
}

function createSupabaseStore(): ReconciliationStore {
  // The migration is intentionally not reflected in generated types until it
  // is applied. Keep the service-role client but erase the stale table union.
  const admin = createAdminClient() as unknown as SupabaseClient;
  return {
    async readSnapshot() {
      const { data, error } = await admin.from('deck_snapshots').select('data, updated_at').eq('kind', 'hq').maybeSingle();
      if (error) throw new Error(`hq snapshot read failed: ${error.message}`);
      if (!data) return null;
      return snapshotSchema.parse(data);
    },
    async reopenExpiredSnoozes(now) {
      const { data, error } = await admin
        .from('hq_queue')
        .update({ status: 'open', snooze_until: null, updated_at: now })
        .eq('status', 'snoozed')
        .lt('snooze_until', now)
        .select('id');
      if (error) throw new Error(`lapsed snooze reconciliation failed: ${error.message}`);
      return data?.length ?? 0;
    },
    async readQueue() {
      const { data, error } = await admin
        .from('hq_queue')
        .select('id, source, status, last_seen, execution_state, action_key, risk_level, side_effect_class')
        .limit(500);
      if (error) throw new Error(`HQ queue read failed: ${error.message}`);
      return z.array(queueRowSchema).parse(data ?? []);
    },
    async readActionRuns() {
      const { data, error } = await admin
        .from('hq_action_runs')
        .select('id, status, created_at, finished_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw new Error(`HQ action-run read failed: ${error.message}`);
      return z.array(actionRunSchema).parse(data ?? []);
    },
    async upsertFreshness(observations) {
      const rows = observations.map((source) => ({
        source_key: source.sourceKey,
        display_name: source.displayName,
        status: source.status,
        observed_at: source.observedAt,
        source_generated_at: source.sourceGeneratedAt,
        expires_at: source.expiresAt,
        last_success_at: source.lastSuccessAt,
        last_error_at: source.status === 'error' ? source.observedAt : null,
        error_message: source.errorMessage,
        content_hash: source.contentHash,
        metadata: source.metadata,
        updated_at: source.observedAt,
      }));
      const { error } = await admin.from('hq_source_freshness').upsert(rows, { onConflict: 'source_key' });
      if (error) throw new Error(`HQ freshness write failed: ${error.message}`);
    },
    async writeHeartbeat(result) {
      const { error } = await admin.from('deck_snapshots').upsert({
        kind: 'hq_cloud_status',
        data: result,
        updated_at: result.heartbeatAt,
      }, { onConflict: 'kind' });
      if (error) throw new Error(`HQ heartbeat write failed: ${error.message}`);
    },
  };
}

export async function runCloudHqReconciliation(now?: string): Promise<ReconciliationResult> {
  const ownerEmail = process.env.HQ_CRON_ACTOR_EMAIL
    ?? process.env.HQ_OWNER_EMAILS?.split(',').map((email) => email.trim()).find(Boolean)
    ?? null;
  const executionEnabled = process.env.HQ_CRON_EXECUTION_ENABLED === 'true';
  return reconcileHq(createSupabaseStore(), now, {
    requestedBy: ownerEmail,
    // Reconciliation is observe-only after first deployment. Cloud execution
    // requires a separate, explicit environment opt-in after writes are verified.
    dispatchApprovedAction: executionEnabled ? executeHqQueueAction : undefined,
  });
}
