'use client';

import { useState, useTransition } from 'react';
import type { QueueItem } from '@/lib/hq/queue';
import { decideQueueItem, type QueueVerdict } from '../actions';
import { StatusChip, type ChipTone } from './StatusChip';
import { EmptyState } from './EmptyState';

const SEVERITY_TONE: Record<string, ChipTone> = {
  critical: 'crit',
  high: 'crit',
  warn: 'warn',
  warning: 'warn',
  medium: 'warn',
  info: 'info',
  low: 'info',
};

function severityTone(s: string): ChipTone {
  return SEVERITY_TONE[s.toLowerCase()] ?? 'unknown';
}

function ageLabel(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h ago`;
  return 'just now';
}

function QueueRow({ item, onDecided }: { item: QueueItem; onDecided: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function decide(verdict: QueueVerdict) {
    setError(null);
    startTransition(async () => {
      try {
        await decideQueueItem(item.id, verdict, note.trim() || undefined);
        onDecided(item.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to record verdict.');
      }
    });
  }

  const age = ageLabel(item.lastSeen);

  return (
    <li className="hq-panel flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip tone={severityTone(item.severity)} label={item.severity} />
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--hq-ink-dim)' }}>
          {item.source}
        </span>
        {age && (
          <span className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
            {age}
          </span>
        )}
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--hq-ink)' }}>
        {item.title}
      </div>
      {item.detail && (
        <div className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
          {item.detail}
        </div>
      )}
      {noteOpen && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note…"
          className="hq-focusable rounded-md border bg-transparent px-2 py-1 text-xs"
          style={{ borderColor: 'var(--hq-border)', color: 'var(--hq-ink)' }}
        />
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide('approved')}
          className="hq-focusable rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-green)' }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide('snoozed')}
          className="hq-focusable rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-amber)' }}
        >
          Snooze 7d
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide('dismissed')}
          className="hq-focusable rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          style={{ borderColor: 'var(--hq-border-strong)', color: 'var(--hq-red)' }}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          className="hq-focusable text-xs underline"
          style={{ color: 'var(--hq-ink-dim)' }}
        >
          {noteOpen ? 'Hide note' : 'Add note'}
        </button>
        {isPending && (
          <span className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
            Saving…
          </span>
        )}
      </div>
      {error && (
        <div className="text-xs" style={{ color: 'var(--hq-red)' }}>
          {error}
        </div>
      )}
    </li>
  );
}

export function QueueList({ items }: { items: QueueItem[] }) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visible = items.filter((i) => !removedIds.has(i.id));
  if (visible.length === 0) return <EmptyState label="Nothing queued." />;

  return (
    <ul className="flex flex-col gap-2">
      {visible.map((item) => (
        <QueueRow key={item.id} item={item} onDecided={(id) => setRemovedIds((prev) => new Set(prev).add(id))} />
      ))}
    </ul>
  );
}
