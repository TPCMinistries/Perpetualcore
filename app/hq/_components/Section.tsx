import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 py-8 first:pt-0">
      <div className="mb-4">
        <div className="hq-eyebrow">{eyebrow}</div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--hq-ink)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
