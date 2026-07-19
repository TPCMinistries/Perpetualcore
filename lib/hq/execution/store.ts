import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { HqExecutionError } from './errors';
import type {
  BeginRunInput,
  HqActionRisk,
  HqActionRun,
  HqExecutionStore,
  HqQueueActionRow,
  HqRunStatus,
} from './types';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type HqQueueDbRow = {
  id: string;
  status: string;
  action_key: string | null;
  execution_payload: Json;
  expected_outcome: string | null;
  contract_version: number;
  risk_level: string;
  approval_required: boolean;
  decided_by: string | null;
  decided_at: string | null;
  execution_state: string;
  execution_started_at?: string | null;
  execution_finished_at?: string | null;
};

type HqActionRunDbRow = {
  id: string;
  queue_item_id: string;
  action_key: string;
  contract_version: number;
  input: Json;
  output: Json | null;
  risk_level: string;
  dry_run: boolean;
  status: string;
  idempotency_key: string;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  approval_snapshot: Json;
  queued_at: string;
  started_at: string;
  finished_at: string | null;
  evidence: Json | null;
  error_code: string | null;
  error_message: string | null;
  retryable: boolean;
  created_at: string;
  updated_at: string;
};

type HqDatabase = {
  public: {
    Tables: {
      hq_queue: {
        Row: HqQueueDbRow;
        Insert: Partial<HqQueueDbRow> & Pick<HqQueueDbRow, 'id'>;
        Update: Partial<HqQueueDbRow>;
        Relationships: [];
      };
      hq_action_runs: {
        Row: HqActionRunDbRow;
        Insert: Partial<HqActionRunDbRow> &
          Pick<
            HqActionRunDbRow,
            | 'queue_item_id'
            | 'action_key'
            | 'input'
            | 'risk_level'
            | 'dry_run'
            | 'status'
            | 'idempotency_key'
            | 'requested_by'
          >;
        Update: Partial<HqActionRunDbRow>;
        Relationships: [];
      };
      hq_action_run_events: {
        Row: {
          id: number;
          run_id: string;
          event_type: string;
          from_status: string | null;
          to_status: string | null;
          actor_type: string;
          actor_id: string | null;
          message: string | null;
          data: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          run_id: string;
          event_type: string;
          from_status?: string | null;
          to_status?: string | null;
          actor_type: string;
          actor_id?: string | null;
          message?: string | null;
          data?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

function isRisk(value: string): value is HqActionRisk {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'prohibited';
}

function isRunStatus(value: string): value is HqRunStatus {
  return value === 'running' || value === 'succeeded' || value === 'failed' || value === 'blocked';
}

function toQueueRow(row: HqQueueDbRow): HqQueueActionRow {
  return {
    id: row.id,
    status: row.status,
    actionType: row.action_key,
    actionPayload: row.execution_payload,
    // The queue/action pair is stable. Preview and execution get separate suffixes later.
    idempotencyKey: row.action_key ? `${row.id}:${row.action_key}:v${row.contract_version}` : null,
    expectedOutcome: row.expected_outcome,
    contractVersion: row.contract_version,
    riskLevel: isRisk(row.risk_level) ? row.risk_level : 'prohibited',
    approvalRequired: row.approval_required,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
  };
}

function toRun(row: HqActionRunDbRow): HqActionRun {
  if (!isRisk(row.risk_level) || !isRunStatus(row.status)) {
    throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
  }
  return {
    id: row.id,
    queueItemId: row.queue_item_id,
    actionType: row.action_key,
    status: row.status,
    riskLevel: row.risk_level,
    dryRun: row.dry_run,
    idempotencyKey: row.idempotency_key,
    result: row.output,
    evidence: row.evidence,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    retryable: row.retryable,
    startedAt: row.started_at,
    completedAt: row.finished_at,
  };
}

export class SupabaseHqExecutionStore implements HqExecutionStore {
  private readonly admin = createAdminClient();
  private readonly hq = this.admin as unknown as SupabaseClient<HqDatabase>;

  async getQueueAction(id: string): Promise<HqQueueActionRow | null> {
    const { data, error } = await this.hq
      .from('hq_queue')
      .select(
        'id,status,action_key,execution_payload,expected_outcome,contract_version,risk_level,approval_required,decided_by,decided_at,execution_state',
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
    return data ? toQueueRow(data) : null;
  }

  async findRun(idempotencyKey: string): Promise<HqActionRun | null> {
    const { data, error } = await this.hq
      .from('hq_action_runs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
      .overrideTypes<HqActionRunDbRow | null, { merge: false }>();
    if (error) throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
    return data ? toRun(data) : null;
  }

  async beginRun(input: BeginRunInput): Promise<{ run: HqActionRun; created: boolean }> {
    const now = new Date().toISOString();
    const { data, error } = await this.hq
      .from('hq_action_runs')
      .insert({
        queue_item_id: input.queue.id,
        action_key: input.actionType,
        contract_version: input.queue.contractVersion,
        input: toJson(input.payload),
        risk_level: input.riskLevel,
        dry_run: input.dryRun,
        status: 'running',
        idempotency_key: input.runIdempotencyKey,
        requested_by: input.requestedBy,
        approved_by: input.queue.decidedBy,
        approved_at: input.queue.decidedAt,
        approval_snapshot: toJson({
          queueStatus: input.queue.status,
          decidedBy: input.queue.decidedBy,
          decidedAt: input.queue.decidedAt,
        }),
        queued_at: now,
        started_at: now,
        retryable: false,
      })
      .select('*')
      .single()
      .overrideTypes<HqActionRunDbRow, { merge: false }>();

    if (error) {
      if (error.code === '23505') {
        const existing = await this.findRun(input.runIdempotencyKey);
        if (existing) return { run: existing, created: false };
      }
      throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
    }
    return { run: toRun(data), created: true };
  }

  async beginBlockedRun(
    input: BeginRunInput,
    blockedError: { code: string; message: string },
  ): Promise<{ run: HqActionRun; created: boolean }> {
    const now = new Date().toISOString();
    const { data, error } = await this.hq
      .from('hq_action_runs')
      .insert({
        queue_item_id: input.queue.id,
        action_key: input.actionType,
        contract_version: input.queue.contractVersion,
        input: toJson(input.payload),
        risk_level: input.riskLevel,
        dry_run: input.dryRun,
        status: 'blocked',
        idempotency_key: input.runIdempotencyKey,
        requested_by: input.requestedBy,
        approved_by: input.queue.decidedBy,
        approved_at: input.queue.decidedAt,
        approval_snapshot: toJson({
          queueStatus: input.queue.status,
          decidedBy: input.queue.decidedBy,
          decidedAt: input.queue.decidedAt,
        }),
        queued_at: now,
        started_at: now,
        finished_at: now,
        error_code: blockedError.code,
        error_message: blockedError.message,
        evidence: toJson({ sideEffectPerformed: false }),
        retryable: false,
      })
      .select('*')
      .single()
      .overrideTypes<HqActionRunDbRow, { merge: false }>();
    if (error) {
      if (error.code === '23505') {
        const existing = await this.findRun(input.runIdempotencyKey);
        if (existing) return { run: existing, created: false };
      }
      throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
    }
    return { run: toRun(data), created: true };
  }

  async completeRun(
    runId: string,
    status: 'succeeded' | 'failed' | 'blocked',
    values: {
      result?: unknown;
      evidence?: unknown;
      errorCode?: string;
      errorMessage?: string;
      retryable?: boolean;
    },
  ): Promise<HqActionRun> {
    const { data, error } = await this.hq
      .from('hq_action_runs')
      .update({
        status,
        finished_at: new Date().toISOString(),
        output: toJson(values.result),
        evidence: toJson(values.evidence),
        error_code: values.errorCode ?? null,
        error_message: values.errorMessage ?? null,
        retryable: values.retryable ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .select('*')
      .single()
      .overrideTypes<HqActionRunDbRow, { merge: false }>();
    if (error) throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
    return toRun(data);
  }

  async setQueueExecutionStatus(queueItemId: string, status: string): Promise<void> {
    const now = new Date().toISOString();
    const timestamps =
      status === 'running'
        ? { execution_started_at: now }
        : status === 'succeeded' || status === 'failed' || status === 'blocked'
          ? { execution_finished_at: now }
          : {};
    const { error } = await this.hq
      .from('hq_queue')
      .update({ execution_state: status, ...timestamps })
      .eq('id', queueItemId);
    if (error) throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
  }

  async appendRunEvent(input: Parameters<HqExecutionStore['appendRunEvent']>[0]): Promise<void> {
    const { error } = await this.hq.from('hq_action_run_events').insert({
      run_id: input.runId,
      event_type: input.eventType,
      from_status: input.fromStatus,
      to_status: input.toStatus,
      actor_type: 'system',
      actor_id: input.actorId,
      message: input.message,
      data: toJson(input.data ?? {}),
    });
    if (error) throw new HqExecutionError('PERSISTENCE_UNAVAILABLE');
  }

  async createInternalTask(input: Parameters<HqExecutionStore['createInternalTask']>[0]): Promise<{ id: string }> {
    const { data: profile, error: profileError } = await this.admin
      .from('profiles')
      .select('id,organization_id')
      .ilike('email', input.requestedBy)
      .maybeSingle();
    if (profileError || !profile?.organization_id) {
      throw new HqExecutionError('EXECUTION_FAILED', 'HQ could not identify the owner workspace for this task.');
    }

    const { data, error } = await this.admin
      .from('tasks')
      .insert({
        organization_id: profile.organization_id,
        user_id: profile.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        due_date: input.dueDate,
        status: 'todo',
        source: 'hq',
        source_reference: input.sourceReference,
      })
      .select('id')
      .single();
    if (error) throw new HqExecutionError('EXECUTION_FAILED', 'HQ could not create the internal task.', true);
    return { id: data.id };
  }
}
