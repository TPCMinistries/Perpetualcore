import type { z } from 'zod';

export const HQ_ACTION_RISKS = ['low', 'medium', 'high', 'prohibited'] as const;
export type HqActionRisk = (typeof HQ_ACTION_RISKS)[number];

export const HQ_RUN_STATUSES = ['running', 'succeeded', 'failed', 'blocked'] as const;
export type HqRunStatus = (typeof HQ_RUN_STATUSES)[number];

export interface HqQueueActionRow {
  id: string;
  status: string;
  actionType: string | null;
  actionPayload: unknown;
  idempotencyKey: string | null;
  expectedOutcome: string | null;
  contractVersion: number;
  riskLevel: HqActionRisk;
  approvalRequired: boolean;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface HqActionRun {
  id: string;
  queueItemId: string;
  actionType: string;
  status: HqRunStatus;
  riskLevel: HqActionRisk;
  dryRun: boolean;
  idempotencyKey: string;
  result: unknown;
  evidence: unknown;
  errorCode: string | null;
  errorMessage: string | null;
  retryable: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface HqActionOutput {
  summary: string;
  result?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
}

export interface HqExecutionAdapterContext {
  requestedBy: string;
  dryRun: boolean;
  queueItemId: string;
  createInternalTask(input: {
    requestedBy: string;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    dueDate: string | null;
    sourceReference: string;
  }): Promise<{ id: string }>;
}

export interface HqActionDefinition<TSchema extends z.ZodType = z.ZodType> {
  type: string;
  label: string;
  risk: HqActionRisk;
  approvalRequired: boolean;
  schema: TSchema;
  execute(payload: z.output<TSchema>, context: HqExecutionAdapterContext): Promise<HqActionOutput>;
}

export interface BeginRunInput {
  queue: HqQueueActionRow;
  actionType: string;
  payload: unknown;
  riskLevel: HqActionRisk;
  dryRun: boolean;
  runIdempotencyKey: string;
  requestedBy: string;
}

export interface HqExecutionStore {
  getQueueAction(id: string): Promise<HqQueueActionRow | null>;
  findRun(idempotencyKey: string): Promise<HqActionRun | null>;
  beginRun(input: BeginRunInput): Promise<{ run: HqActionRun; created: boolean }>;
  beginBlockedRun(
    input: BeginRunInput,
    error: { code: string; message: string },
  ): Promise<{ run: HqActionRun; created: boolean }>;
  completeRun(
    runId: string,
    status: Extract<HqRunStatus, 'succeeded' | 'failed' | 'blocked'>,
    values: {
      result?: unknown;
      evidence?: unknown;
      errorCode?: string;
      errorMessage?: string;
      retryable?: boolean;
    },
  ): Promise<HqActionRun>;
  setQueueExecutionStatus(queueItemId: string, status: string): Promise<void>;
  appendRunEvent(input: {
    runId: string;
    eventType: string;
    fromStatus: HqRunStatus | null;
    toStatus: HqRunStatus;
    actorId: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void>;
  createInternalTask(input: Parameters<HqExecutionAdapterContext['createInternalTask']>[0]): Promise<{ id: string }>;
}

export interface ExecuteHqQueueActionInput {
  queueItemId: string;
  requestedBy: string;
  /** Safety default is true. Only an explicit false can cause a side effect. */
  dryRun?: boolean;
}

export interface ExecuteHqQueueActionResult {
  ok: boolean;
  duplicate: boolean;
  run: HqActionRun;
  message: string;
}
