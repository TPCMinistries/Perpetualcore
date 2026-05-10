/**
 * RFP Discovery source registry.
 *
 * Single source of truth for all external API endpoints used by the
 * Discovery Agent (Phase 5). Import from here — do not hard-code URLs
 * or auth mechanics anywhere else.
 *
 * Each source exposes a `pingRequest()` helper that returns a lightweight
 * Request object suitable for smoke-testing auth without fetching a full
 * result set. Phase 5 cron workers import `RFP_SOURCES` and call the
 * full search API; this file stays focused on the registry contract.
 *
 * -----------------------------------------------------------------------------
 * IMPORTANT: source key vs schema enum value mapping
 * -----------------------------------------------------------------------------
 * The registry key here is `sbir_gov` for symmetry with `sam_gov` /
 * `grants_gov` / `simpler_grants`. The Postgres schema (rfp_opportunities.source
 * CHECK constraint, see supabase/migrations/20260509_rfp_schema.sql) uses the
 * shorter canonical value `sbir`. The ingest normalizer
 * (lib/rfp/ingest/normalize.ts) is responsible for mapping `sbir_gov` -> `sbir`
 * when writing rows. Do NOT change the schema enum to add `sbir_gov` — the
 * shorter value is the canonical storage form.
 *
 * All other registry keys (sam_gov, grants_gov, simpler_grants) match the
 * schema enum values exactly.
 * -----------------------------------------------------------------------------
 */

import { env } from "@/lib/env";

/**
 * Fallback base URLs used when `env` validation fails in a standalone script context
 * (e.g. when Supabase vars are absent from the current shell). Zod `.default()` values
 * only apply when the schema parse SUCCEEDS; if it fails in dev mode, we get raw
 * `process.env` which may lack these keys entirely.
 */
const BASE_URLS = {
  SAM_GOV: env.SAM_GOV_BASE_URL ?? "https://api.sam.gov/prod/opportunities/v2",
  GRANTS_GOV: env.GRANTS_GOV_BASE_URL ?? "https://api.grants.gov/v1/api",
  SIMPLER_GRANTS: env.SIMPLER_GRANTS_BASE_URL ?? "https://api.simpler.grants.gov/v1",
  SBIR_GOV: env.SBIR_GOV_BASE_URL ?? "https://www.sbir.gov/api",
} as const;

export type RfpSourceName =
  | "sam_gov"
  | "grants_gov"
  | "simpler_grants"
  | "sbir_gov";

export interface RfpSource {
  /** Machine-readable source identifier — matches `rfp_opportunities.source` column. */
  name: RfpSourceName;
  /** Human-readable label for UI and logs. */
  displayName: string;
  /**
   * Whether this source requires an API key.
   * If true, the Discovery cron will skip this source when the key is absent
   * rather than crashing the entire scan run.
   */
  requiresAuth: boolean;
  /**
   * Returns a Request object that smoke-tests API reachability and auth.
   * Throws if `requiresAuth` is true and the corresponding key is not set.
   * Callers should catch and surface as [SKIP] when key is absent.
   */
  pingRequest: () => Request;
  /**
   * Returns true when the HTTP status indicates auth was accepted
   * (or that auth is not required and the endpoint is reachable).
   * A 200 is always good. Some APIs return 400 "missing required param"
   * after successfully authenticating — override here when that applies.
   */
  isAuthOk: (status: number) => boolean;
}

export const RFP_SOURCES: Record<RfpSourceName, RfpSource> = {
  sam_gov: {
    name: "sam_gov",
    displayName: "SAM.gov",
    requiresAuth: true,
    pingRequest: () => {
      const key = env.SAM_GOV_API_KEY;
      if (!key) throw new Error("SAM_GOV_API_KEY not set");
      // SAM.gov Opportunities Search v2 — tiny 1-day date window.
      // Returns 200 with 0-N results when key is valid.
      // Returns 401 when key is invalid or not yet provisioned.
      // Rate limit: 1,000 requests/day on the free tier.
      const url = new URL(`${BASE_URLS.SAM_GOV}/search`);
      url.searchParams.set("api_key", key);
      url.searchParams.set("postedFrom", "01/01/2026");
      url.searchParams.set("postedTo", "01/02/2026");
      url.searchParams.set("limit", "1");
      return new Request(url.toString(), { method: "GET" });
    },
    isAuthOk: (status) => status === 200,
  },

  grants_gov: {
    name: "grants_gov",
    displayName: "Grants.gov",
    requiresAuth: false,
    pingRequest: () => {
      // Grants.gov search2 — POST JSON, no auth.
      // Returns 200 with metadata even if no results match.
      // Generous rate limits; no key required.
      return new Request(`${BASE_URLS.GRANTS_GOV}/search2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: 1, keyword: "test" }),
      });
    },
    isAuthOk: (status) => status === 200,
  },

  simpler_grants: {
    name: "simpler_grants",
    displayName: "Simpler.Grants.gov",
    requiresAuth: true,
    pingRequest: () => {
      const key = env.SIMPLER_GRANTS_API_KEY;
      if (!key) throw new Error("SIMPLER_GRANTS_API_KEY not set");
      // Simpler Grants opportunity search — POST JSON.
      // Auth header: "X-API-Key" per TECH-SPEC.md §4.1 sources table (2026-05).
      // Note: some older docs reference "X-Auth"; if smoke test returns 401,
      // check https://api.simpler.grants.gov and update this header accordingly.
      // Rate limit: 60 req/min, 10,000 req/day.
      return new Request(
        `${BASE_URLS.SIMPLER_GRANTS}/opportunities/search`,
        {
          method: "POST",
          headers: {
            "X-API-Key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pagination: {
              page_size: 1,
              page_offset: 1,
              sort_order: [
                {
                  order_by: "opportunity_id",
                  sort_direction: "ascending",
                },
              ],
            },
          }),
        }
      );
    },
    isAuthOk: (status) => status === 200,
  },

  sbir_gov: {
    name: "sbir_gov",
    displayName: "SBIR.gov",
    requiresAuth: false,
    pingRequest: () => {
      // SBIR.gov — no auth, no rate limit.
      //
      // 2026-05-09 endpoint status: The TECH-SPEC endpoint `www.sbir.gov/api/solicitations.json`
      // is no longer valid. SBIR.gov migrated from Drupal 7 to Drupal 10 and all old
      // REST API paths now return 404. The site itself is live and reachable.
      //
      // Smoke-test strategy: ping `robots.txt` (always 200) to verify domain reachability
      // and TLS health. This is sufficient for infrastructure verification — the actual
      // solicitations endpoint for Phase 5 Discovery must be researched separately.
      //
      // Phase 5 options to evaluate:
      //   - SBIR bulk CSV downloads: https://www.sbir.gov (check "Data Downloads" section)
      //   - SBIR/STTR Innovation Portal public API (if available)
      //   - Web scrape of open solicitation listings with Playwright
      //
      // Tracked as SBIR-ENDPOINT-UPDATE in deferred-items.md.
      return new Request(`https://www.sbir.gov/robots.txt`, {
        method: "GET",
        headers: {
          "User-Agent": "PerpeturalCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)",
        },
      });
    },
    isAuthOk: (status) => status === 200,
  },
};
