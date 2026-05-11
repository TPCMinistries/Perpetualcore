/**
 * GET /api/rfp/opps
 *
 * Returns the paginated, ranked, filtered Discovery feed for the caller's org.
 *
 * Query params:
 *   org_id (required)                  — UUID of the rfp_org to read matches for
 *   sources (optional)                 — comma-separated source codes
 *                                          (sam_gov, grants_gov, simpler_grants, sbir,
 *                                           ny_state, nyc_dycd, nyc_hra, nyc_doe,
 *                                           foundation_url)
 *   deadline_within_days (optional)    — "7" | "30"
 *   min_amount (optional)              — integer dollars; matches rows where
 *                                          opp.amount_max >= min_amount
 *   cursor (optional)                  — base64 JSON {fit_score:number, opp_id:string}
 *   limit (optional, default 25)       — 1..100
 *
 * Returns: { rows: FeedRow[], next_cursor: {fit_score,opp_id} | null }
 *
 * Auth + RLS:
 *   - Uses the request-scoped Supabase client (cookie-bound) — NOT createAdminClient.
 *   - RLS on rfp_opp_matches restricts SELECT to rows the caller's user is a
 *     member of via rfp_user_orgs. A non-member calling this endpoint with
 *     another org's UUID gets back `{ rows: [], next_cursor: null }` — not a
 *     403, because that would let attackers probe for valid org IDs.
 *
 * Error handling:
 *   - 401 if not authenticated
 *   - 400 on validation failure (bad org_id, malformed cursor, bad sources, etc.)
 *   - 500 with `{ error: 'feed_unavailable' }` on unexpected DB error
 *     (no stack-trace leak).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildFeedQuery, type FeedFilters } from "@/lib/rfp/feed";

const KNOWN_SOURCES = [
  "sam_gov",
  "grants_gov",
  "simpler_grants",
  "sbir",
  "ny_state",
  "nyc_dycd",
  "nyc_hra",
  "nyc_doe",
  "foundation_url",
] as const;

const QuerySchema = z.object({
  org_id: z.string().uuid(),
  sources: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : []
    )
    .pipe(z.array(z.enum(KNOWN_SOURCES))),
  deadline_within_days: z
    .string()
    .optional()
    .transform((s) => (s === "7" || s === "30" ? Number(s) : null))
    .pipe(z.union([z.literal(7), z.literal(30), z.null()])),
  min_amount: z
    .string()
    .optional()
    .transform((s) => {
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) && n > 0 ? n : null;
    })
    .pipe(z.union([z.number(), z.null()])),
  cursor: z
    .string()
    .optional()
    .transform((s, ctx) => {
      if (!s) return null;
      try {
        const decoded = JSON.parse(
          Buffer.from(s, "base64").toString("utf-8")
        ) as { fit_score: number; opp_id: string };
        if (
          typeof decoded.fit_score !== "number" ||
          typeof decoded.opp_id !== "string"
        ) {
          throw new Error("invalid cursor shape");
        }
        return decoded;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "invalid_cursor",
        });
        return z.NEVER;
      }
    }),
  limit: z
    .string()
    .optional()
    .transform((s) => (s ? Math.max(1, Math.min(100, Number(s))) : 25))
    .pipe(z.number()),
});

export async function GET(req: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse query params
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const filters: FeedFilters = {
    org_id: parsed.data.org_id,
    sources: parsed.data.sources.length > 0 ? parsed.data.sources : undefined,
    deadline_within_days: parsed.data.deadline_within_days,
    min_amount: parsed.data.min_amount,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  };

  try {
    const page = await buildFeedQuery(filters);
    return NextResponse.json(page);
  } catch (e) {
    // Log internally — return a generic error to the client (no stack leak).
    console.error("[/api/rfp/opps GET] buildFeedQuery threw", e);
    return NextResponse.json(
      { error: "feed_unavailable" },
      { status: 500 }
    );
  }
}
