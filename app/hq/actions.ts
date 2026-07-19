'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireHqOwner } from '@/lib/hq/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { executeHqQueueAction, toFriendlyExecutionError } from '@/lib/hq/execution';
import { HQ_OUTCOME_DEFINITIONS, outcomeInputSchema, type HqOutcomeInput } from '@/lib/hq/outcomes';

const VERDICTS = ['approved', 'dismissed', 'snoozed'] as const;
export type QueueVerdict = (typeof VERDICTS)[number];

const SNOOZE_DAYS = 7;

type HqWriterDatabase = {
  public: {
    Tables: {
      hq_queue: {
        Row: { id: string };
        Insert: { id: string };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      hq_action_runs: {
        Row: {
          id: string;
          queue_item_id: string | null;
          action_key: string;
          status: string;
          dry_run: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      hq_outcome_metrics: {
        Row: { id: string; action_run_id: string | null };
        Insert: {
          metric_key: string;
          metric_name: string;
          value: number;
          unit: string;
          direction: string;
          queue_item_id: string | null;
          action_run_id: string;
          measured_at: string;
          metadata: Record<string, unknown>;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      hq_action_run_events: {
        Row: { id: number };
        Insert: {
          run_id: string;
          event_type: string;
          from_status: string;
          to_status: string;
          actor_type: string;
          actor_id: string;
          message: string;
          data: Record<string, unknown>;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function createHqWriterClient() {
  return createAdminClient() as unknown as SupabaseClient<HqWriterDatabase>;
}

export interface HqActionResponse {
  ok: boolean;
  message: string;
  runId?: string;
  duplicate?: boolean;
}

/** Records an owner-verified business outcome for one real, successful action run. */
export async function recordActionOutcome(input: HqOutcomeInput): Promise<HqActionResponse> {
  const { email } = await requireHqOwner('/hq');
  const parsed = outcomeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Choose a valid outcome and enter a positive value.' };

  const definition = HQ_OUTCOME_DEFINITIONS[parsed.data.metricKey];
  const supabase = createHqWriterClient();
  const { data: run, error: runError } = await supabase
    .from('hq_action_runs')
    .select('id, queue_item_id, action_key, status, dry_run')
    .eq('id', parsed.data.actionRunId)
    .maybeSingle()
    .overrideTypes<{
      id: string;
      queue_item_id: string | null;
      action_key: string;
      status: string;
      dry_run: boolean;
    } | null, { merge: false }>();

  if (runError || !run) return { ok: false, message: 'The action run could not be found.' };
  if (run.dry_run || run.status !== 'succeeded') {
    return { ok: false, message: 'Only successful, non-preview actions can receive verified outcomes.' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('hq_outcome_metrics')
    .select('id, action_run_id')
    .eq('action_run_id', run.id)
    .limit(1)
    .maybeSingle()
    .overrideTypes<{ id: string; action_run_id: string | null } | null, { merge: false }>();
  if (existingError) return { ok: false, message: 'HQ could not check the current verification state.' };
  if (existing) return { ok: false, message: 'This action already has a verified outcome.' };

  const measuredAt = new Date().toISOString();
  const { error: outcomeError } = await supabase.from('hq_outcome_metrics').insert({
    metric_key: parsed.data.metricKey,
    metric_name: definition.label,
    value: parsed.data.value,
    unit: definition.unit,
    direction: definition.direction,
    queue_item_id: run.queue_item_id,
    action_run_id: run.id,
    measured_at: measuredAt,
    metadata: {
      verification_type: 'owner_reported',
      verified_by: email,
      action_key: run.action_key,
      note: parsed.data.note ?? null,
    },
  });
  if (outcomeError) return { ok: false, message: 'HQ could not record the verified outcome.' };

  const { error: eventError } = await supabase.from('hq_action_run_events').insert({
    run_id: run.id,
    event_type: 'owner_outcome_recorded',
    from_status: 'succeeded',
    to_status: 'succeeded',
    actor_type: 'owner',
    actor_id: email,
    message: `${definition.label}: ${parsed.data.value} ${definition.unit}`,
    data: { metricKey: parsed.data.metricKey, measuredAt },
  });
  if (eventError) {
    console.error('[HQ outcome] metric recorded but audit event failed', { runId: run.id, message: eventError.message });
  }

  revalidatePath('/hq');
  return { ok: true, message: 'Outcome verified and added to the scorecard.', runId: run.id };
}

/** Owner-gated application action. Preview is the safe default. */
export async function executeQueueItem(id: string, dryRun = true): Promise<HqActionResponse> {
  const { email } = await requireHqOwner('/hq');
  try {
    const result = await executeHqQueueAction({ queueItemId: id, requestedBy: email, dryRun });
    revalidatePath('/hq');
    return { ok: result.ok, message: result.message, runId: result.run.id, duplicate: result.duplicate };
  } catch (error) {
    const safeError = toFriendlyExecutionError(error);
    return { ok: false, message: safeError.message };
  }
}

/**
 * Records Lorenzo's verdict on one hq_queue item. Owner-gated — requireHqOwner
 * redirects anyone not on HQ_OWNER_EMAILS before any write happens, and its
 * email becomes decided_by so the row always says who decided.
 */
export async function decideQueueItem(id: string, verdict: QueueVerdict, note?: string): Promise<void> {
  const { email } = await requireHqOwner('/hq');

  if (!VERDICTS.includes(verdict)) {
    throw new Error(`Invalid verdict: ${verdict}`);
  }

  const nowIso = new Date().toISOString();
  const snoozeUntil = verdict === 'snoozed' ? new Date(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;

  const supabase = createHqWriterClient();
  const { error } = await supabase
    .from('hq_queue')
    .update({
      status: verdict,
      decided_at: nowIso,
      decided_by: email,
      verdict_note: note ?? null,
      snooze_until: snoozeUntil,
      synced_to_ledger: false,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update queue item ${id}: ${error.message}`);
  }

  revalidatePath('/hq');
}
