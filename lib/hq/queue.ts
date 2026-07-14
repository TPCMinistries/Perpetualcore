import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Reads public.hq_queue — decision items the ops sweep surfaces (strategist /
 * compliance / handoff sources) that are awaiting Lorenzo's verdict. Same
 * defensive service-role pattern as snapshot.ts: the generated DB types don't
 * know this table (an ad hoc Management-API migration, not a tracked one).
 */

export interface QueueItem {
  id: string;
  source: string;
  title: string;
  detail: string | null;
  severity: string;
  status: string;
  verdictNote: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  snoozeUntil: string | null;
  syncedToLedger: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
}

function createHqReaderClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function reqStr(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

/** Defensive shape coercion — a malformed row is dropped, never throws. */
function toQueueItem(raw: unknown): QueueItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string') return null;
  return {
    id: r.id,
    source: reqStr(r.source, 'unknown'),
    title: r.title,
    detail: str(r.detail),
    severity: reqStr(r.severity, 'info'),
    status: reqStr(r.status, 'open'),
    verdictNote: str(r.verdict_note),
    decidedAt: str(r.decided_at),
    decidedBy: str(r.decided_by),
    snoozeUntil: str(r.snooze_until),
    syncedToLedger: r.synced_to_ledger === true,
    firstSeen: str(r.first_seen),
    lastSeen: str(r.last_seen),
  };
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 0,
  warn: 1,
  warning: 1,
  medium: 1,
  info: 2,
  low: 2,
};

function severityRank(s: string): number {
  return SEVERITY_RANK[s.toLowerCase()] ?? 3;
}

/**
 * Open (or lapsed-snooze) queue items, severity-first then most-recently-seen.
 * Never throws — the Queue section must render even before the first ops
 * sweep has populated the table, or if this query fails outright.
 */
export async function getQueueItems(): Promise<QueueItem[]> {
  try {
    const supabase = createHqReaderClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('hq_queue')
      .select('*')
      .or(`status.eq.open,and(status.eq.snoozed,snooze_until.lt.${nowIso})`)
      .limit(200);
    if (error || !data) return [];

    const items = (data as unknown[]).map(toQueueItem).filter((i): i is QueueItem => i !== null);
    return items.sort((a, b) => {
      const rankDiff = severityRank(a.severity) - severityRank(b.severity);
      if (rankDiff !== 0) return rankDiff;
      return (b.lastSeen ?? '').localeCompare(a.lastSeen ?? '');
    });
  } catch {
    return [];
  }
}
