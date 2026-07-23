import { describe, expect, it } from "vitest";

import { chunkStateCityMutationRows } from "@/lib/rfp/ingest/run-state-city";

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
});
