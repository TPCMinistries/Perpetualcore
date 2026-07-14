import type { PnlHeadline } from '@/lib/hq/parse';
import type { SparkPoint, SparkSeriesMap } from '@/lib/hq/metrics';
import { EmptyState } from './EmptyState';
import { Sparkline } from './Sparkline';

function KpiCard({ label, value, spark }: { label: string; value: string | null; spark?: SparkPoint[] }) {
  return (
    <div className="hq-panel p-4">
      <div className="hq-eyebrow mb-2">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="hq-tabular text-2xl font-semibold" style={{ color: 'var(--hq-ink)' }}>
          {value ?? '—'}
        </div>
        {spark && spark.length >= 2 && (
          <div style={{ color: 'var(--hq-gold)' }}>
            <Sparkline points={spark} />
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiStrip({ headline, spark }: { headline: PnlHeadline | null; spark?: SparkSeriesMap }) {
  if (!headline) {
    return (
      <div className="hq-panel">
        <EmptyState />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label="Portfolio MRR" value={headline.mrr} spark={spark?.mrrUsd} />
      <KpiCard label="7d Gross" value={headline.gross7d} spark={spark?.grossUsd} />
      <KpiCard label="Mercury Balance" value={headline.mercuryBalance} spark={spark?.availableUsd} />
    </div>
  );
}
