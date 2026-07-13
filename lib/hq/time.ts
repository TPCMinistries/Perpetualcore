const ET_ZONE = 'America/New_York';

/** Formats an ISO timestamp in America/New_York, e.g. "Jul 13, 2026, 7:02 AM ET". */
export function formatEt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
  return `${formatted} ET`;
}
