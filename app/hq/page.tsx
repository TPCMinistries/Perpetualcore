import { getHqSnapshot } from '@/lib/hq/snapshot';
import { getQueueItems } from '@/lib/hq/queue';
import { getSparkSeries } from '@/lib/hq/metrics';
import { getHqOperationalStatus } from '@/lib/hq/operational-status';
import {
  parsePnlHeadline,
  parsePnlEngineRows,
  parseEngineCalls,
  parseNeedsLorenzo,
  parseMarketingDirectives,
  parseMemoHeadline,
  complianceDueSoon,
} from '@/lib/hq/parse';
import { buildEngineCards } from '@/lib/hq/engines';
import { Section } from './_components/Section';
import { Freshness } from './_components/Freshness';
import { KpiStrip } from './_components/KpiStrip';
import { EngineCard } from './_components/EngineCard';
import { BulletList } from './_components/BulletList';
import { FindingsList } from './_components/FindingsList';
import { HqMarkdown } from './_components/HqMarkdown';
import { MomentsTimeline } from './_components/MomentsTimeline';
import { EmptyState } from './_components/EmptyState';
import { QueueList } from './_components/QueueList';
import { TodayBrief } from './_components/TodayBrief';
import { ReportPanel } from './_components/ReportPanel';
import { OperatingLoop } from './_components/OperatingLoop';
import { SourceHealth, type SourceHealthItem } from './_components/SourceHealth';
import { OutcomeStrip, type OutcomeMetric } from './_components/OutcomeStrip';
import { ActionRunList } from './_components/ActionRunList';

function formatOutcomeValue(value: number, unit: string): string {
  if (unit === 'usd') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === 'percent') return `${value.toLocaleString()}%`;
  if (unit === 'hours') return `${value.toLocaleString()}h`;
  return value.toLocaleString();
}

