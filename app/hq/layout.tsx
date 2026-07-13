import type { ReactNode } from 'react';
import './hq.css';
import { requireHqOwner } from '@/lib/hq/auth';
import { ThemeScript } from './_components/ThemeScript';
import { LeftRail } from './_components/LeftRail';

export const metadata = {
  title: 'HQ | Perpetual Core',
};

export const dynamic = 'force-dynamic';

export default async function HqLayout({ children }: { children: ReactNode }) {
  const { email } = await requireHqOwner('/hq');

  return (
    <div id="hq-shell" className="hq-shell">
      <ThemeScript />
      <div className="mx-auto flex max-w-7xl gap-4 p-4">
        <LeftRail ownerEmail={email} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
