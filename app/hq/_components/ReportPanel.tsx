import type { ReactNode } from 'react';

export function ReportPanel({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="hq-panel hq-report" open={defaultOpen}>
      <summary className="hq-focusable flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
        <span style={{ color: 'var(--hq-ink)' }}>{title}</span>
        <span className="hq-report-chevron text-lg leading-none" style={{ color: 'var(--hq-ink-dim)' }} aria-hidden="true">
          +
        </span>
      </summary>
      <div className="border-t p-4 sm:p-5" style={{ borderColor: 'var(--hq-border)' }}>
        {children}
      </div>
    </details>
  );
}
