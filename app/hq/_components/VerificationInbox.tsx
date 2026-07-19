'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HQ_OUTCOME_DEFINITIONS, type HqOutcomeKey } from '@/lib/hq/outcomes';
import { formatEt } from '@/lib/hq/time';
import { recordActionOutcome } from '../actions';
import { EmptyState } from './EmptyState';

export interface VerificationRun {
  id: string;
  actionKey: string;
  finishedAt: string | null;
}
function VerificationCard({ run, onVerified }: { run: VerificationRun; onVerified: (id: string) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [metricKey, setMetricKey] = useState<HqOutcomeKey>('tasks_completed');
  const [value, setValue] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const definition = HQ_OUTCOME_DEFINITIONS[metricKey];
  const fieldPrefix = `verify-${run.id}`;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await recordActionOutcome({
        actionRunId: run.id,
        metricKey,
        value,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onVerified(run.id);
      router.refresh();
    });
  }

  return (
    <li className="hq-panel p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>{run.actionKey}</div>
          <div className="hq-tabular mt-1 text-[11px]" style={{ color: 'var(--hq-ink-dim)' }}>
            Completed {formatEt(run.finishedAt) ?? 'recently'}
          </div>
        </div>
        <span className="hq-eyebrow text-[10px]" style={{ color: 'var(--hq-amber)' }}>Needs outcome</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div>
          <label htmlFor={`${fieldPrefix}-metric`} className="hq-eyebrow mb-1 block text-[10px]">Outcome</label>
          <select
            id={`${fieldPrefix}-metric`}
            value={metricKey}
            onChange={(event) => setMetricKey(event.target.value as HqOutcomeKey)}
            disabled={isPending}
            className="hq-focusable min-h-11 w-full cursor-pointer rounded-md border bg-[var(--hq-panel)] px-3 py-2 text-sm"
            style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-ink)' }}
          >
            {Object.entries(HQ_OUTCOME_DEFINITIONS).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${fieldPrefix}-value`} className="hq-eyebrow mb-1 block text-[10px]">
            Value ({definition.unit})
          </label>
          <input
            id={`${fieldPrefix}-value`}
            type="number"
            min="0.01"
            step={definition.unit === 'count' ? '1' : '0.01'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isPending}
            className="hq-focusable min-h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-ink)' }}
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={`${fieldPrefix}-note`} className="hq-eyebrow mb-1 block text-[10px]">Evidence note</label>
        <input
          id={`${fieldPrefix}-note`}
          type="text"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isPending}
          placeholder="What changed, and what confirms it?"
          className="hq-focusable min-h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-ink)' }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !value}
          className="hq-focusable min-h-11 cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: 'var(--hq-green)', color: 'var(--hq-green)' }}
        >
          {isPending ? 'Recording…' : 'Verify outcome'}
        </button>
        <span className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>Owner-reported · appended to the audit trail</span>
      </div>
      {error && <p className="mt-2 text-xs" role="alert" style={{ color: 'var(--hq-red)' }}>{error}</p>}
    </li>
  );
}

export function VerificationInbox({ runs }: { runs: VerificationRun[] }) {
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  const visible = runs.filter((run) => !verifiedIds.has(run.id));
  if (visible.length === 0) return <EmptyState label="No completed actions are waiting for outcome verification." />;

  return (
    <ul className="flex flex-col gap-3" aria-label="Actions awaiting outcome verification">
      {visible.map((run) => (
        <VerificationCard
          key={run.id}
          run={run}
          onVerified={(id) => setVerifiedIds((current) => new Set(current).add(id))}
        />
      ))}
    </ul>
  );
}
