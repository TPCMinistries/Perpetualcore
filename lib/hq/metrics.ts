import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Reads public.deck_metrics for the last 30 days and buckets it into the
 * named series KpiStrip's sparklines render. Same defensive service-role
 * pattern as snapshot.ts / queue.ts.
 */

export interface SparkPoint {
  day: string;
  value: number;
}

export interface SparkSeriesMap {
  signups: SparkPoint[];
  grossUsd: SparkPoint[];
  mrrUsd: SparkPoint[];
  availableUsd: SparkPoint[];
}

const EMPTY_MAP: SparkSeriesMap = { signups: [], grossUsd: [], mrrUsd: [], availableUsd: [] };

function createHqReaderClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface MetricRow {
  day: string;
  source: string;
  metric: string;
  value: number;
}

function toRow(raw: unknown): MetricRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || typeof r.source !== 'string' || typeof r.metric !== 'string') return null;
  const value = typeof r.value === 'number' ? r.value : Number(r.value);
  if (Number.isNaN(value)) return null;
  return { day: r.day, source: r.source, metric: r.metric, value };
}

/** Sums value per day (across whatever segments matched the caller's filter) and sorts ascending. */
function sumByDay(rows: MetricRow[]): SparkPoint[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    totals.set(r.day, (totals.get(r.day) ?? 0) + r.value);
  }
  return [...totals.entries()].map(([day, value]) => ({ day, value })).sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Never throws — sparklines are cosmetic; a failed fetch just means no
 * lines render, not a broken page.
 */
export async function getSparkSeries(): Promise<SparkSeriesMap> {
  try {
    const supabase = createHqReaderClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffDay = cutoff.toISOString().slice(0, 10);

    const { data, error } = await supabase.from('deck_metrics').select('day, source, metric, value').gte('day', cutoffDay);
    if (error || !data) return EMPTY_MAP;

    const rows = (data as unknown[]).map(toRow).filter((r): r is MetricRow => r !== null);

    return {
      signups: sumByDay(rows.filter((r) => r.source.startsWith('supabase:') && r.metric === 'new_users_24h')),
      grossUsd: sumByDay(rows.filter((r) => r.source === 'pnl' && r.metric === 'gross_7d_usd')),
      mrrUsd: sumByDay(rows.filter((r) => r.source === 'pnl' && r.metric === 'mrr_usd')),
      availableUsd: sumByDay(rows.filter((r) => r.source === 'pnl' && r.metric === 'available_usd')),
    };
  } catch {
    return EMPTY_MAP;
  }
}
