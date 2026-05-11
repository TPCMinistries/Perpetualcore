/**
 * Phase 05-05 — Quick Import: URL fetcher.
 *
 * Single entry point: `fetchUrlContent(url)`. Handles HTML, PDF, and DOCX
 * URLs through one pipeline. Returns plain text (capped at 100 KB) plus the
 * detected content type so downstream extraction can adapt prompts if useful.
 *
 * Design notes:
 *   - No new npm dependency. We reuse what Phase 4 + 5 already pulled in:
 *     `pdf-parse` for PDFs, `mammoth` for DOCX. HTML uses the same regex-based
 *     strip the state/city scrapers use (`lib/rfp/ingest/scrape/utils.ts`) so
 *     Vercel cold-start stays cheap and we don't introduce a cheerio dep.
 *   - 15s timeout, 10 MB byte cap. Both enforced via AbortController + manual
 *     accumulator. We don't trust Content-Length alone (some servers lie).
 *   - URL validation is strict: must parse, scheme must be http/https. Throws
 *     a typed `URL_INVALID` error code so the orchestrator can surface a
 *     friendly UI message.
 *   - On unknown content types we still return best-effort text via stripTags.
 *     The extractor will downgrade confidence appropriately.
 */

import { stripTags, SCRAPER_USER_AGENT } from "@/lib/rfp/ingest/scrape/utils";

// ── Public types ─────────────────────────────────────────────────────────────

export type FetchedContentType = "html" | "pdf" | "docx" | "unknown";

export interface FetchedContent {
  url: string;
  finalUrl: string;
  contentType: FetchedContentType;
  /** Plain text after parse, capped at MAX_TEXT_CHARS. May be empty on parse failure. */
  text: string;
  /** Bytes read from the wire (pre-parse). Useful for telemetry. */
  size: number;
  /** True when the text was truncated to MAX_TEXT_CHARS. */
  truncated: boolean;
}

// ── Limits ───────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB hard cap
const MAX_TEXT_CHARS = 100_000; // Post-parse text cap

// ── Errors ───────────────────────────────────────────────────────────────────

