export interface OutcomeMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
  direction?: 'positive' | 'negative' | 'neutral';
}

export function OutcomeStrip({ metrics }: { metrics: OutcomeMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="hq-panel p-4 text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
        No verified outcomes have been recorded yet. Completed actions will populate this scorecard.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const color = metric.direction === 'positive' ? 'var(--hq-green)' : metric.direction === 'negative' ? 'var(--hq-red)' : 'var(--hq-ink)';
        return (
          <div key={metric.key} className="hq-panel p-4">
            <div className="hq-eyebrow mb-2">{metric.label}</div>
            <div className="hq-tabular text-2xl font-semibold" style={{ color }}>
              {metric.value}
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
              {metric.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}
