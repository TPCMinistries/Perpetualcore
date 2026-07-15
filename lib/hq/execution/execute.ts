import { z } from 'zod';
import { HqExecutionError, toFriendlyExecutionError } from './errors';
import { getHqActionDefinition } from './registry';
import { SupabaseHqExecutionStore } from './store';
import type {
  ExecuteHqQueueActionInput,
  ExecuteHqQueueActionResult,
  HqExecutionStore,
  HqQueueActionRow,
} from './types';

const requestSchema = z
  .object({
    queueItemId: z.string().trim().min(1).max(300),
    requestedBy: z.string().trim().email().max(320),
    dryRun: z.boolean().optional(),
  })
  .strict();

async function recordBlockedAttempt(
  store: HqExecutionStore,
  queue: HqQueueActionRow,
  requestedBy: string,
  dryRun: boolean,
  error: HqExecutionError,
): Promise<void> {
  if (!queue.actionType || !queue.idempotencyKey) return;
  const key = `${queue.idempotencyKey}:blocked:${error.code}`;
  if (await store.findRun(key)) return;
  const begun = await store.beginBlockedRun(
    {
      queue,
      actionType: queue.actionType,
      payload: queue.actionPayload,
      riskLevel: queue.riskLevel,
      dryRun,
      runIdempotencyKey: key,
      requestedBy,
    },
    { code: error.code, message: error.message },
  );
  if (!begun.created) return;
  await store.appendRunEvent({
    runId: begun.run.id,
    eventType: 'execution_blocked',
    fromStatus: null,
    toStatus: 'blocked',
    actorId: requestedBy,
    message: error.message,
    data: { errorCode: error.code, dryRun },
  });
}

/**
 * Cron-safe execution boundary. The caller still owns cron/owner authentication;
 * this function independently enforces the durable queue contract, code-owned
 * action policy, payload schema, approval state, dry-run default, and idempotency.
 */
export async function executeHqQueueAction(
  input: ExecuteHqQueueActionInput,
  store: HqExecutionStore = new SupabaseHqExecutionStore(),
): Promise<ExecuteHqQueueActionResult> {
  const request = requestSchema.safeParse(input);
  if (!request.success) throw new HqExecutionError('INVALID_REQUEST');

  const dryRun = request.data.dryRun ?? true;
  const queue = await store.getQueueAction(request.data.queueItemId);
  if (!queue) throw new HqExecutionError('QUEUE_ITEM_NOT_FOUND');
  if (!queue.actionType || !queue.idempotencyKey || !queue.expectedOutcome) {
    throw new HqExecutionError('ACTION_NOT_CONFIGURED');
  }

  const definition = getHqActionDefinition(queue.actionType);
  if (!definition || definition.risk === 'prohibited') {
    const error = new HqExecutionError('UNSUPPORTED_ACTION');
    await recordBlockedAttempt(store, queue, request.data.requestedBy, dryRun, error);
    throw error;
  }

  // Risk and approval policy come from code. A divergent DB contract fails closed.
  if (queue.riskLevel !== definition.risk || queue.approvalRequired !== definition.approvalRequired) {
    const error = new HqExecutionError('ACTION_NOT_CONFIGURED');
    await recordBlockedAttempt(store, queue, request.data.requestedBy, dryRun, error);
    throw error;
  }

  if (!dryRun && definition.approvalRequired) {
    if (queue.status !== 'approved' || !queue.decidedBy || !queue.decidedAt) {
      const error = new HqExecutionError('ACTION_NOT_APPROVED');
      await recordBlockedAttempt(store, queue, request.data.requestedBy, dryRun, error);
      throw error;
    }
  }

  const payload = definition.schema.safeParse(queue.actionPayload);
  if (!payload.success) {
    const error = new HqExecutionError('INVALID_PAYLOAD');
    await recordBlockedAttempt(store, queue, request.data.requestedBy, dryRun, error);
    throw error;
  }

  const runIdempotencyKey = `${queue.idempotencyKey}:${dryRun ? 'preview' : 'execute'}`;
  const existing = await store.findRun(runIdempotencyKey);
  if (existing) {
    return {
      ok: existing.status === 'succeeded',
      duplicate: true,
      run: existing,
      message:
        existing.status === 'succeeded'
          ? 'This action was already completed; HQ did not run it twice.'
          : 'This action already has a recorded run; HQ did not run it twice.',
    };
  }

  const begun = await store.beginRun({
    queue,
    actionType: definition.type,
    payload: payload.data,
    riskLevel: definition.risk,
    dryRun,
    runIdempotencyKey,
    requestedBy: request.data.requestedBy,
  });

  // A unique-key race can return a still-running winner. Only the process that
  // inserted the row owns execution; status alone never proves ownership.
  if (!begun.created) {
    return {
      ok: begun.run.status === 'succeeded',
      duplicate: true,
      run: begun.run,
      message: 'This action already has a recorded run; HQ did not run it twice.',
    };
  }
  const started = begun.run;

  await store.appendRunEvent({
    runId: started.id,
    eventType: 'execution_started',
    fromStatus: null,
    toStatus: 'running',
    actorId: request.data.requestedBy,
    message: dryRun ? 'HQ action preview started.' : 'HQ action execution started.',
    data: { dryRun, actionType: definition.type },
  });

  await store.setQueueExecutionStatus(queue.id, 'running');

  let output;
  try {
    output = await definition.execute(payload.data, {
      requestedBy: request.data.requestedBy,
      dryRun,
      queueItemId: queue.id,
      createInternalTask: (task) => store.createInternalTask(task),
    });
  } catch (error) {
    const safeError = toFriendlyExecutionError(error);
    const failed = await store.completeRun(started.id, 'failed', {
      errorCode: safeError.code,
      errorMessage: safeError.message,
      retryable: safeError.retryable,
      evidence: { sideEffectConfirmed: false },
    });
    await store.appendRunEvent({
      runId: failed.id,
      eventType: 'execution_failed',
      fromStatus: 'running',
      toStatus: 'failed',
      actorId: request.data.requestedBy,
      message: safeError.message,
      data: { errorCode: safeError.code, retryable: safeError.retryable },
    });
    await store.setQueueExecutionStatus(queue.id, 'failed');
    return { ok: false, duplicate: false, run: failed, message: safeError.message };
  }

  // Persist success before presenting success. If this write fails, the run stays
  // `running`, which prevents an automatic duplicate side effect on the same key.
  const completed = await store.completeRun(started.id, 'succeeded', {
    result: { summary: output.summary, ...(output.result ?? {}) },
    evidence: output.evidence ?? {},
  });
  await store.appendRunEvent({
    runId: completed.id,
    eventType: 'execution_succeeded',
    fromStatus: 'running',
    toStatus: 'succeeded',
    actorId: request.data.requestedBy,
    message: output.summary,
    data: { dryRun },
  });
  await store.setQueueExecutionStatus(queue.id, 'succeeded');
  return { ok: true, duplicate: false, run: completed, message: output.summary };
}
