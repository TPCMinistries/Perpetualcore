import type { PnlHeadline } from '@/lib/hq/parse';
import type { Revenue2026 } from '@/lib/hq/snapshot';
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

/** The motivation number — 2026 revenue across every entity, from the owner-attested ledger. */
function RevenueCard({ revenue }: { revenue: Revenue2026 }) {
  const total = `$${Math.round(revenue.totalUsd).toLocaleString('en-US')}`;
  return (
    <div className="hq-panel p-4" title={revenue.breakdown.join('\n')}>
      <div className="hq-eyebrow mb-2">2026 Revenue — All Entities</div>
      <div className="flex items-end justify-between gap-3">
        <div className="hq-tabular text-2xl font-semibold" style={{ color: 'var(--hq-gold)' }}>
          {total}
        </div>
      </div>
      <div className="mt-1 text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
        owner ledger + wired rails{revenue.asOf ? ` · as of ${revenue.asOf}` : ''}
      </div>
    </div>
  );
}

export function KpiStrip({
  headline,
  spark,
  revenue,
}: {
  headline: PnlHeadline | null;
  spark?: SparkSeriesMap;
  revenue?: Revenue2026 | null;
}) {
  if (!headline && !revenue) {
    return (
      <div className="hq-panel">
        <EmptyState />
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${revenue ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {revenue && <RevenueCard revenue={revenue} />}
      <KpiCard label="Portfolio MRR" value={headline?.mrr ?? null} spark={spark?.mrrUsd} />
      <KpiCard label="7d Gross" value={headline?.gross7d ?? null} spark={spark?.grossUsd} />
      <KpiCard label="Mercury Balance" value={headline?.mercuryBalance ?? null} spark={spark?.availableUsd} />
    </div>
  );
}
