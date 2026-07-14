import { getHqSnapshot } from '@/lib/hq/snapshot';
import { getQueueItems } from '@/lib/hq/queue';
import { getSparkSeries } from '@/lib/hq/metrics';
import {
  parsePnlHeadline,
  parsePnlEngineRows,
  parseEngineCalls,
  parseNeedsLorenzo,
  parseMarketingDirectives,
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

export default async function HqPage() {
  const snapshot = await getHqSnapshot();
  const queueItems = await getQueueItems();
  const sparkSeries = await getSparkSeries();

  const headline = parsePnlHeadline(snapshot.pnlMd);
  const engineCalls = parseEngineCalls(snapshot.strategistMemoMd);
  const pnlRows = parsePnlEngineRows(snapshot.pnlMd);
  const engineCards = buildEngineCards(engineCalls, pnlRows);

  const needsLorenzo = parseNeedsLorenzo(snapshot.strategistMemoMd);
  const complianceSoon = complianceDueSoon(snapshot.compliance);
  const marketingDirectives = parseMarketingDirectives(snapshot.strategistMemoMd);

  return (
    <div className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="hq-eyebrow">Command Center</div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--hq-ink)' }}>
            Perpetual Core HQ
          </h1>
        </div>
        <Freshness generatedAt={snapshot.generatedAt} />
      </div>

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

      <Section id="queue" eyebrow="Queue" title="Needs Lorenzo">
        <div className="flex flex-col gap-6">
          <div>
            {queueItems.length > 0 ? (
              <>
                <div className="hq-eyebrow mb-2 text-[10px]">Open items</div>
                <QueueList items={queueItems} />
              </>
            ) : (
              <>
                <div className="hq-eyebrow mb-2 text-[10px]">From the strategist memo</div>
                <BulletList items={needsLorenzo} emptyLabel="Nothing queued." />
              </>
            )}
          </div>
          <div>
            <div className="hq-eyebrow mb-2 text-[10px]">Compliance due within 7 days</div>
            <FindingsList findings={snapshot.compliance ? complianceSoon : null} emptyLabel="Nothing due within 7 days." />
          </div>
        </div>
      </Section>

      <Section id="strategy" eyebrow="Strategy" title="Operator memo & decision ledger">
        <div className="flex flex-col gap-6">
          <div className="hq-panel p-5">
            {snapshot.strategistMemoMd ? (
              <HqMarkdown content={snapshot.strategistMemoMd} />
            ) : (
              <EmptyState label="No strategist memo yet — waiting for the next weekly sweep." />
            )}
          </div>
          <div>
            <div className="hq-eyebrow mb-2 text-[10px]">Decision ledger (recent)</div>
            <div className="hq-panel p-5">
              {snapshot.decisionLedgerTail ? (
                <HqMarkdown content={snapshot.decisionLedgerTail} />
              ) : (
                <EmptyState label="No decision-ledger entries yet." />
              )}
            </div>
          </div>
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
          <div className="hq-panel p-5">
            {snapshot.contentCalendarMd ? (
              <HqMarkdown content={snapshot.contentCalendarMd} />
            ) : (
              <EmptyState label="No content calendar yet." />
            )}
          </div>
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
            <div className="hq-panel p-5">
              {snapshot.probesMd ? (
                <HqMarkdown content={snapshot.probesMd} />
              ) : (
                <EmptyState label="No revenue-probes report yet — runs weekly." />
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
