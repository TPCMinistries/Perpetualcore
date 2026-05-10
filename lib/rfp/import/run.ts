/**
 * Phase 05-05 — Quick Import: orchestrator.
 *
 * `runQuickImport({ url, orgId, userId, jobId })` advances a single
 * user-submitted URL through four steps:
 *
 *   fetching → parsing → scoring → done
 *
 * Each step's progress is written to Upstash Redis via `job-store.ts` —
 * NEVER to a module-scope Map. The POST route writes the initial job state,
 * spawns this function fire-and-forget, and returns 202 immediately. The
 * GET status route reads from the same Redis key. Lambdas don't share
 * memory, so Redis is the only durable cross-invocation channel.
 *
 *   See `lib/rfp/import/job-store.ts` for the explanation of why no Map
 *   fallback exists.
 *
 * Never throws — every error path is captured into the job's `error`
 * field and the job is moved to `step='error', status='failure'`. The
 * caller (`route.ts`) treats a thrown error as a bug, not a normal flow.
 *
 * "Save raw + flag" contract from 05-CONTEXT.md:
 *   When extraction confidence is below 'high' OR the title is missing,
 *   we still upsert the opportunity with `needs_review = true`. The user
 *   completes missing fields from the detail pane. This is the explicit
 *   "never throw away user intent" rule.
 *
 * PDF / DOCX URLs flow through the same path — no special routing — per
 * 05-CONTEXT.md. They do NOT enter the vault; vault upload is a separate
 * Phase 6 action.
 *
 * Source-id stability:
 *   The opportunity's `source_id` is a SHA-256 hash of the canonical URL.
 *   Re-importing the same URL hits the (source, source_id) UNIQUE
 *   constraint on rfp_opportunities and refreshes the row instead of
 *   creating a duplicate.
 */

import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { scoreNewOpportunitiesForAllActiveOrgs } from "@/lib/rfp/scoring/recompute";
import { fetchUrlContent, QuickImportFetchError } from "./fetch-url";
import { extractOpportunityFromText } from "./extract";
import type { ExtractionResult } from "./extract";
import { writeJob } from "./job-store";
import type { ImportJob } from "./types";

