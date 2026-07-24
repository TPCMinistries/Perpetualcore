import { describe, expect, it } from "vitest";

import { summarizeRfpCronErrors } from "@/lib/rfp/monitoring/health";

describe("RFP health monitoring", () => {
  it("summarizes successful, warning, and failed cron runs", () => {
    const summary = summarizeRfpCronErrors([
      {
        cron_name: "rfp-discovery-state-city",
        executed_at: "2026-06-11T12:00:00.000Z",
        status: "success",
      },
      {
        cron_name: "rfp-weekly-report",
        executed_at: "2026-06-11T11:00:00.000Z",
        status: "partial_success",
      },
      {
        cron_name: "rfp-amendment-monitor",
        executed_at: "2026-06-11T10:00:00.000Z",
        status: "failed",
      },
      {
        cron_name: "rfp-key-expiry-check",
        executed_at: "2026-06-11T09:00:00.000Z",
        status: null,
      },
    ]);

    expect(summary).toEqual({
      total: 4,
      failures: 2,
      warnings: 1,
      successes: 1,
      error_rate: 0.5,
      error_rate_percent: 50,
      latest_run_at: "2026-06-11T12:00:00.000Z",
      latest_success_at: "2026-06-11T12:00:00.000Z",
    });
  });

  it("returns null error rate when no recent cron runs exist", () => {
    const summary = summarizeRfpCronErrors([]);

    expect(summary.total).toBe(0);
    expect(summary.error_rate).toBeNull();
    expect(summary.error_rate_percent).toBeNull();
    expect(summary.latest_run_at).toBeNull();
    expect(summary.latest_success_at).toBeNull();
  });

  it("treats unknown statuses as failures so monitoring fails closed", () => {
    const summary = summarizeRfpCronErrors([
      {
        cron_name: "rfp-discovery-federal",
        executed_at: "2026-06-11T08:00:00.000Z",
        status: "timed_out",
      },
    ]);

    expect(summary.failures).toBe(1);
    expect(summary.error_rate_percent).toBe(100);
  });
});
