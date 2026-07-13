import type { EngineCall, PnlEngineRow } from './parse';

/**
 * The seven engines the Board tracks, in display order. Fixed roster (not
 * derived from the snapshot) so the Board always shows all seven — with
 * "unknown" chips — even before the strategist or portfolio-pnl have ever run.
 */
export const ENGINE_ROSTER = [
  { id: 'sentinel', label: 'Sentinel' },
  { id: 'janice', label: 'Janice' },
  { id: 'rfp', label: 'RFP Engine' },
  { id: 'sage', label: 'Sage SaaS' },
  { id: 'academy', label: 'Academy' },
  { id: 'lorenzodc', label: 'lorenzodc' },
  { id: 'streams', label: 'Streams of Grace' },
] as const;

export type EngineStatus = 'live' | 'hold' | 'frozen' | 'unknown';

export interface EngineCard {
  id: string;
  label: string;
  status: EngineStatus;
  reasoning: string | null;
  mrr: string | null;
  gross7d: string | null;
  lifetime: string | null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyFind<T extends { engine: string }>(items: T[], label: string): T | null {
  const target = normalize(label);
  return items.find((i) => {
    const n = normalize(i.engine);
    return n.includes(target) || target.includes(n);
  }) ?? null;
}

const STATUS_BY_CALL: Record<string, EngineStatus> = { DOUBLE: 'live', HOLD: 'hold', KILL: 'frozen' };

/** Cross-references the fixed engine roster against the strategist's calls and the P&L per-engine table. */
export function buildEngineCards(calls: EngineCall[], pnlRows: PnlEngineRow[]): EngineCard[] {
  return ENGINE_ROSTER.map((engine) => {
    const call = fuzzyFind(calls, engine.label);
    const row = fuzzyFind(pnlRows, engine.label);
    return {
      id: engine.id,
      label: engine.label,
      status: call?.call ? STATUS_BY_CALL[call.call] ?? 'unknown' : 'unknown',
      reasoning: call?.reasoning || null,
      mrr: row?.mrr ?? null,
      gross7d: row?.gross7d ?? null,
      lifetime: row?.lifetime ?? null,
    };
  });
}