export class QuickImportFetchError extends Error {
  public readonly code:
    | "URL_INVALID"
    | "HTTP_ERROR"
    | "TIMEOUT"
    | "TOO_LARGE"
    | "PARSE_FAILED"
    | "NETWORK";
  public readonly status?: number;
  constructor(
    code: QuickImportFetchError["code"],
    message: string,
    opts?: { status?: number; cause?: unknown }
  ) {
    super(message);
    this.name = "QuickImportFetchError";
    this.code = code;
    if (opts?.status !== undefined) this.status = opts.status;
    if (opts?.cause !== undefined) {
      (this as { cause?: unknown }).cause = opts.cause;
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateHttpUrl(input: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new QuickImportFetchError("URL_INVALID", "URL did not parse");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new QuickImportFetchError(
      "URL_INVALID",
      `URL scheme must be http or https (got '${parsed.protocol}')`
    );
  }
  return parsed;
}

/**
 * Map a raw Content-Type header to our internal enum. We look only at the
 * media type prefix so charset / boundary params don't trip us.
 */
function classifyContentType(raw: string | null, urlPath: string): FetchedContentType {
  const ct = (raw ?? "").toLowerCase().split(";")[0]!.trim();
  if (ct.includes("html")) return "html";
  if (ct === "application/pdf" || ct === "application/x-pdf") return "pdf";
  if (
    ct ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ct === "application/msword"
  ) {
    return "docx";
  }
  // Fall back on URL extension when the server is unhelpful (very common
  // for static government file hosts that send octet-stream).
  const lower = urlPath.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  return "unknown";
}

/**
 * Reads the response body with a hard byte cap and aggregates into a single
 * Buffer. Returning early at MAX_BYTES means we never page in a 1 GB PDF.
 *
 * Why not just rely on Content-Length? Some servers stream chunked and never
 * send one; others lie. This pattern matches what the scrape utils do for
 * HTML, generalized to binary.
 */
async function readBodyCapped(response: Response): Promise<{
  bytes: Buffer;
  truncated: boolean;
}> {
  if (!response.body) {
    return { bytes: Buffer.alloc(0), truncated: false };
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  // Stream until done or cap hit.
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      truncated = true;
      // Cancel further reads from the upstream and stop.
      try {
        await reader.cancel();
      } catch {
        // ignore — we're done either way
      }
      break;
    }
    chunks.push(value);
  }
  return { bytes: Buffer.concat(chunks.map((c) => Buffer.from(c))), truncated };
}

/**
 * Lazy import for pdf-parse — keeps the cold-start cheap when the user is
 * only pasting HTML URLs.
 */
async function pdfToText(bytes: Buffer): Promise<string> {
  try {
    // pdf-parse exports a default function in CJS form. Using dynamic import
    // keeps the Edge runtime happy if this lib is ever pulled in elsewhere.
    const mod = (await import("pdf-parse")) as unknown as {
      default?: (b: Buffer) => Promise<{ text: string }>;
    } & ((b: Buffer) => Promise<{ text: string }>);
    const fn = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
    const out = await fn(bytes);
    return (out?.text ?? "").trim();
  } catch (e) {
    throw new QuickImportFetchError(
      "PARSE_FAILED",
      `pdf-parse failed: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
}

/**
 * DOCX → plain text via mammoth. `extractRawText` is the cheapest path and
 * is enough for an LLM extractor (we don't need styling fidelity).
 */
async function docxToText(bytes: Buffer): Promise<string> {
  try {
    const mod = (await import("mammoth")) as unknown as {
      extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
    };
    const out = await mod.extractRawText({ buffer: bytes });
    return (out?.value ?? "").trim();
  } catch (e) {
    throw new QuickImportFetchError(
      "PARSE_FAILED",
      `mammoth failed: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
}

/**
 * HTML → plain text using the same regex stripper the state/city scrapers
 * use. Drops <script> and <style> blocks first so we don't feed JS source
 * into the LLM, then collapses tags.
 */
function htmlToText(bytes: Buffer): string {
  const html = bytes.toString("utf8");
  const noScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  return stripTags(noScripts);
}

function capText(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_TEXT_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_TEXT_CHARS), truncated: true };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch a URL and return plain text suitable for LLM extraction.
 *
 * Throws `QuickImportFetchError` with one of:
 *   - URL_INVALID — URL didn't parse or scheme isn't http/https
 *   - HTTP_ERROR — status >= 400
 *   - TIMEOUT — exceeded FETCH_TIMEOUT_MS
 *   - TOO_LARGE — body exceeded MAX_BYTES before parse could begin
 *   - PARSE_FAILED — pdf-parse / mammoth failed on the bytes
 *   - NETWORK — fetch itself threw (DNS, connection refused, etc.)
 */
export async function fetchUrlContent(url: string): Promise<FetchedContent> {
  const parsed = validateHttpUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        "User-Agent": SCRAPER_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") {
      throw new QuickImportFetchError(
        "TIMEOUT",
        `URL fetch timed out after ${FETCH_TIMEOUT_MS}ms`
      );
    }
    throw new QuickImportFetchError(
      "NETWORK",
      `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status >= 400) {
    throw new QuickImportFetchError(
      "HTTP_ERROR",
      `Source returned HTTP ${response.status}`,
      { status: response.status }
    );
  }

  const { bytes, truncated: bytesTruncated } = await readBodyCapped(response);
  if (bytesTruncated && bytes.length === 0) {
    // Should not happen — TOO_LARGE means we read at least MAX_BYTES, but
    // guard anyway so we never silently swallow an empty body.
    throw new QuickImportFetchError(
      "TOO_LARGE",
      `Body exceeded ${MAX_BYTES} byte cap`
    );
  }

  const contentType = classifyContentType(
    response.headers.get("content-type"),
    parsed.pathname
  );

  let rawText = "";
  if (contentType === "pdf") {
    rawText = await pdfToText(bytes);
  } else if (contentType === "docx") {
    rawText = await docxToText(bytes);
  } else if (contentType === "html") {
    rawText = htmlToText(bytes);
  } else {
    // Best-effort: try HTML strip first; if that yields nothing meaningful,
    // fall back to raw UTF-8 decode (capped). The extractor will see what
    // it sees and may flag the result as low confidence.
    const stripped = htmlToText(bytes);
    rawText = stripped.length > 40 ? stripped : bytes.toString("utf8");
  }

  const { text, truncated: textTruncated } = capText(rawText);
  if (textTruncated) {
    console.warn(
      `[quick-import/fetch] text truncated to ${MAX_TEXT_CHARS} chars (url=${parsed.toString()}, contentType=${contentType})`
    );
  }

  return {
    url: parsed.toString(),
    finalUrl: response.url || parsed.toString(),
    contentType,
    text,
    size: bytes.length,
    truncated: bytesTruncated || textTruncated,
  };
}
