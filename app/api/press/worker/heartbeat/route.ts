import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requireWorkerAuthorization } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { workerHeartbeatSchema } from "@/lib/press/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireWorkerAuthorization(request.headers.get("authorization"));
    const input = workerHeartbeatSchema.parse(await request.json());
    const admin = createPressAdminClient();

    if (input.currentJobId) {
      const { data: job, error: jobError } = await admin.from("press_jobs")
        .select("id")
        .eq("id", input.currentJobId)
        .eq("status", "processing")
        .eq("lease_owner", input.workerId)
        .maybeSingle();
      if (jobError) throw jobError;
      if (!job) throw new PressHttpError(409, "Worker does not own the reported job");
    }

    const { error } = await admin.from("press_worker_heartbeats").upsert({
      worker_id: input.workerId,
      last_seen_at: new Date().toISOString(),
      current_job_id: input.currentJobId,
      metadata: {
        wakeMode: input.wakeMode,
        realtimeConnected: input.realtimeConnected,
        recoverySweepMs: input.recoverySweepMs,
      },
    }, { onConflict: "worker_id" });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
