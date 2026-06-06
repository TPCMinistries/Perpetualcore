/**
 * Phase 05-07 — Alert dispatch orchestrator.
 *
 * Public entry: `maybeDispatchAlert({ oppId, matchOrgId, fit_score })`.
 *
 * Called from lib/rfp/scoring/recompute.ts on the CRON path (per 05-CONTEXT.md
 * decision — alerts only fire on cron-discovered new opps; recomputeAllForOrg
 * is silent). For each org member with role in (owner, writer, reviewer):
 *
 *   1. resolveAlertPrefs(orgId, userId) — user override > org default > system.
 *   2. If fit_score < prefs.threshold → no-op, no log (not noteworthy).
 *   3. If prefs.digest_mode === true → log status='batched' for every enabled
 *      channel and continue.
 *   4. For each enabled channel:
 *      a. isUnderCap(userId, channel)? No → log batched. Yes → call sender,
 *         log status='sent' or 'failed' or 'skipped_unverified'.
 *
 * Robustness:
 *   - Every per-user / per-channel error is caught + logged. A single bad
 *     webhook or unreachable Telegram chat never affects other users.
 *   - DB load failures degrade gracefully — if we can't load the opp or
 *     match row, dispatch returns silently.
 *   - Caller (recompute.ts) wraps the whole call in try/catch too.
 *
 * Concurrency: per-user dispatch is sequential within a single call (a single
 * cron tick rarely has thousands of users on the same opp). The scoring layer
 * already gates fan-out via asyncPool(3) on the outer loop.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { sendEmailAlert } from './channels/email';
import { sendTelegramAlert } from './channels/telegram';
import { sendDiscordAlert } from './channels/discord';
import { resolveAlertPrefs, type AlertPrefs } from './prefs';
import {
  appendToDigest,
  isUnderCap,
  logAlert,
  type AlertChannel,
  type AlertStatus,
} from './throttle';
import type { AlertMatch, AlertOpportunity, ChannelResult } from './types';

/** Map ChannelResult → rfp_alert_log status enum. */
function statusForResult(r: ChannelResult): AlertStatus {
  if (r.ok) return 'sent';
  if (r.error === 'domain_unverified' || r.error === 'token_unset') {
    return 'skipped_unverified';
  }
  return 'failed';
}

/** Untyped admin handle for rfp_* tables. */
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

interface OppRow {
  id: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
}

interface MatchRow {
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
}

interface OrgMemberRow {
  user_id: string;
  role: string;
}

/** Resolve the app URL from env with a safe default. */
function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://perpetualcore.com';
}

/** Match tier text — mirrors scoring/weights.ts tierFor() outputs. */
function tierFromScore(score: number): string {
  if (score >= 90) return 'Strong fit';
  if (score >= 70) return 'Good fit';
  if (score >= 50) return 'Marginal';
  return 'Weak';
}

/**
 * Load the opportunity + match (chips/summary) plus the org's eligible members.
 * Returns null when any of those reads fails or the opp doesn't exist.
 */
async function loadDispatchContext(
  oppId: string,
  matchOrgId: string
): Promise<{
  opp: AlertOpportunity;
  match: AlertMatch;
  members: OrgMemberRow[];
} | null> {
  const supabase = rfpAdmin();

  const [oppRes, matchRes, membersRes] = await Promise.all([
    supabase
      .from('rfp_opportunities')
      .select('id, title, agency, amount_min, amount_max, deadline, brief, url')
      .eq('id', oppId)
      .maybeSingle(),
    supabase
      .from('rfp_opp_matches')
      .select('fit_score, chips, summary')
      .eq('opp_id', oppId)
      .eq('org_id', matchOrgId)
      .maybeSingle(),
    supabase
      .from('rfp_user_orgs')
      .select('user_id, role')
      .eq('org_id', matchOrgId)
      .in('role', ['owner', 'writer', 'reviewer']),
  ]);

  if (oppRes.error) {
    console.error('[alerts/dispatch] opp load failed:', oppRes.error.message);
    return null;
  }
  if (!oppRes.data) return null;
  if (matchRes.error) {
    console.error('[alerts/dispatch] match load failed:', matchRes.error.message);
    return null;
  }
  if (!matchRes.data) return null;
  if (membersRes.error) {
    console.error(
      '[alerts/dispatch] members load failed:',
      membersRes.error.message
    );
    return null;
  }

  const oppRow = oppRes.data as OppRow;
  const matchRow = matchRes.data as MatchRow;
  const members = ((membersRes.data ?? []) as OrgMemberRow[]).filter(
    (m) => !!m?.user_id
  );

  const opp: AlertOpportunity = {
    id: oppRow.id,
    title: oppRow.title,
    agency: oppRow.agency ?? null,
    amount_min: oppRow.amount_min ?? null,
    amount_max: oppRow.amount_max ?? null,
    deadline: oppRow.deadline ?? null,
    brief: oppRow.brief ?? null,
    url: oppRow.url ?? null,
  };

  const score = Number(matchRow.fit_score);
  const match: AlertMatch = {
    fit_score: Number.isFinite(score) ? Math.round(score) : 0,
    tier: tierFromScore(score),
    chips: Array.isArray(matchRow.chips) ? matchRow.chips : [],
    summary: matchRow.summary ?? null,
  };

  return { opp, match, members };
}