// Re-export so consumers can import everything from one path.
export type { ImportJob, ImportStep } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashUrl(url: string): string {
  // SHA-256 truncated to 32 hex chars — collision-resistant for our volume.
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Untyped admin handle for rfp_* tables. Matches the pattern in
 * lib/rfp/scoring/recompute.ts and lib/rfp/ingest/run-state-city.ts:
 * `lib/supabase/database.types.ts` doesn't reflect the rfp_* schema yet
 * (regen deferred to post-Phase-5). Narrowing through `{ from: (table) => any }`
 * keeps the generated `Database` type from instantiating excessively.
 */
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

async function advance(
  job: ImportJob,
  patch: Partial<ImportJob>
): Promise<ImportJob> {
  const next: ImportJob = { ...job, ...patch, updated_at: nowIso() };
  await writeJob(next.jobId, next);
  return next;
}

// ── Mapping extraction output to OpportunityInput ────────────────────────────

/**
 * Convert the extractor's loose `Partial` shape into a row we can normalize
 * and upsert. `source='foundation_url'` matches the schema enum (see
 * `lib/rfp/ingest/normalize.ts`).
 *
 * NOTE: `OpportunityInput.source` is typed against `RfpSourceName`
 * (`sam_gov | grants_gov | simpler_grants | sbir_gov`) and not against the
 * SCHEMA enum (which also includes `foundation_url`, `ny_state`, etc.).
 * The Zod schema in normalize.ts likewise restricts to the four federal
 * keys. Quick Import bypasses `normalizeOpportunity` and writes the row
 * directly with the schema enum — see `buildOpportunityRow` below.
 */
function buildOpportunityRow(args: {
  url: string;
  hostname: string;
  fields: ExtractionResult["fields"];
  needs_review: boolean;
  raw_text_sample: string;
}): {
  source: "foundation_url";
  source_id: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  keywords: string[];
  geo: string | null;
  url: string;
  needs_review: boolean;
  last_seen_at: string;
  raw_json: Record<string, unknown>;
} {
  const { url, hostname, fields, needs_review, raw_text_sample } = args;
  // If the LLM gave us no title, default to a hostname-stamped placeholder
  // so the feed still has SOMETHING to show. The user can edit it from the
  // detail pane.
  const title = fields.title ?? `Imported: ${hostname}`;
  return {
    source: "foundation_url",
    source_id: hashUrl(url),
    title: title.trim().slice(0, 500),
    agency: fields.agency,
    amount_min: fields.amount_min,
    amount_max: fields.amount_max,
    deadline: fields.deadline,
    brief: fields.brief,
    keywords: fields.keywords,
    geo: fields.geo,
    url,
    needs_review,
    last_seen_at: nowIso(),
    raw_json: {
      // Forensics blob — keeps a snapshot of what we saw so the user can
      // re-extract later or debug a parse miss.
      quick_import: {
        extracted_fields: fields,
        text_sample: raw_text_sample.slice(0, 2000),
      },
    },
  };
}

// Note: we deliberately bypass `normalizeOpportunity()` from
// `lib/rfp/ingest/normalize.ts`. That helper's Zod schema restricts `source`
// to the four federal registry keys (`sam_gov`, `grants_gov`,
// `simpler_grants`, `sbir_gov`) and would reject `foundation_url`. The
// schema enum on `rfp_opportunities.source` allows `foundation_url` (added
// in the Phase 4 migration); we write the row directly with that value.
// All cleanup of free-form fields happens in `buildOpportunityRow`.

/**
 * Upsert the row into rfp_opportunities and return the new/refreshed id.
 * Conflict key is `(source, source_id)` per the Phase 4 schema migration.
 */
async function upsertOpportunity(
  row: ReturnType<typeof buildOpportunityRow>
): Promise<string | null> {
  const supabase = rfpAdmin();
  const { data, error } = await supabase
    .from("rfp_opportunities")
    .upsert(row as unknown as never, {
      onConflict: "source,source_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error(
      "[quick-import/run] upsertOpportunity failed:",
      error?.message ?? "no row returned"
    );
    return null;
  }
  return (data as { id: string }).id;
}

// ── Public entry point ───────────────────────────────────────────────────────

export interface RunQuickImportArgs {
  url: string;
  orgId: string;
  userId: string;
  jobId: string;
}

/**
 * Orchestrate one Quick Import. Never throws — terminal failures are
 * recorded in the job's `error` field and the job is moved to
 * `step='error', status='failure'`.
 *
 * Steps:
 *   1. fetching  — `fetch-url.ts` pulls bytes, returns plain text.
 *   2. parsing   — `extract.ts` asks Claude for structured fields.
 *      (Normalize + upsert happens at the end of parsing.)
 *   3. scoring   — `scoreNewOpportunitiesForAllActiveOrgs([opp_id])` from
 *      Plan 05-03 scores the new row against every active org's capture
 *      profile.
 *   4. done      — terminal success.
 *
 * The fire-and-forget caller pattern (`void runQuickImport(...)`) is the
 * Next 14 equivalent of Next 15's `after()` — Plan 05-03 uses the same
 * pattern for `recomputeAllForOrg`. See `app/api/rfp/quick-import/route.ts`
 * for the dispatch site.
 */
export async function runQuickImport(args: RunQuickImportArgs): Promise<void> {
  const { url, orgId, userId, jobId } = args;
  const created_at = nowIso();
  let job: ImportJob = {
    jobId,
    userId,
    orgId,
    url,
    step: "fetching",
    status: "in_progress",
    created_at,
    updated_at: created_at,
  };

  // ── Step 1: fetching ────────────────────────────────────────────────────
  await writeJob(jobId, job);
  let fetched;
  try {
    fetched = await fetchUrlContent(url);
  } catch (e) {
    const message =
      e instanceof QuickImportFetchError
        ? `${e.code}: ${e.message}`
        : e instanceof Error
        ? e.message
        : String(e);
    await advance(job, {
      step: "error",
      status: "failure",
      error: message,
    });
    return;
  }

  // ── Step 2: parsing ─────────────────────────────────────────────────────
  job = await advance(job, { step: "parsing" });
  let extraction: ExtractionResult;
  try {
    extraction = await extractOpportunityFromText(fetched.text, url);
  } catch (e) {
    // extract.ts is contracted to never throw, but defense in depth.
    console.error(
      "[quick-import/run] unexpected extract error:",
      e instanceof Error ? e.message : String(e)
    );
    extraction = {
      fields: {
        title: null,
        agency: null,
        amount_min: null,
        amount_max: null,
        deadline: null,
        brief: null,
        keywords: [],
        geo: null,
      },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: null,
    };
  }

  // "Save raw + flag" — needs_review when confidence isn't high OR title
  // is missing. 05-CONTEXT.md explicitly forbids dropping user intent.
  const needs_review =
    extraction.confidence !== "high" || extraction.fields.title === null;

  const row = buildOpportunityRow({
    url,
    hostname: hostOf(url),
    fields: extraction.fields,
    needs_review,
    raw_text_sample: fetched.text,
  });

  const oppId = await upsertOpportunity(row);
  if (!oppId) {
    await advance(job, {
      step: "error",
      status: "failure",
      error: "Failed to persist opportunity row (upsert returned no id).",
      needs_review,
    });
    return;
  }

  // ── Step 3: scoring ─────────────────────────────────────────────────────
  job = await advance(job, { step: "scoring", opp_id: oppId, needs_review });
  try {
    // Plan 05-03 contract: hand the new opp ID to the cross-product scorer
    // so it gets a fit row in rfp_opp_matches for every active org —
    // including the importing user's. Quick-imported opps are surfaced
    // across the network like federal feeds, not scoped to one tenant.
    await scoreNewOpportunitiesForAllActiveOrgs([oppId]);
  } catch (e) {
    // Scoring failure is non-fatal for the user-facing flow (the opp row
    // already landed). Mirror the cron hand-off pattern from 05-03.
    console.error(
      "[quick-import/run] scoring step failed (non-fatal):",
      e instanceof Error ? e.message : String(e)
    );
    // Continue to 'done' so the user sees their row instead of an error.
    // The next nightly recompute or a manual refresh will rescore.
  }

  // ── Step 4: done ────────────────────────────────────────────────────────
  await advance(job, {
    step: "done",
    status: "success",
    opp_id: oppId,
    needs_review,
  });

  // We intentionally do not throw, even on unexpected errors above this point.
  // The job state is the contract; the caller is fire-and-forget. `userId`
  // is persisted onto every job write (line 1 of this function) so the
  // GET status route can enforce caller-owns-the-job at poll time.
}
