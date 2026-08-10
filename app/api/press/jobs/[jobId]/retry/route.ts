import { NextRequest, NextResponse } from "next/server";
import { PRESS_ADMIN_ROLES, PressHttpError, requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressJobRateLimit } from "@/lib/press/rate-limit";
import { asJob, requireProject } from "@/lib/press/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const jobId = (await params).jobId;
    const admin = createPressAdminClient();
    const { data: jobData, error: jobError } = await admin.from("press_jobs")
      .select("*").eq("id", jobId).maybeSingle();
    if (jobError) throw jobError;
    if (!jobData) throw new PressHttpError(404, "Press job not found");
    const job = asJob(jobData);
    await requireProject(job.project_id, PRESS_ADMIN_ROLES);
    const { user } = await requirePressUser();
    const rateLimited = await checkPressJobRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    const { data, error } = await admin.rpc("press_retry_job", {
      p_job_id: job.id,
      p_organization_id: job.organization_id,
      p_requested_by: user.id,
    });
    if (error) throw error;
    const retried = asJob(data);
    return NextResponse.json({
      job: {
        id: retried.id,
        type: retried.job_type,
        status: retried.status,
        progress: retried.progress,
        attempts: retried.attempts,
        maxAttempts: retried.max_attempts,
        errorMessage: null,
        retryable: false,
        createdAt: retried.created_at,
        updatedAt: retried.updated_at,
      },
    });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
