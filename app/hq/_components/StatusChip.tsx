export type ChipTone = 'live' | 'ok' | 'hold' | 'warn' | 'frozen' | 'crit' | 'unknown' | 'info';

const TONE_VAR: Record<ChipTone, string> = {
  live: 'var(--hq-green)',
  ok: 'var(--hq-green)',
  hold: 'var(--hq-amber)',
  warn: 'var(--hq-amber)',
  frozen: 'var(--hq-red)',
  crit: 'var(--hq-red)',
  unknown: 'var(--hq-ink-dim)',
  info: 'var(--hq-ink-dim)',
};

/** Text + color chip — never color-only, the label itself carries the meaning. */
export function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  const color = TONE_VAR[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color, borderColor: color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
