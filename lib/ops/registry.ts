import type { Capability } from './types';
import { rlsAudit } from './capabilities/rls-audit';
import { revenuePulse } from './capabilities/revenue-pulse';
import { pipeline } from './capabilities/pipeline';

/**
 * The Command Deck, as data. Every tile / voice-intent / cron job resolves a
 * capability by id from here. Adding a new skill to the agent = add its
 * Capability to this array. Nothing else changes — runner, write-back, and the
 * (future) HUD all read from this registry.
 */
export const CAPABILITIES: Capability[] = [
  rlsAudit,
  revenuePulse,
  pipeline,
  // repo-sync, deliverability, env-check, ... land here as they're built.
];

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}
