import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type RfpCronStatus = "success" | "warning" | "error";
type CronExecutionStatus = "success" | "partial_success" | "failed";

interface LogRfpCronExecutionParams {
  cronName: string;
  durationMs: number;
  status: RfpCronStatus;
  result?: Json;
  errors?: Json;
}

/**
 * Best-effort cron execution logger. Never throw from here; ingestion success
 * should not be converted into cron failure because the audit insert failed.
 */
export async function logRfpCronExecution({
  cronName,
  durationMs,
  status,
  result = null,
  errors = null,
}: LogRfpCronExecutionParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const cronStatus: CronExecutionStatus =
      status === "success"
        ? "success"
        : status === "warning"
          ? "partial_success"
          : "failed";
    const { error } = await admin.from("cron_executions").insert({
      cron_name: cronName,
      job_name: cronName,
      executed_at: new Date().toISOString(),
      duration_ms: durationMs,
      status: cronStatus,
      result,
      errors,
    });
    if (error) {
      console.error(`[${cronName}] cron_executions insert failed:`, error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${cronName}] cron_executions insert threw:`, message);
  }
}
