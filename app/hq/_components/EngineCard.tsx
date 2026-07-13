import type { EngineCard as EngineCardData, EngineStatus } from '@/lib/hq/engines';
import { StatusChip, type ChipTone } from './StatusChip';

const CHIP_LABEL: Record<EngineStatus, string> = {
  live: 'Live',
  hold: 'Hold',
  frozen: 'Frozen',
  unknown: 'Unknown',
};
const CHIP_TONE: Record<EngineStatus, ChipTone> = {
  live: 'live',
  hold: 'hold',
  frozen: 'frozen',
  unknown: 'unknown',
};

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="hq-eyebrow mb-1 text-[10px]">{label}</div>
      <div className="hq-tabular text-sm font-medium" style={{ color: value ? 'var(--hq-ink)' : 'var(--hq-ink-dim)' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export function EngineCard({ card }: { card: EngineCardData }) {
  return (
    <div className="hq-panel flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold" style={{ color: 'var(--hq-ink)' }}>
          {card.label}
        </div>
        <StatusChip tone={CHIP_TONE[card.status]} label={CHIP_LABEL[card.status]} />
      </div>
      {card.reasoning && (
        <p className="text-xs" style={{ color: 'var(--hq-ink-dim)' }}>
          {card.reasoning}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: 'var(--hq-border)' }}>
        <Metric label="MRR" value={card.mrr} />
        <Metric label="7d Gross" value={card.gross7d} />
        <Metric label="Lifetime" value={card.lifetime} />
      </div>
    </div>
  );
}
