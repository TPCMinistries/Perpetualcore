import type { MomentEntry } from '@/lib/hq/snapshot';
import { formatEt } from '@/lib/hq/time';
import { EmptyState } from './EmptyState';

export function MomentsTimeline({ moments }: { moments: MomentEntry[] | null }) {
  if (!moments) return <EmptyState />;
  if (moments.length === 0) return <EmptyState label="No moments logged yet." />;
  const ordered = [...moments].reverse(); // most recent first
  return (
    <ol className="flex flex-col gap-2">
      {ordered.map((m) => (
        <li key={m.id} className="hq-panel p-3">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
            <span className="hq-tabular">{formatEt(m.ts) ?? m.ts}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium">{m.project}</span>
            {m.brand && (
              <>
                <span aria-hidden="true">·</span>
                <span>{m.brand}</span>
              </>
            )}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--hq-ink)' }}>
            {m.what}
          </div>
          <div className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
            {m.whyItMatters}
          </div>
        </li>
      ))}
    </ol>
  );
}
