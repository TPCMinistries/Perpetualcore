'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireHqOwner } from '@/lib/hq/auth';

const VERDICTS = ['approved', 'dismissed', 'snoozed'] as const;
export type QueueVerdict = (typeof VERDICTS)[number];

const SNOOZE_DAYS = 7;

function createHqWriterClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
