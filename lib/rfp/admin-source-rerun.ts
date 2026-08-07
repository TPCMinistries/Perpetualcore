import {
  isFederalIngestSource,
  runFederalIngest,
  type IngestRunResult,
} from "@/lib/rfp/ingest/run";
import {
  isStateCityIngestSource,
  runStateCityIngest,
  type StateCityIngestResult,
  type StateCitySourceName,
} from "@/lib/rfp/ingest/run-state-city";
import {
  isCuratedIngestSource,
  runCuratedIngest,
  type CuratedIngestResult,
  type CuratedSourceName,
} from "@/lib/rfp/ingest/curated-programs";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import { scoreMissingOpportunitiesForAllActiveOrgsNoAi } from "@/lib/rfp/scoring/recompute";

export type ManualSourceRerunKind = "federal" | "state_city" | "curated";

export interface ManualSourceRerunResult {
  source: string;
  kind: ManualSourceRerunKind;
  fetched: number;
  upserted: number;
  errors: number;
  scored: number | null;
  scoring_error: string | null;
  duration_ms: number;
}

export function canManualRerunSource(source: string): boolean {
  return (
    isFederalIngestSource(source) ||
    isStateCityIngestSource(source) ||
    isCuratedIngestSource(source)
  );
}

function totals(
  rows: Array<
    Pick<
      StateCityIngestResult | CuratedIngestResult,
      "fetched" | "upserted" | "errors"
    >
  >,
): { fetched: number; upserted: number; errors: number } {
  return rows.reduce(
    (acc, row) => {
      acc.fetched += row.fetched;
      acc.upserted += row.upserted;
      acc.errors += row.errors.length;
      return acc;
    },
    { fetched: 0, upserted: 0, errors: 0 },
  );
}

export async function rerunRfpSource(
  source: string,
): Promise<ManualSourceRerunResult> {
  const startedAt = Date.now();

  if (isFederalIngestSource(source)) {
    const results = await runFederalIngest({ sources: [source] });
    return finalizeSourceRerun(source, "federal", startedAt, results);
  }

  if (isStateCityIngestSource(source)) {
    const results = await runStateCityIngest({
      sources: [source as StateCitySourceName],
    });
    return finalizeSourceRerun(source, "state_city", startedAt, results);
  }

  if (isCuratedIngestSource(source)) {
    const results = await runCuratedIngest({
      sources: [source as CuratedSourceName],
    });
    return finalizeSourceRerun(source, "curated", startedAt, results);
  }

  throw new Error(`unsupported_source:${source}`);
}

async function finalizeSourceRerun(
  source: string,
  kind: ManualSourceRerunKind,
  startedAt: number,
  results: IngestRunResult | StateCityIngestResult[] | CuratedIngestResult[],
): Promise<ManualSourceRerunResult> {
  if (!Array.isArray(results)) {
    throw new Error(`unsupported_source:${source}`);
  }
  const aggregate = totals(results);
  const upsertedIds = results.flatMap((row) => row.upserted_ids);

  let scored: number | null = 0;
  let scoringError: string | null = null;
  try {
    const scoreResult =
      await scoreMissingOpportunitiesForAllActiveOrgsNoAi(upsertedIds);
    scored = scoreResult.scored;
  } catch (err) {
    scoringError = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    scored = null;
  }

  const duration_ms = Date.now() - startedAt;
  const hasErrors = aggregate.errors > 0 || scoringError !== null;
  await logRfpCronExecution({
    cronName: `rfp-manual-source-rerun:${source}`,
    durationMs: duration_ms,
    status: hasErrors ? "warning" : "success",
    result: {
      source,
      kind,
      fetched: aggregate.fetched,
      upserted: aggregate.upserted,
      scored,
    },
    errors: hasErrors
      ? {
          source_errors: results.flatMap((row) =>
            row.errors.slice(0, 5).map((error) => ({
              source: row.source,
              error,
            })),
          ),
          scoring: scoringError,
        }
      : null,
  });

  return {
    source,
    kind,
    fetched: aggregate.fetched,
    upserted: aggregate.upserted,
    errors: aggregate.errors,
    scored,
    scoring_error: scoringError,
    duration_ms,
  };
}
