/**
 * Phase 05-05 — Quick Import POST endpoint.
 *
 *   POST /api/rfp/quick-import
 *     body: { url: string (http/https), orgId: string (uuid) }
 *     returns: 202 { jobId } | 400 | 401 | 404 | 429 | 503
 *
 * Flow:
 *   1. Auth via request-scoped createClient() — 401 if no session.
 *   2. Zod-validate body — 400 on parse fail.
 *   3. Membership gate via getOrgForUser — 404 if non-member (deliberately
 *      not 403, matches the recompute-scores precedent: prevents probing
 *      for valid org IDs).
 *   4. Per-user Upstash rate limit (10/min, prefix 'rfp-import') — 429 on
 *      excess with retry-after.
 *   5. Mint jobId via crypto.randomUUID, persist initial job in Redis,
 *      then dispatch the background runner via fire-and-forget.
 *
 * Background dispatch (Next 14 vs Next 15):
 *   This project pins Next 14.2.x (see package.json). `after()` from
 *   `next/server` only became stable in Next 15. We use the documented
 *   Next 14 alternative — an unawaited promise. The runner never throws;
 *   all error paths are persisted to Redis as the job's terminal state,
 *   so an unawaited rejection is impossible. The pattern matches
 *   `app/api/rfp/orgs/[orgId]/recompute-scores/route.ts` from Plan 05-03.
 *
 *   Horizontal scaling note: at higher volume this should move to a
 *   queue (BullMQ on Upstash or Vercel Queues). Tracked in
 *   `deferred-items.md` as QUICK-IMPORT-QUEUE-DURABILITY.
 *
 * GET on this path returns 405 — status polling lives at
 *   /api/rfp/quick-import/[jobId]/status.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import { createRateLimiter } from "@/lib/rate-limit";
import { writeJob } from "@/lib/rfp/import/job-store";
import { runQuickImport } from "@/lib/rfp/import/run";
import type { ImportJob } from "@/lib/rfp/import/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module-scope limiter — 10 imports per minute per user. Created once at
// module load so the Upstash rate-limit client is reused across requests.
const importLimiter = createRateLimiter({
  interval: 60,
  limit: 10,
  prefix: "rfp-import",
});

// Body shape. URL must parse + use http/https; orgId must be uuid.
// (Stricter URL validation happens again inside fetch-url.ts.)
const bodySchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (u) => {
        try {
          const p = new URL(u);
          return p.protocol === "http:" || p.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "URL must use http or https scheme" }
    ),
  orgId: z.string().uuid(),
});

export async function GET(): Promise<NextResponse> {
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed. Use POST." }),
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Body validation
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid body",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }
  const { url, orgId } = parsed.data;

  // 3. Membership gate — 404 on non-member (intentional anti-probing).
  const org = await getOrgForUser(orgId);
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 4. Rate limit — 10/min/user via the existing Upstash middleware. The
  //    limiter falls back to in-memory only when Upstash isn't configured;
  //    in production it's the same Redis as the job store.
  const rl = await importLimiter.check(request, user.id);
  if (!rl.success && rl.response) {
    return rl.response;
  }

  // 5. Mint job + persist initial state + dispatch background runner.
  const jobId = randomUUID();
  const createdAt = new Date().toISOString();
  const initialJob: ImportJob = {
    jobId,
    userId: user.id,
    orgId,
    url,
    step: "fetching",
    status: "in_progress",
    created_at: createdAt,
    updated_at: createdAt,
  };

  try {
    await writeJob(jobId, initialJob);
  } catch (e) {
    // Most likely cause: UPSTASH_REDIS_REST_URL/TOKEN missing in env.
    // Surface this clearly — Quick Import is broken end-to-end without
    // Redis and we will NOT silently degrade to a Map (see job-store.ts).
    const message = e instanceof Error ? e.message : String(e);
    console.error("[quick-import POST] writeJob failed:", message);
    return NextResponse.json(
      {
        error: "Service unavailable",
        message:
          "Quick Import requires Upstash Redis. Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.",
      },
      { status: 503 }
    );
  }

  // Fire-and-forget background dispatch.
  //
  // Why void (instead of `after()` from next/server): Next 14.2.x in this
  // project does NOT ship the stable after() API yet (Next 15+). The
  // runner never throws — all terminal errors are persisted onto the
  // ImportJob in Redis — so an unawaited rejection is impossible. We
  // still attach a .catch() to keep unhandled-rejection telemetry quiet.
  //
  // Horizontal scaling note: at higher volume this should move to a
  // queue (BullMQ on Upstash, or Vercel Queues). Tracked in
  // deferred-items.md as QUICK-IMPORT-QUEUE-DURABILITY.
  void runQuickImport({ url, orgId, userId: user.id, jobId }).catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `[quick-import POST] background runner threw (should be unreachable): ${msg}`
    );
  });

  return NextResponse.json({ jobId }, { status: 202 });
}
