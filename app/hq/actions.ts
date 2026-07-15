'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireHqOwner } from '@/lib/hq/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { executeHqQueueAction, toFriendlyExecutionError } from '@/lib/hq/execution';

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
