import type { Capability, Finding, OpsCtx } from './types';
import { worstSeverity } from './types';
import { createManagementExecutor } from './executor';
import { writeFindings } from './writeback';

/**
 * The runner — the "RUNNER EXECUTES" box from the VAULT loop.
 *
 * Given a capability, it: builds a context (real Management API executor + clock),
 * runs the capability, persists findings to the vault as canonical markdown, and
 * returns a summary. Triggered three ways, all through this one function:
 *   - headless CLI       (scripts/ops/run.ts)
 *   - a Vercel cron route (app/api/cron/ops-sweep) — later
 *   - a Command Deck tile / voice intent           — later
 */
export interface RunResult {
  capabilityId: string;
  findings: Finding[];
  worst: ReturnType<typeof worstSeverity>;
  reportPath: string;
  ranAt: string;
}

export async function runCapability(cap: Capability, ctx?: Partial<OpsCtx>): Promise<RunResult> {
  const now = ctx?.now ?? new Date().toISOString();
  const runSql = ctx?.runSql ?? createManagementExecutor();
  const findings = await cap.run({ runSql, now });
  const reportPath = await writeFindings(cap, findings, now);
  return {
    capabilityId: cap.id,
    findings,
    worst: worstSeverity(findings),
    reportPath,
    ranAt: now,
  };
}
