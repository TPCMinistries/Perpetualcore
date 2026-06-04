/**
 * Opportunity normalizer.
 *
 * One canonical shape for any incoming opportunity record from any source.
 * Per-source fetchers (sam-gov.ts, grants-gov.ts, simpler-grants.ts, sbir.ts)
 * each return `OpportunityInput[]`; the orchestrator (run.ts) calls
 * `normalizeOpportunity()` to produce the row shape that gets upserted into
 * `rfp_opportunities`.
 *
 * Schema reference: supabase/migrations/20260509_rfp_schema.sql + the Phase 05-01
 * extensions in 20260510_rfp_opportunities_extensions.sql.
 */

import { z } from "zod";
import type { RfpSourceName } from "@/lib/rfp/sources";
import {
  RFP_ALLOWED_OPPORTUNITY_SOURCES,
  sourceKeyToOpportunitySource,
  type RfpOpportunitySource,
} from "@/lib/rfp/source-catalog";

/**
 * The schema enum on rfp_opportunities.source. Note `sbir` (NOT `sbir_gov`).
 * Registry source keys (RfpSourceName) include `sbir_gov`; we map below.
 */
export type OpportunitySourceEnum = RfpOpportunitySource;

/**
 * Map registry source keys -> schema enum values.
 * Only sbir_gov differs; others are identity mappings.
 */
export function sourceKeyToEnum(name: string): OpportunitySourceEnum {
  return sourceKeyToOpportunitySource(name);
}

/**
 * The shape a per-source fetcher must return for each opportunity.
 *
 * Fetchers should populate as many fields as the source provides. The orchestrator
 * runs Zod validation per record; missing-but-required fields cause that record
 * to be dropped from the run with an error logged (not the whole batch).
 */
export interface OpportunityInput {
  /** Registry key (e.g. "grants_gov", "sbir_gov"). Normalizer maps to schema enum. */
  source: RfpSourceName | RfpOpportunitySource;
  /** Source-native ID (string). Combined with source for unique upsert key. */
  source_id: string;
  title: string;
  agency?: string | null;
  /** Solicitation type (e.g. "Grant", "Cooperative Agreement", "SBIR Phase I"). */
  type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  deadline?: string | null; // ISO timestamp
  posted_at?: string | null; // ISO timestamp
  /** 1-2 sentence summary; truncate at fetcher level if needed (we cap at 1000 here). */
  brief?: string | null;
  keywords?: string[];
  /** Geography string; free-form. "US", "NY", "NYC", country code, etc. */
  geo?: string | null;
  url?: string | null;
  /** True when normalization could not fill all expected fields (Phase 05-05 hook). */
  needs_review?: boolean;
  /** Source's full payload for forensics + future reprocessing. */
  raw_json: Record<string, unknown>;
}

/**
 * Zod schema mirrors the OpportunityInput contract. Used to fail fast on a
 * malformed record from a source — orchestrator catches and logs the rejection.
 */
const opportunityInputSchema = z.object({
  source: z
    .string()
    .refine(
      (value) =>
        value === "sbir_gov" ||
        RFP_ALLOWED_OPPORTUNITY_SOURCES.includes(value as RfpOpportunitySource),
      "source is not in the canonical RFP source catalog",
    ),
  source_id: z.string().min(1, "source_id is required"),
  title: z.string().min(1, "title is required"),
  agency: z.string().nullish(),
  type: z.string().nullish(),
  amount_min: z.number().nullish(),
  amount_max: z.number().nullish(),
  deadline: z.string().nullish(),
  posted_at: z.string().nullish(),
  brief: z.string().nullish(),
  keywords: z.array(z.string()).optional(),
  geo: z.string().nullish(),
  url: z.string().nullish(),
  needs_review: z.boolean().optional(),
  raw_json: z.record(z.string(), z.unknown()),
});

/**
 * The row shape ready for upsert into rfp_opportunities.
 * `source` is the SCHEMA enum value (after sbir_gov -> sbir mapping).
 */
export interface OpportunityRow {
  source: OpportunitySourceEnum;
  source_id: string;
  title: string;
  agency: string | null;
  type: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  posted_at: string | null;
  brief: string | null;
  keywords: string[];
  geo: string | null;
  url: string | null;
  needs_review: boolean;
  last_seen_at: string;
  raw_json: Record<string, unknown>;
}

/** Coerce something that might be a number, string, or null into number | null. */
function coerceNumber(input: unknown): number | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "string") {
    const cleaned = input.replace(/[$,]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Best-effort ISO coercion. Accepts ISO, MM/DD/YYYY, YYYY-MM-DD, or epoch ms. */
function coerceIso(input: unknown): string | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Already ISO?
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  return null;
}

/** Normalize keywords: lowercase, trim, dedupe, drop empties. Cap to 25 entries. */
function normalizeKeywords(input: string[] | undefined): string[] {
  if (!input || input.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const k = raw.toLowerCase().trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= 25) break;
  }
  return out;
}

/**
 * Truncate a brief to a safe storage size; defensive against pathological inputs.
 * 1000 chars is more than enough for a 1-2 sentence summary; UI can re-truncate
 * to 280 chars or whatever the feed row needs.
 */
function truncateBrief(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 1000) return trimmed;
  return trimmed.slice(0, 1000);
}

/**
 * Normalize an OpportunityInput into the rfp_opportunities row shape.
 *
 * Throws if the input fails the Zod schema (caller catches at orchestrator level
 * and logs the rejection without breaking the whole run).
 */
export function normalizeOpportunity(input: OpportunityInput): OpportunityRow {
  const parsed = opportunityInputSchema.parse(input);
  return {
    source: sourceKeyToEnum(parsed.source),
    source_id: parsed.source_id,
    title: parsed.title.trim(),
    agency: parsed.agency?.trim() || null,
    type: parsed.type?.trim() || null,
    amount_min: coerceNumber(parsed.amount_min),
    amount_max: coerceNumber(parsed.amount_max),
    deadline: coerceIso(parsed.deadline),
    posted_at: coerceIso(parsed.posted_at),
    brief: truncateBrief(parsed.brief ?? null),
    keywords: normalizeKeywords(parsed.keywords),
    geo: parsed.geo?.trim() || null,
    url: parsed.url?.trim() || null,
    needs_review: parsed.needs_review ?? false,
    last_seen_at: new Date().toISOString(),
    raw_json: parsed.raw_json,
  };
}

/**
 * Tiny title-keyword extractor used by per-source fetchers. Splits on whitespace
 * and punctuation, lowercases, drops short tokens, drops common stopwords.
 * Optional helper — fetchers may use their own logic.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "will",
  "have", "has", "had", "not", "but", "you", "all", "any", "can", "her",
  "his", "their", "our", "your", "into", "out", "of", "to", "in", "on", "at",
  "by", "as", "an", "a", "or", "is", "be", "it", "its", "if", "we",
  "rfp", "rfa", "fy", "year", "fiscal",
]);

export function extractTitleKeywords(title: string, max = 8): string[] {
  if (!title) return [];
  const tokens = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
