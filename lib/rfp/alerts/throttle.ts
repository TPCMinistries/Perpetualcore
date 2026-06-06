/**
 * Phase 05-07 — Frequency cap policy for alert dispatch.
 *
 * Rule (from 05-CONTEXT.md):
 *   Max 5 alerts per user per channel in any rolling 24h window.
 *   The 6th and beyond are NOT dispatched — they're persisted to rfp_alert_log
 *   with status='batched' so the deferred digest flusher can sweep them up
 *   later (see deferred-items.md → ALERT-DIGEST-FLUSH).
 *
 * Why createAdminClient() here:
 *   This runs in cron/background context, and rfp_alert_log has no public
 *   write policy — inserts are service_role only. Reads via admin bypass RLS
 *   too, which is fine because these counts are per-user-per-channel and the
 *   admin client is only invoked from the dispatch path.
 *
 * Digest flush is NOT implemented in this plan — the cron job that aggregates
 * batched rows into a once-per-day digest is deferred to a follow-up phase.
 * `flushPendingDigests` is exported as a stub for that future caller.
 */

import { createAdminClient } from '@/lib/supabase/server';

export type AlertChannel = 'email' | 'telegram' | 'discord';
export type AlertStatus =
  | 'sent'
  | 'batched'
  | 'failed'
  | 'skipped_cap'
  | 'skipped_unverified';

/** Hard cap: 5 alerts per (user, channel) per rolling 24h. */
export const FREQ_CAP_PER_DAY = 5;

const HOURS_24_MS = 24 * 60 * 60 * 1000;

/** Untyped admin handle for rfp_* tables. */
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

/**
 * Return true if the user has room for ANOTHER sent alert on this channel
 * within the last 24h. Counts only status='sent' rows (batched/skipped
 * rows don't fill the cap — they represent unfired attempts).
 *
 * Failure-mode: on a DB error, this returns `true` (allow). Better to
 * occasionally over-deliver than block legitimate alerts.
 */
export async function isUnderCap(
  userId: string,
  channel: AlertChannel
): Promise<boolean> {
  const supabase = rfpAdmin();
  const since = new Date(Date.now() - HOURS_24_MS).toISOString();

  const { count, error } = await supabase
    .from('rfp_alert_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('status', 'sent')
    .gte('created_at', since);

  if (error) {
    console.error(
      `[alerts/throttle] isUnderCap query failed (user=${userId}, channel=${channel}):`,
      error.message
    );
    return true;
  }
  return (count ?? 0) < FREQ_CAP_PER_DAY;
}

export interface LogAlertArgs {
  user_id: string;
  org_id: string;
  opp_id: string | null;
  channel: AlertChannel;
  status: AlertStatus;
  error?: string | null;
}

/** Insert one rfp_alert_log row. Logs and swallows DB errors. */
export async function logAlert(args: LogAlertArgs): Promise<void> {
  const supabase = rfpAdmin();
  const { error } = await supabase.from('rfp_alert_log').insert({
    user_id: args.user_id,
    org_id: args.org_id,
    opp_id: args.opp_id,
    channel: args.channel,
    status: args.status,
    error: args.error ?? null,
  });
  if (error) {
    console.error(
      `[alerts/throttle] logAlert insert failed (user=${args.user_id}, channel=${args.channel}, status=${args.status}):`,
      error.message
    );
  }
}

/**
 * Persist an opp that would have been dispatched but couldn't be (cap hit,
 * digest_mode on, or channel disabled). Status='batched' is the audit signal
 * that the digest flusher should pick this up.
 */
export async function appendToDigest(args: {
  user_id: string;
  org_id: string;
  opp_id: string;
  channel: AlertChannel;
}): Promise<void> {
  await logAlert({
    user_id: args.user_id,
    org_id: args.org_id,
    opp_id: args.opp_id,
    channel: args.channel,
    status: 'batched',
  });
}

/**
 * Deferred — once-per-day digest flush is NOT implemented in this plan.
 * Tracked in .planning/phases/05-discovery/deferred-items.md → ALERT-DIGEST-FLUSH.
 *
 * Stub exists so the surrounding code can reference the function name; calling
 * it is a no-op today.
 */
export async function flushPendingDigests(): Promise<{ flushed: number }> {
  return { flushed: 0 };
}
