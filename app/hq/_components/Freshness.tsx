import { formatEt } from '@/lib/hq/time';

export function Freshness({ generatedAt }: { generatedAt: string | null }) {
  const formatted = formatEt(generatedAt);
  const generatedMs = generatedAt ? new Date(generatedAt).getTime() : Number.NaN;
  const ageHours = Number.isFinite(generatedMs) ? Math.max(0, (Date.now() - generatedMs) / 3_600_000) : null;
  const stale = ageHours === null || ageHours > 30;

  return (
    <div
      className="hq-tabular inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
      style={{ color: stale ? 'var(--hq-amber)' : 'var(--hq-green)', borderColor: stale ? 'var(--hq-amber)' : 'var(--hq-green)' }}
      title={stale ? 'The HQ snapshot is older than 30 hours. Check the local daily-brief automation.' : 'The operating snapshot is current.'}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} aria-hidden="true" />
      {formatted ? <>{stale ? 'Stale' : 'Current'} · {formatted}</> : 'No ops snapshot'}
    </div>
  );
}