export default async function HqPage() {
  const [snapshot, queueItems, sparkSeries, operations] = await Promise.all([
    getHqSnapshot(),
    getQueueItems(),
    getSparkSeries(),
    getHqOperationalStatus(),
  ]);

  const headline = parsePnlHeadline(snapshot.pnlMd);
  const engineCalls = parseEngineCalls(snapshot.strategistMemoMd);
  const pnlRows = parsePnlEngineRows(snapshot.pnlMd);
  const engineCards = buildEngineCards(engineCalls, pnlRows);

  const needsLorenzo = parseNeedsLorenzo(snapshot.strategistMemoMd);
  const complianceSoon = complianceDueSoon(snapshot.compliance);
  const marketingDirectives = parseMarketingDirectives(snapshot.strategistMemoMd);
  const memoHeadline = parseMemoHeadline(snapshot.strategistMemoMd);

  const sourceHealth: SourceHealthItem[] = operations.sources.map((source) => ({
    key: source.source_key,
    label: source.display_name,
    state:
      source.status === 'fresh'
        ? 'healthy'
        : source.status === 'error'
          ? 'degraded'
          : source.status,
    lastSuccessAt: source.last_success_at,
    detail:
      source.error_message ??
      (typeof source.metadata.note === 'string' ? source.metadata.note : null),
    localOnly: source.metadata.runtime === 'local',
  }));

  const seenMetrics = new Set<string>();
  const outcomes: OutcomeMetric[] = operations.outcomes.flatMap((metric) => {
    if (seenMetrics.has(metric.metric_key)) return [];
    seenMetrics.add(metric.metric_key);
    return [{
      key: metric.metric_key,
      label: metric.metric_name,
      value: formatOutcomeValue(metric.value, metric.unit),
      detail: metric.engine_key ? `${metric.engine_key} · measured ${new Date(metric.measured_at).toLocaleDateString('en-US')}` : `Measured ${new Date(metric.measured_at).toLocaleDateString('en-US')}`,
      direction:
        metric.direction === 'increase'
          ? 'positive' as const
          : metric.direction === 'decrease'
            ? 'negative' as const
            : 'neutral' as const,
    }];
  }).slice(0, 8);

  return (
    <div className="pb-16">
      <div className="mb-8 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: 'var(--hq-border)' }}>
        <div>
          <div className="hq-eyebrow mb-1">Owner operating system</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: 'var(--hq-ink)' }}>
            Perpetual Core HQ
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--hq-ink-dim)' }}>
            Decide, unblock, and move the portfolio forward.
          </p>
        </div>
        <Freshness generatedAt={snapshot.generatedAt} />
      </div>

      <Section id="today" eyebrow="Today" title="What needs your attention">
        <TodayBrief
          headline={memoHeadline}
          openDecisions={queueItems.length || needsLorenzo.length}
          compliance={complianceSoon}
          engines={engineCards}
        />
      </Section>

      <Section id="queue" eyebrow="Decide" title="Needs Lorenzo">
        <div className="flex flex-col gap-6">
          <div>
            {queueItems.length > 0 ? (
              <QueueList items={queueItems} />
            ) : (
              <BulletList items={needsLorenzo} emptyLabel="Nothing is waiting on you." />
            )}
          </div>
          {complianceSoon.length > 0 && (
            <div>
              <div className="hq-eyebrow mb-2 text-[10px]">Deadline exceptions</div>
              <FindingsList findings={complianceSoon} emptyLabel="Nothing due within 7 days." />
            </div>
          )}
        </div>
      </Section>

      <Section id="execution" eyebrow="Execute" title="Operating loop">
        <div className="flex flex-col gap-6">
          <OperatingLoop
            counts={{
              proposed: operations.queueCounts.open ?? 0,
              approved: operations.queueCounts.approved ?? 0,
              running: operations.executionStateCounts.running ?? 0,
              verify: operations.executionStateCounts.succeeded ?? 0,
              completed: operations.runCounts.succeeded ?? 0,
              failed: (operations.runCounts.failed ?? 0) + (operations.runCounts.blocked ?? 0),
            }}
          />
          <div>
            <div className="hq-eyebrow mb-2 text-[10px]">Recent action history</div>
            <ActionRunList
              runs={operations.recentRuns.map((run) => ({
                id: run.id,
                actionKey: run.action_key,
                status: run.status,
                queuedAt: run.queued_at,
                finishedAt: run.finished_at,
                errorMessage: run.error_message,
              }))}
            />
          </div>
        </div>
      </Section>

      <Section id="sources" eyebrow="Observe" title="Source health">
        <SourceHealth items={sourceHealth} />
      </Section>

      <Section id="outcomes" eyebrow="Verify" title="Measured outcomes">
        <OutcomeStrip metrics={outcomes} />
      </Section>

      <Section id="board" eyebrow="Board" title="Portfolio at a glance">
        <div className="flex flex-col gap-6">
          <KpiStrip headline={headline} spark={sparkSeries} revenue={snapshot.revenue2026} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {engineCards.map((card) => (
              <EngineCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </Section>

      <Section id="strategy" eyebrow="Strategy" title="Operator memo & decision ledger">
        <div className="flex flex-col gap-6">
          <ReportPanel title="Open the full strategist memo" defaultOpen={!memoHeadline}>
            {snapshot.strategistMemoMd ? (
              <HqMarkdown content={snapshot.strategistMemoMd} />
            ) : (
              <EmptyState label="No strategist memo yet — waiting for the next weekly sweep." />
            )}
          </ReportPanel>
          <ReportPanel title="Open the recent decision ledger">
            {snapshot.decisionLedgerTail ? (
              <HqMarkdown content={snapshot.decisionLedgerTail} />
            ) : (
              <EmptyState label="No decision-ledger entries yet." />
            )}
          </ReportPanel>
          {marketingDirectives.length > 0 && (
            <div>
              <div className="hq-eyebrow mb-2 text-[10px]">This week&apos;s autonomous reallocation</div>
              <BulletList items={marketingDirectives} />
            </div>
          )}
        </div>
      </Section>

      <Section id="marketing" eyebrow="Marketing" title="Content calendar & moments">
        <div className="flex flex-col gap-6">
          <ReportPanel title="Open the content calendar">
            {snapshot.contentCalendarMd ? (
              <HqMarkdown content={snapshot.contentCalendarMd} />
            ) : (
              <EmptyState label="No content calendar yet." />
            )}
          </ReportPanel>
          <div>
            <div className="hq-eyebrow mb-2 text-[10px]">Recent moments</div>
            <MomentsTimeline moments={snapshot.momentsTail} />
          </div>
        </div>
      </Section>

      <Section id="compliance" eyebrow="Compliance" title="Deadlines & regulatory gates">
        <div className="flex flex-col gap-6">
          <FindingsList findings={snapshot.compliance} emptyLabel="No compliance findings yet." />
          <div>
            <div className="hq-eyebrow mb-2 text-[10px]">Revenue probes (latest run)</div>
            <ReportPanel title="Open the latest revenue-probe report">
              {snapshot.probesMd ? (
                <HqMarkdown content={snapshot.probesMd} />
              ) : (
                <EmptyState label="No revenue-probes report yet — runs weekly." />
              )}
            </ReportPanel>
          </div>
        </div>
      </Section>
    </div>
  );
}
