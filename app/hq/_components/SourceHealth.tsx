import { formatEt } from '@/lib/hq/time';
import { StatusChip, type ChipTone } from './StatusChip';

export type SourceHealthState = 'healthy' | 'stale' | 'degraded' | 'unknown';

export interface SourceHealthItem {
  key: string;
  label: string;
  state: SourceHealthState;
  lastSuccessAt: string | null;
  detail: string | null;
  localOnly: boolean;
}

const TONE: Record<SourceHealthState, ChipTone> = {
  healthy: 'ok',
  stale: 'warn',
  degraded: 'crit',
  unknown: 'unknown',
};

export function SourceHealth({ items }: { items: SourceHealthItem[] }) {
  if (items.length === 0) {
    return (
      <div className="hq-panel p-4 text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
        Source-level health has not been published yet. The cloud reconciler will populate it after deployment.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.key} className="hq-panel flex min-h-32 flex-col justify-between gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>
              {item.label}
            </div>
            <StatusChip tone={TONE[item.state]} label={item.state} />
          </div>
          <div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--hq-ink-dim)' }}>
              {item.detail ?? (item.localOnly ? 'Local producer; cloud can monitor publication but cannot run it.' : 'No source detail supplied.')}
            </p>
            <div className="hq-tabular mt-2 text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
              {item.lastSuccessAt ? `Last success ${formatEt(item.lastSuccessAt) ?? item.lastSuccessAt}` : 'No successful run recorded'}
              {item.localOnly ? ' · local producer' : ''}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
