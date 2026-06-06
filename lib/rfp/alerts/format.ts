/**
 * Phase 05-07 — Shared formatters for alert channel adapters.
 *
 * Kept separate so the three channel files (email/telegram/discord) and the
 * settings UI can all render identical compact lines. Mirrors the FeedRow
 * formatting in app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx so
 * what the user sees in the alert matches what they see in the feed.
 */

/** $2.4M / $480K / $12K — short, scannable. Null → '—'. */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

/** 'Jun 14' / 'In 5d' / 'Today' / 'No deadline'. */
export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return 'No deadline';
  const dl = new Date(deadline);
  if (Number.isNaN(dl.getTime())) return 'No deadline';
  const ms = dl.getTime() - Date.now();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days}d`;
  return dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Build the deep link to the Discovery detail pane for this opp. */
export function buildOppUrl(args: {
  appUrl: string;
  orgId: string;
  oppId: string;
}): string {
  const base = args.appUrl.replace(/\/$/, '');
  return `${base}/org/${args.orgId}/discovery?opp=${args.oppId}`;
}

/** Minimal escape for HTML attribute / text contexts in email + Telegram HTML. */
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
