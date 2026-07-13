import { BoardIcon, QueueIcon, StrategyIcon, MarketingIcon, ComplianceIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '#board', label: 'Board', icon: BoardIcon },
  { href: '#queue', label: 'Queue', icon: QueueIcon },
  { href: '#strategy', label: 'Strategy', icon: StrategyIcon },
  { href: '#marketing', label: 'Marketing', icon: MarketingIcon },
  { href: '#compliance', label: 'Compliance', icon: ComplianceIcon },
];

export function LeftRail({ ownerEmail }: { ownerEmail: string }) {
  return (
    <aside
      className="hq-panel sticky top-4 flex h-[calc(100vh-2rem)] w-56 shrink-0 flex-col justify-between p-4"
      aria-label="HQ navigation"
    >
      <div>
        <div className="mb-6 px-1">
          <div className="hq-eyebrow">Perpetual Core</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>
            HQ
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="hq-focusable flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-[var(--hq-panel-2)]"
              style={{ color: 'var(--hq-ink-dim)' }}
            >
              <Icon className="shrink-0" />
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-between border-t px-1 pt-3" style={{ borderColor: 'var(--hq-border)' }}>
        <span className="truncate text-xs" style={{ color: 'var(--hq-ink-dim)' }} title={ownerEmail}>
          {ownerEmail}
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
