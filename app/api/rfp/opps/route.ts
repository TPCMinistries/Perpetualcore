/**
 * GET /api/rfp/opps
 *
 * Returns the paginated, ranked, filtered Discovery feed for the caller's org.
 *
 * Single-org mode (default):
 *   ?org_id=<uuid>&sources=...&deadline_within_days=...&min_amount=...&cursor=...&limit=...
 *
 * Dual mode (Phase 05-06):
 *   ?org_id=<dualOrgUuid>&dual=true&mode=all|nonprofit|forprofit&... (other filters)
 *
 *   When `dual=true`:
 *     - The caller must be a member of `org_id` AND that org's type must be 'dual'.
 *     - We list the caller's underlying orgs via listUserOrgs(), filter to the
 *       requested mode's types, and pass the resolved set as `dual_org_ids` to
 *       buildFeedQuery — which unions matches across all of them and dedupes by
 *       opp_id (keeping the row with the highest fit_score).
 *     - If the user has a dual lens but no underlying member orgs matching the
 *       requested mode, we return `{ rows: [], next_cursor: null, empty_reason:
 *       'no_member_orgs', mode }` so the client can render an actionable empty
 *       state ("you're not a member of any nonprofit/for-profit org — join one").
 *
 * Query params:
 *   org_id (required)                  — UUID of the rfp_org to read matches for
 *                                          (the active org; in dual mode this is
 *                                          the dual lens, not necessarily where
 *                                          rows are scored)
 *   dual (optional)                    — "true" enables dual-mode union
 *   mode (optional, dual mode only)    — "all" (default) | "nonprofit" | "forprofit"
 *   sources (optional)                 — comma-separated source codes
 *                                          (sam_gov, grants_gov, simpler_grants, sbir,
 *                                           fed_register, ny_state, nyc_dycd,
 *                                           nyc_hra, nyc_doe, ca_grants,
 *                                           foundation_url)
 *   q (optional)                       — keyword search across opportunity title,
 *                                          agency, and brief before org ranking
 *   deadline_within_days (optional)    — "7" | "30"
 *   min_amount (optional)              — integer dollars; matches rows where
 *                                          opp.amount_max >= min_amount
 *   cursor (optional)                  — base64 JSON {fit_score:number, opp_id:string}
 *   limit (optional, default 25)       — 1..100
 *
 * Returns: { rows: FeedRow[], next_cursor: {fit_score,opp_id} | null, empty_reason?: 'no_member_orgs', mode?: FeedModeFilter }
 *
 * The optional `empty_reason` discriminator is set ONLY when rows is empty
 * because the dual user is not a member of any underlying org of the requested
 * mode. It is omitted in all normal cases (rows populated, or rows empty due to
 * filters).
 *
 * Auth + RLS:
 *   - Uses the request-scoped Supabase client (cookie-bound) — NOT createAdminClient.
 *   - RLS on rfp_opp_matches restricts SELECT to rows the caller's user is a
 *     member of via rfp_user_orgs. A non-member calling this endpoint with
 *     another org's UUID gets back `{ rows: [], next_cursor: null }` — not a
 *     403, because that would let attackers probe for valid org IDs.
 *   - In dual mode we additionally verify membership + dual type via getOrgForUser
 *     before resolving the union org set. Non-dual orgs that pass ?dual=true get
 *     a 400 invalid_dual_org.
 *
 * Error handling:
 *   - 401 if not authenticated
 *   - 400 on validation failure (bad org_id, malformed cursor, bad sources, etc.)
 *   - 400 invalid_dual_org when ?dual=true but active org is not type='dual'
 *   - 500 with `{ error: 'feed_unavailable' }` on unexpected DB error
 *     (no stack-trace leak).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  buildFeedQuery,
  type FeedFilters,
  type FeedModeFilter,
} from "@/lib/rfp/feed";
import { getOrgForUser, listUserOrgs } from "@/lib/rfp/orgs";

const KNOWN_SOURCES = [
  "sam_gov",
  "grants_gov",
  "simpler_grants",
  "sbir",
  "fed_register",
  "ny_state",
  "nyc_dycd",
  "nyc_hra",
  "nyc_doe",
  "ca_grants",
  "foundation_url",
] as const;

const QuerySchema = z.object({
  org_id: z.string().uuid(),
  dual: z
    .string()
    .optional()
    .transform((s) => s === "true" || s === "1"),
  mode: z
    .enum(["all", "nonprofit", "forprofit"])
    .optional()
    .transform((m) => m ?? "all"),
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
  q: z
    .string()
    .optional()
    .transform((s) => (s ? s.trim().slice(0, 100) : "")),
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

/**
 * Resolve the dual_org_ids set for a dual-mode request.
 *
 * Returns:
 *   - { kind: 'ok', ids: string[] } — pass these to buildFeedQuery.
 *   - { kind: 'empty', mode: FeedModeFilter } — user has no underlying member
 *     orgs matching the mode. Caller should short-circuit with empty_reason.
 *   - { kind: 'invalid' } — active org isn't dual; reject the request.
 */
