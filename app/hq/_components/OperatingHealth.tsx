import { formatEt } from '@/lib/hq/time';
import type { OperatingHealthItem, OperatingHealthState } from '@/lib/hq/operating-health';
import { StatusChip, type ChipTone } from './StatusChip';

const TONE: Record<OperatingHealthState, ChipTone> = {
  healthy: 'ok',
  warning: 'warn',
  critical: 'crit',
  unknown: 'unknown',
};

function formatMetric(value: number, unit: string): string {
  if (unit === 'usd') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  if (unit === 'percent') return `${value.toLocaleString()}%`;
  return `${value.toLocaleString()} ${unit}`;
}

export function OperatingHealth({ items }: { items: OperatingHealthItem[] }) {
  if (items.length === 0) {
    return (
      <div className="hq-panel p-4 text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
        No bounded cost or runtime receipts have been published yet.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <li key={item.key} className="hq-panel flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>{item.label}</div>
              <div className="mt-0.5 text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
                {item.provider} · receipt {item.freshness}
              </div>
            </div>
            <StatusChip tone={TONE[item.state]} label={item.state} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--hq-ink-dim)' }}>{item.summary}</p>
          <div className="space-y-3">
            {item.metrics.map((metric) => {
              const width = metric.ratio === null ? 0 : Math.min(100, Math.max(0, metric.ratio * 100));
              return (
                <div key={metric.key}>
                  <div className="mb-1 flex items-end justify-between gap-3 text-xs">
                    <span style={{ color: 'var(--hq-ink-dim)' }}>{metric.label}</span>
                    <span className="hq-tabular" style={{ color: 'var(--hq-ink)' }}>
                      {formatMetric(metric.value, metric.unit)}
                      {metric.limit === null ? '' : ` / ${formatMetric(metric.limit, metric.unit)}`}
                    </span>
                  </div>
                  {metric.limit !== null && (
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ background: 'var(--hq-panel-2)' }}
                      role="progressbar"
                      aria-label={metric.label}
                      aria-valuemin={0}
                      aria-valuemax={metric.limit}
                      aria-valuenow={Math.min(metric.value, metric.limit)}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          background: metric.state === 'critical'
                            ? 'var(--hq-red)'
                            : metric.state === 'warning'
                              ? 'var(--hq-amber)'
                              : 'var(--hq-green)',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="hq-tabular text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
            Observed {formatEt(item.observedAt) ?? item.observedAt}
          </div>
        </li>
      ))}
    </ul>
  );
}
