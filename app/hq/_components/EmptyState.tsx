export function EmptyState({ label }: { label?: string }) {
  return (
    <p className="py-6 text-center text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
      {label ?? 'No data yet — waiting for next ops sweep.'}
    </p>
  );
}
