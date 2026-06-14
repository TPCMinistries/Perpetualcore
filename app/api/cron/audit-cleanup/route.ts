import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint to clean up expired audit logs.
 *
 * Runs daily at 03:00 UTC. Calls the cleanup_expired_audit_logs()
 * database function to remove audit log entries past their retention period.
 */
export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("cleanup_expired_audit_logs");

    if (error) {
      console.error("[Cron] Audit cleanup error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.log("[Cron] Audit cleanup complete, deleted:", data);

    return NextResponse.json({
      success: true,
      deleted_count: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Audit cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
