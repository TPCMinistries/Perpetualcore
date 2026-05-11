/**
 * Phase 05-05 — Quick Import shared types.
 *
 * `ImportJob` and `ImportStep` are split into this file so the Redis-backed
 * `job-store.ts` can import them without pulling in `run.ts` (which would
 * create a circular dependency: run.ts uses job-store.ts, and job-store.ts
 * uses the ImportJob shape).
 */

/**
 * The four user-visible progress steps + two terminal states. The UI strip
 * (`QuickImportBar`) renders these as 4 dots; `done` flips the last dot to
 * a check; `error` switches to the error terminal state.
 */
export type ImportStep =
  | "fetching"
  | "parsing"
  | "scoring"
  | "done"
  | "error";

/** Cross-lambda persistent job state. Stored in Upstash Redis only. */
export interface ImportJob {
  jobId: string;
  userId: string;
  orgId: string;
  url: string;
  step: ImportStep;
  status: "in_progress" | "success" | "failure";
  error?: string;
  /** Opportunity id of the row this import created (set when scoring completes). */
  opp_id?: string;
  /** True when extraction confidence was below 'high' — feed row shows 'Needs review'. */
  needs_review?: boolean;
  created_at: string;
  updated_at: string;
}
