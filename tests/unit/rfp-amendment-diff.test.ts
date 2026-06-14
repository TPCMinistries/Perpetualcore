import { describe, expect, it } from "vitest";
import {
  buildSolicitationSnapshot,
  diffSolicitationSnapshots,
} from "@/lib/rfp/amendments/diff";

describe("solicitation amendment diff", () => {
  it("marks deadline changes as material", () => {
    const previous = buildSolicitationSnapshot({
      title: "Youth Workforce RFP",
      deadline: "2026-07-01T21:00:00.000Z",
      amount_min: null,
      amount_max: 500000,
      brief: "Applications are due July 1. Submit a project narrative and budget.",
      source_url: "https://example.test/rfp",
    });
    const current = buildSolicitationSnapshot({
      title: "Youth Workforce RFP",
      deadline: "2026-07-15T21:00:00.000Z",
      amount_min: null,
      amount_max: 500000,
      brief: "Amendment 1 extends the submission deadline to July 15. Submit a project narrative and budget.",
      source_url: "https://example.test/rfp",
    });

    const diff = diffSolicitationSnapshots(previous, current);

    expect(diff.changed).toBe(true);
    expect(diff.material).toBe(true);
    expect(diff.material_reasons).toContain("Deadline changed");
    expect(diff.added_lines.join(" ")).toMatch(/Amendment 1/);
  });

  it("keeps unchanged snapshots non-material", () => {
    const previous = buildSolicitationSnapshot({
      title: "Stable Grant",
      deadline: null,
      amount_min: null,
      amount_max: null,
      brief: "Applicants must include a narrative and budget attachment.",
      source_url: null,
    });
    const diff = diffSolicitationSnapshots(previous, previous);

    expect(diff.changed).toBe(false);
    expect(diff.material).toBe(false);
    expect(diff.material_reasons).toEqual([]);
  });
});
