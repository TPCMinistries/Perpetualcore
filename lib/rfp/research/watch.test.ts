import { describe, expect, it } from "vitest";
import {
  resolveWatchDeadline,
  resolveWatchStatus,
  selectWatchCandidates,
  type WatchCandidateRow,
} from "./watch";

function row(overrides: Partial<WatchCandidateRow>): WatchCandidateRow {
  return {
    id: "id",
    source: "ai_research",
    deadline: null,
    raw_json: {},
    last_seen_at: null,
    watched: false,
    ...overrides,
  };
}

describe("selectWatchCandidates", () => {
  const now = new Date("2026-07-10T00:00:00.000Z");

  it("includes an ai_research row with status opens_soon", () => {
    const rows = [
      row({ id: "a", source: "ai_research", raw_json: { status: "opens_soon" } }),
    ];
    expect(selectWatchCandidates(rows, now, 25)).toEqual(["a"]);
  });

  it("includes a watched row even when source is not ai_research", () => {
    const rows = [
      row({
        id: "b",
        source: "grants_gov",
        watched: true,
        raw_json: { status: "uncertain" },
      }),
    ];
    expect(selectWatchCandidates(rows, now, 25)).toEqual(["b"]);
  });

  it("excludes an open_now row with a deadline far in the future", () => {
    const farFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const rows = [
      row({
        id: "c",
        source: "ai_research",
        watched: true,
        deadline: farFuture,
        raw_json: { status: "open_now" },
      }),
      row({ id: "d", source: "ai_research", raw_json: { status: "opens_soon" } }),
    ];
    expect(selectWatchCandidates(rows, now, 25)).toEqual(["d"]);
  });

  it("caps results and orders by last_seen_at ascending with nulls first", () => {
    const rows = [
      row({
        id: "recent",
        source: "ai_research",
        raw_json: { status: "opens_soon" },
        last_seen_at: "2026-07-09T00:00:00.000Z",
      }),
      row({
        id: "never-seen",
        source: "ai_research",
        raw_json: { status: "opens_soon" },
        last_seen_at: null,
      }),
      row({
        id: "oldest",
        source: "ai_research",
        raw_json: { status: "opens_soon" },
        last_seen_at: "2026-07-01T00:00:00.000Z",
      }),
    ];

    expect(selectWatchCandidates(rows, now, 25)).toEqual([
      "never-seen",
      "oldest",
      "recent",
    ]);
    expect(selectWatchCandidates(rows, now, 2)).toEqual(["never-seen", "oldest"]);
  });
});

describe("resolveWatchDeadline", () => {
  const now = new Date("2026-07-10T00:00:00.000Z");

  it("uses the confirmed future date when the agent provides one", () => {
    const confirmed = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      resolveWatchDeadline({
        deadlineIso: confirmed,
        stillExists: true,
        previousDeadline: "2026-06-01T00:00:00.000Z",
        now,
      }),
    ).toBe(confirmed);
  });

  it("preserves the previous deadline when the agent couldn't confirm one", () => {
    const previous = "2026-08-01T00:00:00.000Z";
    expect(
      resolveWatchDeadline({
        deadlineIso: null,
        stillExists: true,
        previousDeadline: previous,
        now,
      }),
    ).toBe(previous);
  });

  it("clears the deadline when the program is confirmed discontinued", () => {
    expect(
      resolveWatchDeadline({
        deadlineIso: null,
        stillExists: false,
        previousDeadline: "2026-08-01T00:00:00.000Z",
        now,
      }),
    ).toBeNull();
  });
});

describe("resolveWatchStatus", () => {
  it("returns discontinued when still_exists is false, regardless of reported status", () => {
    expect(resolveWatchStatus({ still_exists: false, status: "opens_soon" })).toBe(
      "discontinued",
    );
  });

  it("passes through the reported status when still_exists is true", () => {
    expect(resolveWatchStatus({ still_exists: true, status: "open_now" })).toBe("open_now");
  });
});
