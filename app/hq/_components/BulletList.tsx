import { EmptyState } from './EmptyState';

export function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) return <EmptyState label={emptyLabel} />;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="hq-panel p-3 text-sm" style={{ color: 'var(--hq-ink)' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
