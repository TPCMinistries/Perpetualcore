import {
  isFederalIngestSource,
  runFederalIngest,
  type IngestRunResult,
} from "@/lib/rfp/ingest/run";
import {
  isStateCityIngestSource,
  runStateCityIngest,
  type StateCityIngestResult,
} from "@/lib/rfp/ingest/run-state-city";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import { scoreNewOpportunitiesForAllActiveOrgs } from "@/lib/rfp/scoring/recompute";

export type ManualSourceRerunKind = "federal" | "state_city";

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
  return isFederalIngestSource(source) || isStateCityIngestSource(source);
}

function totals(
  rows: Array<Pick<StateCityIngestResult, "fetched" | "upserted" | "errors">>,
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
  const kind: ManualSourceRerunKind = isFederalIngestSource(source)
    ? "federal"
    : "state_city";

  if (!canManualRerunSource(source)) {
    throw new Error(`unsupported_source:${source}`);
  }

  const results: IngestRunResult | StateCityIngestResult[] =
    kind === "federal"
      ? await runFederalIngest({ sources: [source] })
      : await runStateCityIngest({ sources: [source] });
  const aggregate = totals(results);
  const upsertedIds = results.flatMap((row) => row.upserted_ids);

  let scored: number | null = 0;
  let scoringError: string | null = null;
  try {
    const scoreResult =
      await scoreNewOpportunitiesForAllActiveOrgs(upsertedIds);
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
