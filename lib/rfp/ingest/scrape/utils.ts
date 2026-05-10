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
