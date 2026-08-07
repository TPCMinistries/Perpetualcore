import { describe, expect, it } from "vitest";

import {
  buildStateCityUpsertRows,
  chunkStateCityMutationRows,
  runAdaptiveStateCityMutation,
  selectStateCityScoringCandidateIds,
} from "@/lib/rfp/ingest/run-state-city";

describe("state and city ingest mutation batching", () => {
  it("keeps a California-sized refresh below the database-safe batch size", () => {
    const rows = Array.from({ length: 1_967 }, (_, index) => index);
    const batches = chunkStateCityMutationRows(rows);

    expect(batches).toHaveLength(40);
    expect(Math.max(...batches.map((batch) => batch.length))).toBe(50);
    expect(batches.flat()).toEqual(rows);
  });

  it("rejects invalid batch sizes", () => {
    expect(() => chunkStateCityMutationRows([1], 0)).toThrow(
      "batchSize must be a positive integer"
    );
  });

  it("writes last_seen_at in the upsert row instead of requiring a second pass", () => {
    const lastSeenAt = "2026-07-23T12:00:00.000Z";
    const [row] = buildStateCityUpsertRows(
      [
        {
          source: "ca_grants",
          source_id: "ca-1",
          title: "California grant",
        },
      ],
      lastSeenAt
    );

    expect(row).toMatchObject({
      source: "ca_grants",
      source_id: "ca-1",
      last_seen_at: lastSeenAt,
    });
  });

  it("splits timeout batches 50 to 25 to 12/13 and terminates at the floor", async () => {
    const attemptedSizes: number[] = [];
    const mutation = await runAdaptiveStateCityMutation(
      Array.from({ length: 50 }, (_, index) => index),
      async (batch) => {
        attemptedSizes.push(batch.length);
        return {
          data: null,
          error: {
            code: "57014",
            message: "canceling statement due to statement timeout",
          },
        };
      },
      { retryBaseDelayMs: 0 }
    );

    expect(mutation.error).not.toBeNull();
    expect(mutation.timedOut).toBe(true);
    expect(mutation.failedBatchSize).toBe(12);
    expect(mutation.attempts).toBe(3);
    expect(attemptedSizes).toEqual([50, 25, 12]);
  });

  it("retains successful split progress when a later adaptive batch fails", async () => {
    const mutation = await runAdaptiveStateCityMutation(
      Array.from({ length: 50 }, (_, index) => index),
      async (batch) => {
        if (batch.length >= 25) {
          return {
            data: null,
            error: { message: "statement timeout" },
          };
        }
        if (batch[0] === 0) {
          return {
            data: batch.map((id) => ({ id })),
            error: null,
          };
        }
        return {
          data: null,
          error: { message: "statement timeout" },
        };
      },
      { retryBaseDelayMs: 0 }
    );

    expect(mutation.data.map(({ id }) => id)).toEqual(
      Array.from({ length: 12 }, (_, index) => index)
    );
    expect(mutation.failedBatchSize).toBe(13);
    expect(mutation.attempts).toBe(4);
  });

  it("retries non-timeout failures only to the configured bound", async () => {
    let calls = 0;
    const mutation = await runAdaptiveStateCityMutation(
      [1, 2, 3],
      async () => {
        calls += 1;
        return {
          data: null,
          error: { message: "temporary gateway failure" },
        };
      },
      { retryAttempts: 3, retryBaseDelayMs: 0 }
    );

    expect(calls).toBe(3);
    expect(mutation.attempts).toBe(3);
    expect(mutation.timedOut).toBe(false);
    expect(mutation.failedBatchSize).toBe(3);
  });

  it("selects only rows created after the ingest run began", () => {
    expect(
      selectStateCityScoringCandidateIds(
        [
          { id: "existing", created_at: "2026-07-23T11:59:59.999Z" },
          { id: "new", created_at: "2026-07-23T12:00:00.001Z" },
        ],
        "2026-07-23T12:00:00.000Z"
      )
    ).toEqual(["new"]);
  });

  it("includes a row created exactly at the ingest boundary", () => {
    expect(
      selectStateCityScoringCandidateIds(
        [{ id: "boundary", created_at: "2026-07-23T12:00:00.000Z" }],
        "2026-07-23T12:00:00.000Z"
      )
    ).toEqual(["boundary"]);
  });

  it("excludes invalid database timestamps and rejects an invalid boundary", () => {
    expect(
      selectStateCityScoringCandidateIds(
        [{ id: "invalid", created_at: "not-a-date" }],
        "2026-07-23T12:00:00.000Z"
      )
    ).toEqual([]);
    expect(() =>
      selectStateCityScoringCandidateIds([], "not-a-date")
    ).toThrow("ingestStartedAt must be a valid timestamp");
  });
});
