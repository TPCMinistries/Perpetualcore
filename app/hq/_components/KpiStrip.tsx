import type { PnlHeadline } from '@/lib/hq/parse';
import { EmptyState } from './EmptyState';

function KpiCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="hq-panel p-4">
      <div className="hq-eyebrow mb-2">{label}</div>
      <div className="hq-tabular text-2xl font-semibold" style={{ color: 'var(--hq-ink)' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export function KpiStrip({ headline }: { headline: PnlHeadline | null }) {
  if (!headline) {
    return (
      <div className="hq-panel">
        <EmptyState />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label="Portfolio MRR" value={headline.mrr} />
      <KpiCard label="7d Gross" value={headline.gross7d} />
      <KpiCard label="Mercury Balance" value={headline.mercuryBalance} />
    </div>
  );
}
