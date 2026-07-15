import { formatEt } from '@/lib/hq/time';
import { StatusChip, type ChipTone } from './StatusChip';

export interface ActionRunItem {
  id: string;
  actionKey: string;
  status: string;
  queuedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  dryRun: boolean;
  verified: boolean;
}

const TONE: Record<string, ChipTone> = {
  succeeded: 'ok',
  running: 'live',
  failed: 'crit',
  blocked: 'warn',
};

export function ActionRunList({ runs }: { runs: ActionRunItem[] }) {
  if (runs.length === 0) {
    return (
      <div className="hq-panel p-4 text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
        No action runs have been recorded yet. Previewing or running an approved action will create the first audit entry.
      </div>
    );
  }

  return (
    <ul className="hq-panel divide-y" style={{ borderColor: 'var(--hq-border)' }} aria-label="Recent action runs">
      {runs.map((run) => (
        <li key={run.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>
              {run.actionKey}
            </div>
            <div className="hq-tabular mt-1 text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
              Started {formatEt(run.queuedAt) ?? run.queuedAt}
              {run.finishedAt ? ` · finished ${formatEt(run.finishedAt) ?? run.finishedAt}` : ''}
            </div>
            {run.errorMessage && (
              <p className="mt-2 text-xs" style={{ color: 'var(--hq-red)' }}>
                {run.errorMessage}
              </p>
            )}
          </div>
          <StatusChip
            tone={run.verified ? 'ok' : TONE[run.status] ?? 'unknown'}
            label={run.verified ? 'verified' : run.dryRun ? `preview ${run.status}` : run.status}
          />
        </li>
      ))}
    </ul>
  );
}
