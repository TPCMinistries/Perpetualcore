export interface OperatingLoopCounts {
  proposed: number;
  approved: number;
  running: number;
  verify: number;
  completed: number;
  failed: number;
}

const STEPS: Array<{ key: keyof Omit<OperatingLoopCounts, 'failed'>; label: string; description: string }> = [
  { key: 'proposed', label: 'Proposed', description: 'Waiting for a decision' },
  { key: 'approved', label: 'Approved', description: 'Cleared to execute' },
  { key: 'running', label: 'Running', description: 'Work in progress' },
  { key: 'verify', label: 'Verify', description: 'Needs evidence review' },
  { key: 'completed', label: 'Done', description: 'Outcome recorded' },
];

export function OperatingLoop({ counts }: { counts: OperatingLoopCounts }) {
  return (
    <div className="hq-panel overflow-hidden" aria-label="Operating loop">
      <div className="grid grid-cols-2 sm:grid-cols-5">
        {STEPS.map((step, index) => (
          <div
            key={step.key}
            className="relative min-h-24 border-b p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            style={{ borderColor: 'var(--hq-border)' }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="hq-eyebrow text-[10px]">{step.label}</span>
              <span className="hq-tabular text-lg font-semibold" style={{ color: 'var(--hq-ink)' }}>
                {counts[step.key]}
              </span>
            </div>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--hq-ink-dim)' }}>
              {step.description}
            </p>
            {index < STEPS.length - 1 && (
              <span className="absolute right-[-5px] top-1/2 z-10 hidden h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-r border-t bg-[var(--hq-panel)] sm:block" style={{ borderColor: 'var(--hq-border)' }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      {counts.failed > 0 && (
        <div className="border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--hq-border)', color: 'var(--hq-red)' }}>
          {counts.failed} failed action{counts.failed === 1 ? '' : 's'} require review.
        </div>
      )}
    </div>
  );
}
