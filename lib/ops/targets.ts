import type { DbTarget } from './types';

/**
 * The ops targets — every Supabase DB in the ecosystem.
 *
 * Source of truth is the global CLAUDE.md "Supabase Database Architecture" table.
 * Refs that aren't wired yet are `null` → the runner SKIPS them (reported as
 * info, never an error). Add a ref here the moment a project gets connected.
 *
 * NOTE: two refs below come from memory, not the core CLAUDE.md table, because
 * the global table is known to be incomplete/wrong in places:
 *   - lorenzodc uses its own project (memory: lorenzodc-supabase-project)
 *   - Streams of Grace has its OWN project (memory: streams-of-grace-db)
 */
export const TARGETS: DbTarget[] = [
  { key: 'brain',      label: 'LDC Brain AI',          projectRef: 'hgxxxmtfmvguotkowxbu', hasUserData: false, tier: 'core' },
  { key: 'uplift-ops', label: 'Uplift Opps',           projectRef: 'fbgmkqpxaaxbndhdbpzt', hasUserData: true,  tier: 'core' },
  { key: 'workforce',  label: 'Uplift-KBCC-Workforce', projectRef: 'mputexoycdvahgjbpfbi', hasUserData: true,  tier: 'main' },
  { key: 'academy',    label: 'IHA Academy',           projectRef: 'kvhtltaxrbwuhfcjhroz', hasUserData: true,  tier: 'main' },
  { key: 'tpc',        label: 'TPC Ministries',        projectRef: 'naulwwnzrznslvhhxfed', hasUserData: true,  tier: 'ancillary' },
  { key: 'sog',        label: 'Streams of Grace',      projectRef: 'triknolzflhhysfcncqk', hasUserData: true,  tier: 'ancillary' },
  { key: 'raex',       label: "Richardson's Anguilla", projectRef: 'batyecvdjjacvzebcyiv', hasUserData: true,  tier: 'client' },
  { key: 'lorenzodc',  label: 'LorenzoDC',             projectRef: 'ggczmbeadsxlwkaqxpaf', hasUserData: true,  tier: 'main' },
  { key: 'pc-studios', label: 'PC Studios (Scribe/Codex)', projectRef: 'fhhixphngijwvfckusrq', hasUserData: true, tier: 'core' },
  // Not yet connected — skipped by the runner until a ref is added:
  { key: 'tmwyb',      label: 'TMWYB',                 projectRef: null, hasUserData: true, tier: 'main' },
  { key: 'hedge',      label: 'AI Hedge Fund Engine',  projectRef: null, hasUserData: true, tier: 'main' },
];

export const CONNECTED_TARGETS = TARGETS.filter((t) => t.projectRef !== null);
