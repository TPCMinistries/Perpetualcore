/**
 * Phase 05-07 — Shared shapes for alert dispatch.
 *
 * Each channel adapter consumes (opp, match) plus its address. Keeping the
 * shapes here means a single source-of-truth for the data the dispatcher
 * loads via createAdminClient() before fanning out.
 */

export interface AlertOpportunity {
  id: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
}

export interface AlertMatch {
  fit_score: number;
  tier: string;
  chips: string[];
  summary: string | null;
}

export interface ChannelResult {
  ok: boolean;
  /**
   * Stable error tag for log/status mapping in the dispatcher:
   *   'domain_unverified' → email path; Resend rejected the From: domain.
   *   'token_unset'       → telegram path; TELEGRAM_BOT_TOKEN missing.
   *   'no_address'        → channel enabled but address/chat_id/webhook empty.
   *   'send_failed'       → channel adapter reached the upstream API but it
   *                          returned non-2xx (network errors fall here too).
   */
  error?:
    | 'domain_unverified'
    | 'token_unset'
    | 'no_address'
    | 'send_failed';
  /** Optional human-readable detail for the log row. */
  message?: string;
}