/**
 * Per-user fan-out. Resolves prefs, checks threshold + digest, then iterates
 * the enabled channels applying the frequency cap before dispatching.
 *
 * Robust against per-channel failures: a Discord 404 or Telegram chat-not-
 * found never short-circuits the remaining channels.
 */
async function dispatchForUser(args: {
  userId: string;
  orgId: string;
  opp: AlertOpportunity;
  match: AlertMatch;
  appUrl: string;
}): Promise<void> {
  let prefs: AlertPrefs;
  try {
    prefs = await resolveAlertPrefs(args.orgId, args.userId);
  } catch (e) {
    console.error(
      `[alerts/dispatch] resolveAlertPrefs failed (user=${args.userId}, org=${args.orgId}):`,
      e instanceof Error ? e.message : String(e)
    );
    return;
  }

  // Threshold gate — silent skip below threshold (not noteworthy in audit).
  if (args.match.fit_score < prefs.threshold) return;

  type ChannelDispatch =
    | {
        channel: 'email';
        enabled: boolean;
        sender: () => Promise<ChannelResult>;
      }
    | {
        channel: 'telegram';
        enabled: boolean;
        sender: () => Promise<ChannelResult>;
      }
    | {
        channel: 'discord';
        enabled: boolean;
        sender: () => Promise<ChannelResult>;
      };

  const dispatches: ChannelDispatch[] = [
    {
      channel: 'email',
      enabled: prefs.email.enabled && !!prefs.email.address,
      sender: () =>
        sendEmailAlert({
          to: prefs.email.address ?? '',
          opp: args.opp,
          match: args.match,
          orgId: args.orgId,
          appUrl: args.appUrl,
        }),
    },
    {
      channel: 'telegram',
      enabled: prefs.telegram.enabled && !!prefs.telegram.chat_id,
      sender: () =>
        sendTelegramAlert({
          chat_id: prefs.telegram.chat_id ?? '',
          opp: args.opp,
          match: args.match,
          orgId: args.orgId,
          appUrl: args.appUrl,
        }),
    },
    {
      channel: 'discord',
      enabled: prefs.discord.enabled && !!prefs.discord.webhook,
      sender: () =>
        sendDiscordAlert({
          webhook_url: prefs.discord.webhook ?? '',
          opp: args.opp,
          match: args.match,
          orgId: args.orgId,
          appUrl: args.appUrl,
        }),
    },
  ];

  // Digest mode: log batched for every enabled channel; never dispatch.
  if (prefs.digest_mode) {
    for (const d of dispatches) {
      if (!d.enabled) continue;
      await appendToDigest({
        user_id: args.userId,
        org_id: args.orgId,
        opp_id: args.opp.id,
        channel: d.channel as AlertChannel,
      });
    }
    return;
  }

  for (const d of dispatches) {
    if (!d.enabled) continue;
    try {
      const underCap = await isUnderCap(args.userId, d.channel as AlertChannel);
      if (!underCap) {
        await appendToDigest({
          user_id: args.userId,
          org_id: args.orgId,
          opp_id: args.opp.id,
          channel: d.channel as AlertChannel,
        });
        continue;
      }
      const result = await d.sender();
      await logAlert({
        user_id: args.userId,
        org_id: args.orgId,
        opp_id: args.opp.id,
        channel: d.channel as AlertChannel,
        status: statusForResult(result),
        error: result.ok ? null : result.message ?? result.error ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[alerts/dispatch] channel=${d.channel} failed (user=${args.userId}):`,
        msg
      );
      await logAlert({
        user_id: args.userId,
        org_id: args.orgId,
        opp_id: args.opp.id,
        channel: d.channel as AlertChannel,
        status: 'failed',
        error: msg,
      });
    }
  }
}

export interface MaybeDispatchArgs {
  oppId: string;
  matchOrgId: string;
  /** Pre-checked floor — recompute.ts already filters fit_score >= 80. */
  fit_score: number;
}

/**
 * Cron-path entry. Loads opp+match+members, then fans out per-user.
 *
 * Never throws. Caller (scoring/recompute.ts) wraps in try/catch too as
 * defense-in-depth; this function returns silently on any failure.
 */
export async function maybeDispatchAlert(args: MaybeDispatchArgs): Promise<void> {
  // Cheap top-level gate — scoring should already filter on >= 80 before
  // calling, but defending against future callers passing a low score keeps
  // the audit log clean.
  if (args.fit_score < 60) return;

  const ctx = await loadDispatchContext(args.oppId, args.matchOrgId);
  if (!ctx) return;

  const { opp, match, members } = ctx;
  if (members.length === 0) return;

  const appUrl = getAppUrl();
  for (const member of members) {
    try {
      await dispatchForUser({
        userId: member.user_id,
        orgId: args.matchOrgId,
        opp,
        match,
        appUrl,
      });
    } catch (e) {
      console.error(
        `[alerts/dispatch] dispatchForUser failed (user=${member.user_id}, org=${args.matchOrgId}, opp=${args.oppId}):`,
        e instanceof Error ? e.message : String(e)
      );
    }
  }
}
