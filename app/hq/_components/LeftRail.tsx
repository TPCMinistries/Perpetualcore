import { BoardIcon, QueueIcon, StrategyIcon, MarketingIcon, ComplianceIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '#today', label: 'Today', icon: BoardIcon },
  { href: '#queue', label: 'Decide', icon: QueueIcon },
  { href: '#execution', label: 'Execute', icon: StrategyIcon },
  { href: '#sources', label: 'Sources', icon: ComplianceIcon },
  { href: '#outcomes', label: 'Outcomes', icon: BoardIcon },
  { href: '#development', label: 'Develop', icon: StrategyIcon },
  { href: '#board', label: 'Board', icon: BoardIcon },
  { href: '#strategy', label: 'Strategy', icon: StrategyIcon },
  { href: '#marketing', label: 'Marketing', icon: MarketingIcon },
  { href: '#compliance', label: 'Compliance', icon: ComplianceIcon },
];

export function LeftRail({ ownerEmail }: { ownerEmail: string }) {
  return (
    <aside
      className="hq-panel sticky top-2 z-20 flex shrink-0 flex-col justify-between p-2 md:top-4 md:h-[calc(100vh-2rem)] md:w-56 md:p-4"
      aria-label="HQ navigation"
    >
      <div className="min-w-0">
        <div className="hidden px-1 md:mb-6 md:block">
          <div className="hq-eyebrow">Perpetual Core</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>
            HQ
          </div>
        </div>
        <nav className="hq-nav flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="hq-focusable flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--hq-panel-2)] md:gap-2.5 md:px-2.5"
              style={{ color: 'var(--hq-ink-dim)' }}
            >
              <Icon className="shrink-0" />
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="hidden items-center justify-between border-t px-1 pt-3 md:flex" style={{ borderColor: 'var(--hq-border)' }}>
        <span className="truncate text-xs" style={{ color: 'var(--hq-ink-dim)' }} title={ownerEmail}>
          {ownerEmail}
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
