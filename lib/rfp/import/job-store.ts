/**
 * Phase 05-05 — Quick Import: Upstash Redis-backed job store.
 *
 * SINGLE SOURCE OF TRUTH for ImportJob state across Vercel lambda
 * invocations. POST /api/rfp/quick-import writes the initial job state
 * here; the background runner (`run.ts`) advances it through
 * fetching → parsing → scoring → done; GET /api/rfp/quick-import/[jobId]/status
 * reads it.
 *
 * NO MODULE-SCOPE MAP FALLBACK — by design.
 *   A Map<string, ImportJob> would not survive across lambdas: the POST and
 *   GET routes can land on different Node instances, the GET would see no
 *   entry, return 404, and the user would have no way to know whether their
 *   import succeeded. That breaks Success Criterion 5 in the plan.
 *
 *   If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are absent at
 *   module load, this file throws. That is intentional — Quick Import
 *   should not silently degrade.
 *
 * Construction pattern mirrors `lib/rate-limit/index.ts:48-57` (same
 * `.trim()` defensiveness, same `@upstash/redis` Redis class).
 *
 * For horizontal scaling beyond MVP volume (persistent jobs across
 * deploys, history, retries), see `deferred-items.md`
 * QUICK-IMPORT-QUEUE-DURABILITY.
 */

import { Redis } from "@upstash/redis";
import type { ImportJob } from "./types";

/** Job TTL in seconds — 1 hour. After this the polling endpoint returns 404. */
export const JOB_TTL_SECONDS = 60 * 60;

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    throw new Error(
      "Quick Import requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. " +
        "See lib/rate-limit/index.ts for the same client construction pattern. " +
        "Module-scope Map fallback is intentionally NOT provided because state " +
        "would not survive across Vercel lambda invocations."
    );
  }
  return new Redis({ url, token });
}

// Lazy singleton — defer construction until first use so that:
//   (a) build-time imports of files that re-export from here don't fail
//       when env vars are absent (e.g. local `next build` without prod env);
//   (b) the error is surfaced at the first runtime call site, where it can
//       be caught by the API route's error handler and returned as a 503.
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = getRedis();
  return _redis;
}

function jobKey(jobId: string): string {
  return `rfp:import:${jobId}`;
}

/**
 * Persist a job to Redis with TTL. The same TTL is set on every write so
 * an in-progress job that gets repeatedly advanced doesn't expire mid-flight.
 */
export async function writeJob(jobId: string, job: ImportJob): Promise<void> {
  // We serialize ourselves to keep behaviour predictable across Upstash REST
  // versions — some versions auto-stringify objects, some don't.
  await redis().set(jobKey(jobId), JSON.stringify(job), {
    ex: JOB_TTL_SECONDS,
  });
}

/**
 * Read a job from Redis. Returns null when the key has expired or never
 * existed.
 */
export async function readJob(jobId: string): Promise<ImportJob | null> {
  const raw = await redis().get(jobKey(jobId));
  if (raw == null) return null;
  // Upstash REST may return a parsed object (when set as JSON) OR the raw
  // string we wrote — handle both shapes defensively.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ImportJob;
    } catch (e) {
      console.error(
        `[quick-import/job-store] failed to parse job ${jobId}: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      return null;
    }
  }
  return raw as ImportJob;
}
