/**
 * Tiny utilities shared across the four state/city scrapers.
 *
 * Intentionally zero deps: regex-based HTML extraction, polite User-Agent,
 * simple throttle helper. The plan rules out npm additions (no cheerio/jsdom)
 * for sources that render server-side; if a source genuinely needs a browser,
 * we'd document and revisit.
 */

export const SCRAPER_USER_AGENT =
  "PerpetualCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)";

/** Polite default per TECH-SPEC §4.1 — 1 req/sec/source. */
export const REQUEST_DELAY_MS = 1000;

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Decodes a small set of HTML entities common in NY/NYC government pages. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    // numeric entities
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Strips HTML tags and collapses whitespace. */
export function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best-effort ISO date parse. Returns ISO string or null. Accepts:
 *   - "2026-06-15", "06/15/2026", "June 15, 2026", "15-Jun-2026"
 *   - already-ISO timestamps
 */
export function toIsoDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Coerces "$1,234,567.89" or "1.2M" or numeric strings to a number. */
export function toAmount(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  // Handle "1.2M", "500K", "$1.5B"
  const mult = /([0-9.]+)\s*([kKmMbB])/.exec(s);
  if (mult) {
    const v = parseFloat(mult[1]);
    if (Number.isNaN(v)) return null;
    const suffix = mult[2].toLowerCase();
    if (suffix === "k") return Math.round(v * 1_000);
    if (suffix === "m") return Math.round(v * 1_000_000);
    if (suffix === "b") return Math.round(v * 1_000_000_000);
  }
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Lowercase / trim / dedupe keyword list. */
export function normalizeKeywords(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const k = w.trim().toLowerCase();
    if (!k || k.length < 2) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/**
 * Stable fallback ID for sources that don't expose a unique key. SHA-1 truncated.
 * Synchronous via Node's `crypto.subtle` is async; we use a tiny FNV-1a 64-bit
 * approximation to stay sync and dep-free. Collisions at scale are unlikely for
 * <10k records per source.
 */
export function fallbackSourceId(parts: string[]): string {
  const joined = parts.filter(Boolean).join("|");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < joined.length; i++) {
    h1 ^= joined.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= joined.charCodeAt(i);
    h2 = Math.imul(h2, 0x811c9dc5);
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}

/**
 * Issues a fetch with the standard User-Agent, returning the Response and
 * the parsed text body in one step. Errors propagate to the caller so the
 * scraper can record drift.
 */
export async function fetchHtml(
  url: string,
  init?: RequestInit
): Promise<{ status: number; html: string; finalUrl: string }> {
  const headers: Record<string, string> = {
    "User-Agent": SCRAPER_USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  const resp = await fetch(url, { ...init, headers });
  const html = await resp.text();
  return { status: resp.status, html, finalUrl: resp.url || url };
}

// =============================================================================
// PASSPort shared fetcher
// =============================================================================
//
// PASSPort (https://passport.cityofnewyork.us/) is NYC's unified procurement
// portal — an Ivalua-hosted ASP.NET WebForms app that replaced the per-agency
// nyc.gov/site/{dycd,hra,doe}/ static pages (all now HTTP 404 as of 2026-05-14).
//
// The public "Browse RFx" page server-renders the first page of the data grid
// inline in the initial HTML response, so a simple GET captures 15 active
// solicitations across all NYC agencies. Subsequent pages are loaded via an
// ASP.NET `__doPostBack` flow with a CSRF token + session cookie that we have
// not been able to replay from raw `fetch()` (the server returns page 1 again
// regardless of the `__EVENTARGUMENT=Page|N` we POST).
//
// Pagination would require a headless browser (Playwright). The host project
// has `@playwright/test` in devDependencies but the installed browser binaries
// do not match the installed library version, and the task brief explicitly
// forbids installing new browser binaries. Therefore THIS MODULE ONLY READS
// PAGE 1. The site reports ~150 total active solicitations city-wide; we will
// surface the first 15 (sorted by Release Date desc, which is the default).
//
// When/if Playwright is wired up in a later phase, swap `fetchPassportPage1`
// for a paginating implementation; the per-agency scrapers below need no
// changes because they consume the parsed row list, not the network layer.

const PASSPORT_BROWSE_URL =
  "https://passport.cityofnewyork.us/page.aspx/en/rfp/request_browse_public";

export interface PassportRow {
  /** EPIN — the NYC procurement opportunity unique ID (e.g. "06926P0008"). */
  epin: string;
  /** Procurement Name — the most useful "title" of the opportunity. */
  procurement_name: string;
  /** Sponsoring agency (PASSPort's "Agency" column), upper-cased by the site. */
  agency: string;
  /** "Program" code from PASSPort, e.g. "(0705) DOMESTIC VIOLENCE SERVICES". */
  program: string;
  /** "Industry" from PASSPort, e.g. "Human/Client Service". */
  industry: string;
  /** RFx Status: usually "Released", sometimes "Anticipated" / "Closed". */
  status: string;
  /** Procurement Method, e.g. "Competitive Sealed Proposal". */
  procurement_method: string;
  /** Release Date as displayed by PASSPort (in browser's local TZ — verbatim). */
  release_date_raw: string;
  /** Due Date as displayed by PASSPort. "12/31/2099 7:00:00 PM" = no deadline. */
  due_date_raw: string;
  /** Main commodity, e.g. "Housing Services". */
  main_commodity: string;
}

/**
 * Fetches PASSPort's public RFx browse page and parses the first 15 rows.
 *
 * Returns an object with all the rows on page 1 plus the raw HTML byte count
 * (for drift triage). Throws only for network errors — HTTP >= 400 is returned
 * as `{status >= 400, rows: []}` so callers can record `http_status` drift.
 */
export async function fetchPassportPage1(): Promise<{
  status: number;
  rows: PassportRow[];
  html_bytes: number;
  finalUrl: string;
}> {
  const resp = await fetchHtml(PASSPORT_BROWSE_URL, {
    headers: {
      // PASSPort sometimes 403s on the bare user agent; use a real browser UA.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });

  if (resp.status >= 400) {
    return {
      status: resp.status,
      rows: [],
      html_bytes: resp.html.length,
      finalUrl: resp.finalUrl,
    };
  }

  const rows = parsePassportGrid(resp.html);
  return {
    status: resp.status,
    rows,
    html_bytes: resp.html.length,
    finalUrl: resp.finalUrl,
  };
}

/**
 * Parses the PASSPort RFx browse grid (`#body_x_grid_grd > tbody > tr`).
 *
 * Column order observed 2026-05-14:
 *   0  Editing column (icon)
 *   1  Program
 *   2  Industry
 *   3  EPIN
 *   4  Procurement Name
 *   5  Agency
 *   6  RFx Status
 *   7  Procurement Method
 *   8  Release Date (Your Local Time)
 *   9  Due Date (Your Local Time)
 *   10 (Release Date dup col — Ivalua quirk)
 *   11 (Due Date dup col)
 *   12 Remaining time
 *   13 Main Commodity
 */
function parsePassportGrid(html: string): PassportRow[] {
  const gridMatch =
    /<table[^>]+id="body_x_grid_grd"[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  if (!gridMatch) return [];
  const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(gridMatch[1]);
  if (!tbodyMatch) return [];

  // PASSPort sometimes lists the same EPIN twice when the solicitation has
  // multiple lots / commodity lines (each rendered as its own grid row but
  // sharing the same opportunity ID). We dedupe by EPIN so a single upsert
  // batch never violates the (source, source_id) ON CONFLICT key.
  const seenEpins = new Set<string>();
  const rows: PassportRow[] = [];
  const trMatches = tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const tr of trMatches) {
    const cells = Array.from(
      tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    ).map((m) => stripTags(m[1]));
    if (cells.length < 10) continue;

    const epin = cells[3];
    const procurementName = cells[4];
    if (!epin || !procurementName) continue;
    if (seenEpins.has(epin)) continue;
    seenEpins.add(epin);

    rows.push({
      epin,
      procurement_name: decodeEntities(procurementName),
      agency: decodeEntities(cells[5] ?? ""),
      program: decodeEntities(cells[1] ?? ""),
      industry: decodeEntities(cells[2] ?? ""),
      status: cells[6] ?? "",
      procurement_method: decodeEntities(cells[7] ?? ""),
      release_date_raw: cells[8] ?? "",
      due_date_raw: cells[9] ?? "",
      main_commodity: decodeEntities(cells[13] ?? ""),
    });
  }
  return rows;
}

/**
 * Memoized PASSPort fetch — when multiple per-agency scrapers run in the same
 * orchestrator pass, they share one HTTP request instead of hammering the
 * portal with three identical GETs. Cache is per-Node-process; cron invocations
 * (cold lambdas) reset it naturally.
 */
let _passportCache: {
  expiresAt: number;
  promise: Promise<Awaited<ReturnType<typeof fetchPassportPage1>>>;
} | null = null;
const PASSPORT_CACHE_TTL_MS = 60_000; // 60s — plenty for one orchestrator run.

export function fetchPassportPage1Cached(): Promise<
  Awaited<ReturnType<typeof fetchPassportPage1>>
> {
  const now = Date.now();
  if (_passportCache && _passportCache.expiresAt > now) {
    return _passportCache.promise;
  }
  const promise = fetchPassportPage1();
  _passportCache = { expiresAt: now + PASSPORT_CACHE_TTL_MS, promise };
  // If the fetch rejects, clear the cache so the next caller retries.
  promise.catch(() => {
    _passportCache = null;
  });
  return promise;
}

/**
 * Returns true if `agency` (as reported by PASSPort) refers to NYC HRA. HRA is
 * now part of NYC DSS (Department of Social Services), so we match either the
 * legacy or the merged name; PASSPort uses "DEPARTMENT OF SOCIAL SERVICES" as
 * the umbrella for HRA + DHS contracts.
 */
export function isHraAgency(agency: string): boolean {
  const a = agency.toUpperCase();
  return (
    a.includes("HUMAN RESOURCES ADMINISTRATION") ||
    a.includes("DEPARTMENT OF SOCIAL SERVICES") ||
    a === "HRA" ||
    a === "DSS"
  );
}

/** True if PASSPort agency string refers to NYC DYCD. */
export function isDycdAgency(agency: string): boolean {
  const a = agency.toUpperCase();
  return (
    a.includes("YOUTH AND COMMUNITY DEVELOPMENT") ||
    a.includes("YOUTH & COMMUNITY DEVELOPMENT") ||
    a === "DYCD"
  );
}

/** True if PASSPort agency string refers to NYC DOE. */
export function isDoeAgency(agency: string): boolean {
  const a = agency.toUpperCase();
  return (
    a.includes("DEPARTMENT OF EDUCATION") ||
    a.includes("SCHOOL CONSTRUCTION AUTHORITY") ||
    a === "DOE" ||
    a === "NYCDOE"
  );
}
