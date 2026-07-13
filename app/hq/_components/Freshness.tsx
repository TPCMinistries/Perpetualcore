import { formatEt } from '@/lib/hq/time';

export function Freshness({ generatedAt }: { generatedAt: string | null }) {
  const formatted = formatEt(generatedAt);
  return (
    <div className="hq-tabular text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
      {formatted ? <>As of {formatted}</> : 'No ops sweep has run yet'}
    </div>
  );
}
