/**
 * RFP Discovery — Curated Corporate and Bank Programs
 *
 * Refreshes official-page curated records for corporate foundation and
 * bank/CRA-aligned grant programs. These are program-intelligence records,
 * not third-party scraped grant listings.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  isCuratedIngestSource,
  runCuratedIngest,
  type CuratedIngestResult,
  type CuratedSourceName,
} from "@/lib/rfp/ingest/curated-programs";
import { scoreNewOpportunitiesForAllActiveOrgs } from "@/lib/rfp/scoring/recompute";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_NAME = "rfp-discovery-curated";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

function parseRequestedSources(request: NextRequest): {
  rawSources: string[];
  validSources: CuratedSourceName[];
  invalidSources: string[];
} {
  const raw =
    request.nextUrl.searchParams.get("source") ??
    request.nextUrl.searchParams.get("sources") ??
    "";
  const rawSources = raw
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);
  const validSources: CuratedSourceName[] = [];
  const invalidSources: string[] = [];

  for (const source of rawSources) {
    if (isCuratedIngestSource(source)) validSources.push(source);
    else invalidSources.push(source);
  }

  return {
    rawSources,
    validSources: [...new Set(validSources)],
    invalidSources,
  };
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const { rawSources, validSources, invalidSources } =
    parseRequestedSources(request);

  if (invalidSources.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid curated source",
        invalid_sources: invalidSources,
      },
      { status: 400 },
    );
  }

  try {
    const results = await runCuratedIngest({
      sources: validSources.length > 0 ? validSources : undefined,
    });
    const totals = results.reduce(
      (acc, row) => {
        acc.fetched += row.fetched;
        acc.upserted += row.upserted;
        acc.errors += row.errors.length;
        return acc;
      },
      { fetched: 0, upserted: 0, errors: 0 },
    );

    const upsertedIds = results.flatMap((row) => row.upserted_ids);
    let scored: { scored: number; orgs: number } | { error: string } = {
      scored: 0,
      orgs: 0,
    };
    try {
      scored = await scoreNewOpportunitiesForAllActiveOrgs(upsertedIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[rfp-discovery-curated] scoring failed:", message);
      scored = { error: message };
    }

    const duration_ms = Date.now() - startedAt;
    const scoringFailed = "error" in scored;
    const completedWithoutErrors = totals.errors === 0 && !scoringFailed;
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: duration_ms,
      status: completedWithoutErrors ? "success" : "warning",
      result: {
        total_fetched: totals.fetched,
        total_upserted: totals.upserted,
        total_errors: totals.errors,
        requested_sources: rawSources.length > 0 ? rawSources : null,
        scored: "scored" in scored ? scored.scored : null,
        scoring_error: "error" in scored ? scored.error.slice(0, 200) : null,
        sources: results.map((row: CuratedIngestResult) => ({
          source: row.source,
          fetched: row.fetched,
          upserted: row.upserted,
          errors: row.errors.length,
        })),
      },
      errors:
        totals.errors > 0 || scoringFailed
          ? {
              sources: results
                .filter((row) => row.errors.length > 0)
                .map((row) => ({
                  source: row.source,
                  errors: row.errors.slice(0, 5),
                })),
              scoring: "error" in scored ? scored.error.slice(0, 200) : null,
            }
          : null,
    });

    return NextResponse.json({
      ok: completedWithoutErrors,
      duration_ms,
      results,
      scored,
      totals,
      requested_sources: rawSources.length > 0 ? rawSources : null,
      warning:
        completedWithoutErrors
          ? null
          : "Curated ingest completed with source or scoring errors. See results and cron log for details.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await logRfpCronExecution({
      cronName: CRON_NAME,
      durationMs: Date.now() - startedAt,
      status: "error",
      errors: { message: message.slice(0, 200) },
    });
    console.error("[rfp-discovery-curated] fatal:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "curated_ingest_failed",
        message,
        duration_ms: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isAuthorized(request)) return runCron(request);
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed. Use authenticated GET or POST." }),
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
        "Content-Type": "application/json",
      },
    },
  );
}