async function resolveDualOrgIds(
  activeOrgId: string,
  mode: FeedModeFilter
): Promise<
  | { kind: "ok"; ids: string[] }
  | { kind: "empty"; mode: FeedModeFilter }
  | { kind: "invalid" }
> {
  // Verify active org is dual (and the caller is a member — RLS already enforces).
  const activeOrg = await getOrgForUser(activeOrgId);
  if (!activeOrg) return { kind: "invalid" };
  if (activeOrg.type !== "dual") return { kind: "invalid" };

  // List all orgs the user belongs to and filter by mode → org type.
  const memberOrgs = await listUserOrgs();

  // Exclude dual orgs themselves — the dual lens is the view, not a target to
  // score against. Including it would double-count (matches against the dual
  // org would surface alongside its underlying nonprofit/forprofit member orgs,
  // even though dual orgs don't typically have their own scoring profile).
  const underlying = memberOrgs.filter(
    (m) => m.rfp_orgs.type !== "dual"
  );

  let filtered: typeof underlying;
  if (mode === "nonprofit") {
    filtered = underlying.filter((m) => m.rfp_orgs.type === "nonprofit");
  } else if (mode === "forprofit") {
    filtered = underlying.filter((m) => m.rfp_orgs.type === "forprofit");
  } else {
    // 'all' — both nonprofit + forprofit
    filtered = underlying;
  }

  if (filtered.length === 0) {
    return { kind: "empty", mode };
  }

  return {
    kind: "ok",
    ids: filtered.map((m) => m.rfp_orgs.id),
  };
}

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
    query: parsed.data.q,
    sources: parsed.data.sources.length > 0 ? parsed.data.sources : undefined,
    deadline_within_days: parsed.data.deadline_within_days,
    min_amount: parsed.data.min_amount,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  };

  // Dual-mode resolution
  if (parsed.data.dual) {
    const resolved = await resolveDualOrgIds(parsed.data.org_id, parsed.data.mode);
    if (resolved.kind === "invalid") {
      return NextResponse.json(
        { error: "invalid_dual_org" },
        { status: 400 }
      );
    }
    if (resolved.kind === "empty") {
      // No underlying member orgs matching the requested mode — return the
      // discriminator so the client can render an actionable empty state.
      return NextResponse.json({
        rows: [],
        next_cursor: null,
        empty_reason: "no_member_orgs",
        mode: resolved.mode,
      });
    }
    filters.dual_org_ids = resolved.ids;
    filters.mode_filter = parsed.data.mode;
  }

  try {
    const page = await buildFeedQuery(filters);
    // Surface the resolved mode in dual responses so the client can keep its
    // UI in sync without re-deriving from URL state.
    if (parsed.data.dual) {
      return NextResponse.json({ ...page, mode: parsed.data.mode });
    }
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
