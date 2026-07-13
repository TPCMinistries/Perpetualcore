import type { Finding, Severity } from '@/lib/ops/types';
import { parseCountdown } from '@/lib/hq/parse';
import { StatusChip, type ChipTone } from './StatusChip';
import { EmptyState } from './EmptyState';

const SEVERITY_TONE: Record<Severity, ChipTone> = { critical: 'crit', warn: 'warn', info: 'info', ok: 'ok' };

function CountdownChip({ summary }: { summary: string }) {
  const countdown = parseCountdown(summary);
  if (!countdown) return null;
  const label = countdown.overdue ? `${countdown.days}d overdue` : `T-${countdown.days}d`;
  return <StatusChip tone={countdown.overdue ? 'crit' : countdown.days <= 7 ? 'warn' : 'info'} label={label} />;
}

export function FindingsList({ findings, emptyLabel }: { findings: Finding[] | null; emptyLabel?: string }) {
  if (!findings) return <EmptyState />;
  if (findings.length === 0) return <EmptyState label={emptyLabel ?? 'No findings.'} />;
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((f, i) => (
        <li key={`${f.project}-${i}`} className="hq-panel flex flex-col gap-1.5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={SEVERITY_TONE[f.severity]} label={f.severity} />
            <CountdownChip summary={f.summary} />
            <span className="text-xs font-medium" style={{ color: 'var(--hq-ink-dim)' }}>
              {f.project}
            </span>
          </div>
          <div className="text-sm" style={{ color: 'var(--hq-ink)' }}>
            {f.summary}
          </div>
          {f.detail && (
            <div className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
              {f.detail}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
