/**
 * Phase 05-05 — Quick Import status polling endpoint.
 *
 *   GET /api/rfp/quick-import/[jobId]/status
 *     returns: 200 ImportJob | 401 | 403 | 404
 *
 * Reads the ImportJob from Upstash Redis via `readJob`. Job state lives
 * in Redis only — there is no module-scope Map fallback because state
 * must survive across Vercel lambda invocations (POST and GET routinely
 * land on different lambdas).
 *
 * Ownership check:
 *   - 404 when the job key has expired / never existed.
 *   - 403 when the caller is authenticated but did not start this job.
 *     We deliberately differentiate "not yours" (403) from "doesn't exist"
 *     (404) here because the client-side QuickImportBar polls by an id
 *     it just received from POST — a 404 means the TTL expired, while
 *     a 403 indicates the user signed out and back in as a different
 *     user mid-poll. The two cases warrant different UI messages.
 *
 * The response shape is exactly the ImportJob — the QuickImportBar renders
 * directly from it (`step`, `status`, `error`, `opp_id`, `needs_review`).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJob } from "@/lib/rfp/import/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
): Promise<NextResponse> {
  const jobId = params.jobId;
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
  }

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Job lookup
  let job;
  try {
    job = await readJob(jobId);
  } catch (e) {
    // Most likely: Upstash env missing or transient REST error. We treat
    // a Redis read failure the same as a missing job from the client's
    // point of view (the polling UI will show "Could not import"); but
    // we log loudly so ops sees the underlying cause.
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[quick-import GET] readJob failed (job=${jobId}):`, message);
    return NextResponse.json(
      {
        error: "Service unavailable",
        message:
          "Quick Import requires Upstash Redis. Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.",
      },
      { status: 503 }
    );
  }

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership — explicit 403 (not 404) so the UI can show a sensible
  // "not yours" message vs the "expired" 404 case.
  if (job.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(job, { status: 200 });
}
