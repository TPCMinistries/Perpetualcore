/**
 * Phase 05-07 — Alert preference resolver.
 *
 * `resolveAlertPrefs(orgId, userId)` returns the merged AlertPrefs that should
 * apply to a given (org, user) pair. Resolution order:
 *
 *   1. User override row (rfp_alert_prefs WHERE org_id = orgId AND user_id = userId)
 *   2. Org default row    (rfp_alert_prefs WHERE org_id = orgId AND user_id IS NULL)
 *   3. System defaults    (threshold=80, email enabled with auth.users.email,
 *                          telegram/discord disabled)
 *
 * Why createAdminClient() here:
 *   The dispatcher runs in a cron/background context (no user session cookie).
 *   We need to look up another user's prefs (the recipient, not the caller),
 *   which RLS would block. The lookup is purely read-only and the result is
 *   not exposed to any caller other than the dispatch code itself.
 *
 * Why source is returned:
 *   Useful for the settings UI ("this row is the org default" vs "you have an
 *   override") and for telemetry. Not load-bearing in the dispatcher.
 */

import { createAdminClient } from '@/lib/supabase/server';

/** Default threshold; user-tunable 60-100 per CONTEXT decision. */
export const DEFAULT_THRESHOLD = 80;

export interface AlertPrefsChannel<TAddress extends string | null> {
  enabled: boolean;
  address: TAddress;
}

export interface AlertPrefs {
  threshold: number;
  email: { enabled: boolean; address: string | null };
  telegram: { enabled: boolean; chat_id: string | null };
  discord: { enabled: boolean; webhook: string | null };
  digest_mode: boolean;
  /** Where this resolved set came from. */
  source: 'user' | 'org' | 'system';
}

/** Untyped admin handle — rfp_* tables not yet in database.types.ts. */
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

interface PrefsRow {
  id: string;
  org_id: string;
  user_id: string | null;
  threshold: number;
  email_enabled: boolean;
  email_address: string | null;
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  discord_enabled: boolean;
  discord_webhook: string | null;
  digest_mode: boolean;
}

/** Map a DB row → AlertPrefs (with the source tag). */
function mapRow(row: PrefsRow, source: 'user' | 'org'): AlertPrefs {
  return {
    threshold: Number(row.threshold),
    email: {
      enabled: !!row.email_enabled,
      address: row.email_address ?? null,
    },
    telegram: {
      enabled: !!row.telegram_enabled,
      chat_id: row.telegram_chat_id ?? null,
    },
    discord: {
      enabled: !!row.discord_enabled,
      webhook: row.discord_webhook ?? null,
    },
    digest_mode: !!row.digest_mode,
    source,
  };
}

/**
 * Resolve the AlertPrefs that should apply to (orgId, userId).
 *
 * Never throws on read errors — returns system defaults instead so the
 * dispatcher can continue with a best-effort fallback. (Errors are logged.)
 */
export async function resolveAlertPrefs(
  orgId: string,
  userId: string
): Promise<AlertPrefs> {
  const supabase = rfpAdmin();

  // 1. Try user override
  const { data: userRow, error: userErr } = await supabase
    .from('rfp_alert_prefs')
    .select(
      'id, org_id, user_id, threshold, email_enabled, email_address, telegram_enabled, telegram_chat_id, discord_enabled, discord_webhook, digest_mode'
    )
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (userErr) {
    console.error(
      '[alerts/prefs] user-override lookup failed:',
      userErr.message
    );
  } else if (userRow) {
    const resolved = mapRow(userRow as PrefsRow, 'user');
    if (resolved.email.enabled && !resolved.email.address) {
      resolved.email.address = await lookupAuthEmail(userId);
    }
    return resolved;
  }

  // 2. Try org default (user_id IS NULL)
  const { data: orgRow, error: orgErr } = await supabase
    .from('rfp_alert_prefs')
    .select(
      'id, org_id, user_id, threshold, email_enabled, email_address, telegram_enabled, telegram_chat_id, discord_enabled, discord_webhook, digest_mode'
    )
    .eq('org_id', orgId)
    .is('user_id', null)
    .maybeSingle();

  if (orgErr) {
    console.error(
      '[alerts/prefs] org-default lookup failed:',
      orgErr.message
    );
  } else if (orgRow) {
    const resolved = mapRow(orgRow as PrefsRow, 'org');
    // Org default never has a per-user email address baked in — fall through
    // to auth.users.email for the recipient.
    if (resolved.email.enabled && !resolved.email.address) {
      resolved.email.address = await lookupAuthEmail(userId);
    }
    return resolved;
  }

  // 3. System defaults
  return {
    threshold: DEFAULT_THRESHOLD,
    email: { enabled: true, address: await lookupAuthEmail(userId) },
    telegram: { enabled: false, chat_id: null },
    discord: { enabled: false, webhook: null },
    digest_mode: false,
    source: 'system',
  };
}

/**
 * Look up auth.users.email via the admin API. Returns null on any error so
 * the caller can decide whether to skip the email channel.
 */
async function lookupAuthEmail(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return null;
    return data.user.email ?? null;
  } catch (e) {
    console.error(
      '[alerts/prefs] auth.users lookup failed:',
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}
