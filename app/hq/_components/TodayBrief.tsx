import type { EngineCard } from '@/lib/hq/engines';
import type { Finding } from '@/lib/ops/types';
import { StatusChip } from './StatusChip';

function SummaryCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'good' | 'attention';
}) {
  const valueColor = tone === 'good' ? 'var(--hq-green)' : tone === 'attention' ? 'var(--hq-amber)' : 'var(--hq-ink)';

  return (
    <div className="hq-panel h-full p-4">
      <div className="hq-eyebrow mb-2">{label}</div>
      <div className="hq-tabular text-2xl font-semibold" style={{ color: valueColor }}>
        {value}
      </div>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--hq-ink-dim)' }}>
        {detail}
      </p>
    </div>
  );
}

export function TodayBrief({
  headline,
  openDecisions,
  compliance,
  engines,
}: {
  headline: string | null;
  openDecisions: number;
  compliance: Finding[];
  engines: EngineCard[];
}) {
  const liveEngines = engines.filter((engine) => engine.status === 'live').length;
  const criticalCount = compliance.filter((finding) => finding.severity === 'critical').length;
  const riskCount = compliance.filter((finding) => finding.severity === 'critical' || finding.severity === 'warn').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="hq-command-panel p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusChip tone={openDecisions > 0 ? 'warn' : 'ok'} label={openDecisions > 0 ? 'Action required' : 'Clear'} />
          {criticalCount > 0 && <StatusChip tone="crit" label={`${criticalCount} critical`} />}
        </div>
        <p className="max-w-3xl text-lg font-medium leading-snug sm:text-xl" style={{ color: 'var(--hq-ink)' }}>
          {headline ??
            (openDecisions > 0
              ? `${openDecisions} decision${openDecisions === 1 ? '' : 's'} need your attention. Clear the queue before reviewing reports.`
              : 'No operator headline is available yet. The next ops sweep should publish one.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Decisions"
          value={String(openDecisions)}
          detail={openDecisions > 0 ? 'Approve, snooze, or dismiss the items waiting on you.' : 'Nothing is blocking the operating system.'}
          tone={openDecisions > 0 ? 'attention' : 'good'}
        />
        <SummaryCard
          label="Risk gates"
          value={String(riskCount)}
          detail={riskCount > 0 ? 'Critical and warning-level compliance items need review.' : 'No urgent compliance gates are open.'}
          tone={riskCount > 0 ? 'attention' : 'good'}
        />
        <SummaryCard
          label="Engines live"
          value={`${liveEngines}/${engines.length}`}
          detail="Portfolio lines currently marked DOUBLE by the strategist."
          tone={liveEngines > 0 ? 'good' : 'neutral'}
        />
      </div>
    </div>
  );
}
