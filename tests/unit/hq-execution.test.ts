import { describe, expect, it } from 'vitest';
import { executeHqQueueAction, HqExecutionError } from '@/lib/hq/execution';
import type {
  BeginRunInput,
  HqActionRun,
  HqExecutionStore,
  HqQueueActionRow,
} from '@/lib/hq/execution/types';

function queue(overrides: Partial<HqQueueActionRow> = {}): HqQueueActionRow {
  return {
    id: 'strategist:task-1',
    status: 'approved',
    actionType: 'internal.create_task',
    actionPayload: { title: 'Call the qualified lead', priority: 'high' },
    idempotencyKey: 'strategist:task-1:internal.create_task',
    expectedOutcome: 'A tracked follow-up exists.',
    contractVersion: 1,
    riskLevel: 'low',
    approvalRequired: true,
    decidedBy: 'owner@example.com',
    decidedAt: '2026-07-15T12:00:00.000Z',
    ...overrides,
  };
}

class FakeStore implements HqExecutionStore {
  runs = new Map<string, HqActionRun>();
  statuses: string[] = [];
  tasksCreated = 0;
  events: string[] = [];
  beginCreated = true;
  constructor(public queueRow: HqQueueActionRow | null = queue()) {}

  async getQueueAction() {
    return this.queueRow;
  }
  async findRun(key: string) {
    return this.runs.get(key) ?? null;
  }
  async beginRun(input: BeginRunInput) {
    const run: HqActionRun = {
      id: `run-${this.runs.size + 1}`,
      queueItemId: input.queue.id,
      actionType: input.actionType,
      status: 'running',
      riskLevel: input.riskLevel,
      dryRun: input.dryRun,
      idempotencyKey: input.runIdempotencyKey,
      result: null,
      evidence: null,
      errorCode: null,
      errorMessage: null,
      retryable: false,
      startedAt: '2026-07-15T12:01:00.000Z',
      completedAt: null,
    };
    this.runs.set(input.runIdempotencyKey, run);
    return { run, created: this.beginCreated };
  }
  async beginBlockedRun(input: BeginRunInput, error: { code: string; message: string }) {
    const begun = await this.beginRun(input);
    const blocked = {
      ...begun.run,
      status: 'blocked' as const,
      errorCode: error.code,
      errorMessage: error.message,
      completedAt: '2026-07-15T12:01:00.000Z',
    };
    this.runs.set(input.runIdempotencyKey, blocked);
    return { run: blocked, created: begun.created };
  }
  async completeRun(
    id: string,
    status: 'succeeded' | 'failed' | 'blocked',
    values: { result?: unknown; evidence?: unknown; errorCode?: string; errorMessage?: string; retryable?: boolean },
  ) {
    const entry = [...this.runs.entries()].find(([, run]) => run.id === id);
    if (!entry) throw new Error('missing fake run');
    const [key, previous] = entry;
    const run: HqActionRun = {
      ...previous,
      status,
      result: values.result ?? null,
      evidence: values.evidence ?? null,
      errorCode: values.errorCode ?? null,
      errorMessage: values.errorMessage ?? null,
      retryable: values.retryable ?? false,
      completedAt: '2026-07-15T12:02:00.000Z',
    };
    this.runs.set(key, run);
    return run;
  }
  async setQueueExecutionStatus(_id: string, status: string) {
    this.statuses.push(status);
  }
  async appendRunEvent(input: Parameters<HqExecutionStore['appendRunEvent']>[0]) {
    this.events.push(input.eventType);
  }
  async createInternalTask() {
    this.tasksCreated += 1;
    return { id: 'task-123' };
  }
}

const actor = 'owner@example.com';

describe('HQ safe execution contract', () => {
  it('defaults to a durable dry run without creating the task', async () => {
    const store = new FakeStore();
    const result = await executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor }, store);

    expect(result.ok).toBe(true);
    expect(result.run.dryRun).toBe(true);
    expect(store.tasksCreated).toBe(0);
    expect(result.run.evidence).toEqual({ sideEffectPerformed: false });
    expect(store.events).toEqual(['execution_started', 'execution_succeeded']);
  });

  it('executes an approved low-risk action and records evidence', async () => {
    const store = new FakeStore();
    const result = await executeHqQueueAction(
      { queueItemId: 'strategist:task-1', requestedBy: actor, dryRun: false },
      store,
    );

    expect(result.ok).toBe(true);
    expect(store.tasksCreated).toBe(1);
    expect(result.run.result).toMatchObject({ taskId: 'task-123' });
    expect(store.statuses).toEqual(['running', 'succeeded']);
  });

  it('does not execute when a racing insert returns an existing running run', async () => {
    const store = new FakeStore();
    store.beginCreated = false;
    const result = await executeHqQueueAction(
      { queueItemId: 'strategist:task-1', requestedBy: actor, dryRun: false },
      store,
    );

    expect(result.duplicate).toBe(true);
    expect(result.run.status).toBe('running');
    expect(store.tasksCreated).toBe(0);
    expect(store.events).toEqual([]);
  });

  it('returns the prior run and never duplicates a side effect', async () => {
    const store = new FakeStore();
    const input = { queueItemId: 'strategist:task-1', requestedBy: actor, dryRun: false } as const;
    await executeHqQueueAction(input, store);
    const duplicate = await executeHqQueueAction(input, store);

    expect(duplicate.duplicate).toBe(true);
    expect(store.tasksCreated).toBe(1);
  });

  it('fails closed for unsupported action types', async () => {
    const store = new FakeStore(queue({ actionType: 'external.send_email' }));
    await expect(executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor }, store)).rejects.toMatchObject({
      code: 'UNSUPPORTED_ACTION',
    } satisfies Partial<HqExecutionError>);
    expect(store.tasksCreated).toBe(0);
    expect(store.events).toContain('execution_blocked');
  });

  it('rejects unapproved real execution while still allowing preview', async () => {
    const store = new FakeStore(queue({ status: 'open', decidedBy: null, decidedAt: null }));
    await expect(
      executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor, dryRun: false }, store),
    ).rejects.toMatchObject({ code: 'ACTION_NOT_APPROVED' } satisfies Partial<HqExecutionError>);

    const preview = await executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor }, store);
    expect(preview.ok).toBe(true);
    expect(store.tasksCreated).toBe(0);
  });

  it('strictly validates payloads and code-owned risk policy', async () => {
    const badPayload = new FakeStore(queue({ actionPayload: { title: '', unexpected: true } }));
    await expect(
      executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor }, badPayload),
    ).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' } satisfies Partial<HqExecutionError>);

    const understatedRisk = new FakeStore(queue({ riskLevel: 'medium' }));
    await expect(
      executeHqQueueAction({ queueItemId: 'strategist:task-1', requestedBy: actor }, understatedRisk),
    ).rejects.toMatchObject({ code: 'ACTION_NOT_CONFIGURED' } satisfies Partial<HqExecutionError>);
  });
});
