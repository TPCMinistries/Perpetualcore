export const RFP_CRON_SUCCESS_STATUSES = new Set(["ok", "success"]);
export const RFP_CRON_WARNING_STATUSES = new Set(["partial_success", "warning"]);
export const RFP_CRON_FAILURE_STATUSES = new Set(["failed", "error", "failure"]);

export interface RfpCronExecutionHealthRow {
  cron_name: string;
  executed_at: string | null;
  status: string | null;
}

export interface RfpCronErrorSummary {
  total: number;
  failures: number;
  warnings: number;
  successes: number;
  error_rate: number | null;
  error_rate_percent: number | null;
  latest_run_at: string | null;
  latest_success_at: string | null;
}

function normalizeCronStatus(status: string | null | undefined): string | null {
  return status?.trim().toLowerCase() || null;
}

function isCronSuccess(status: string | null | undefined): boolean {
  const normalized = normalizeCronStatus(status);
  return normalized !== null && RFP_CRON_SUCCESS_STATUSES.has(normalized);
}

function isCronWarning(status: string | null | undefined): boolean {
  const normalized = normalizeCronStatus(status);
  return normalized !== null && RFP_CRON_WARNING_STATUSES.has(normalized);
}

function isCronFailure(status: string | null | undefined): boolean {
  const normalized = normalizeCronStatus(status);
  return (
    normalized === null ||
    RFP_CRON_FAILURE_STATUSES.has(normalized) ||
    (!RFP_CRON_SUCCESS_STATUSES.has(normalized) &&
      !RFP_CRON_WARNING_STATUSES.has(normalized))
  );
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export function summarizeRfpCronErrors(
  rows: RfpCronExecutionHealthRow[],
): RfpCronErrorSummary {
  let failures = 0;
  let warnings = 0;
  let successes = 0;
  let latestRunAt: string | null = null;
  let latestSuccessAt: string | null = null;

  for (const row of rows) {
    latestRunAt = maxIso(latestRunAt, row.executed_at);
    if (isCronSuccess(row.status)) {
      successes += 1;
      latestSuccessAt = maxIso(latestSuccessAt, row.executed_at);
    } else if (isCronWarning(row.status)) {
      warnings += 1;
    } else if (isCronFailure(row.status)) {
      failures += 1;
    }
  }

  const total = rows.length;
  const errorRate = total > 0 ? failures / total : null;

  return {
    total,
    failures,
    warnings,
    successes,
    error_rate: errorRate,
    error_rate_percent:
      errorRate === null ? null : Math.round(errorRate * 1000) / 10,
    latest_run_at: latestRunAt,
    latest_success_at: latestSuccessAt,
  };
}
