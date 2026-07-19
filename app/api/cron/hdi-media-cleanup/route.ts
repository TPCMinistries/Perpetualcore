import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import {
  finalizeMediaIngestion,
  listExpiredMediaIngestions,
} from "@/lib/development-intelligence/store";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await listExpiredMediaIngestions(25);
  let deleted = 0;
  let failed = 0;
  for (const job of jobs) {
    const { error } = await createAdminClient()
      .storage
      .from(job.storageBucket)
      .remove([job.storagePath]);
    if (error) {
      failed += 1;
      console.error("Expired HDI media cleanup failed:", job.ingestionId, error.message);
      continue;
    }
    await finalizeMediaIngestion(
      {
        userId: job.createdBy,
        organizationId: job.organizationId,
        role: "admin",
      },
      job.ingestionId,
      "expired",
      "staging_expired"
    );
    deleted += 1;
  }

  return NextResponse.json({ scanned: jobs.length, deleted, failed });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
