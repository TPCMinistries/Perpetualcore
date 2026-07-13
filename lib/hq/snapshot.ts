import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Finding } from '@/lib/ops/types';

/**
 * Reads the `hq` row the ops plane writes via lib/ops/deck-push.ts
 * (pushSnapshot) into public.deck_snapshots. That table lives in the LDC
 * Brain AI Supabase project, which is this app's own NEXT_PUBLIC_SUPABASE_URL
 * — so no cross-project client is needed, just a query against a table the
 * generated Database types don't know about yet (created ad hoc by the ops
 * Management-API executor, not a tracked migration).
 */

export interface MomentEntry {
  id: string;
  ts: string;
  project: string;
  brand?: string;
  what: string;
  whyItMatters: string;
  proof: string;
  status: string;
  source: string;
}

export interface HqSnapshot {
  generatedAt: string | null;
  pnlMd: string | null;
  strategistMemoMd: string | null;
  decisionLedgerTail: string | null;
  compliance: Finding[] | null;
  probesMd: string | null;
  contentCalendarMd: string | null;
  momentsTail: MomentEntry[] | null;
}

function createHqReaderClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function findings(v: unknown): Finding[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(
    (f): f is Finding => typeof f === 'object' && f !== null && typeof (f as Finding).summary === 'string',
  );
}

function moments(v: unknown): MomentEntry[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(
    (m): m is MomentEntry => typeof m === 'object' && m !== null && typeof (m as MomentEntry).what === 'string',
  );
}

/** Defensive shape coercion — a partially malformed snapshot degrades field-by-field, never throws. */
function toHqSnapshot(raw: unknown): HqSnapshot {
  const data = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  return {
    generatedAt: str(data.generated_at),
    pnlMd: str(data.pnl_md),
    strategistMemoMd: str(data.strategist_memo_md),
    decisionLedgerTail: str(data.decision_ledger_tail),
    compliance: findings(data.compliance),
    probesMd: str(data.probes),
    contentCalendarMd: str(data.content_calendar_md),
    momentsTail: moments(data.moments_tail),
  };
}

const EMPTY_SNAPSHOT: HqSnapshot = {
  generatedAt: null,
  pnlMd: null,
  strategistMemoMd: null,
  decisionLedgerTail: null,
  compliance: null,
  probesMd: null,
  contentCalendarMd: null,
  momentsTail: null,
};

/**
 * Reads the current `hq` snapshot. Never throws — the page must render even
 * with zero rows (the state on first deploy, before any ops sweep has run).
 */
export async function getHqSnapshot(): Promise<HqSnapshot> {
  try {
    const supabase = createHqReaderClient();
    const { data, error } = await supabase.from('deck_snapshots').select('data').eq('kind', 'hq').maybeSingle();
    if (error || !data) return EMPTY_SNAPSHOT;
    return toHqSnapshot((data as { data: unknown }).data);
  } catch {
    return EMPTY_SNAPSHOT;
  }
}
