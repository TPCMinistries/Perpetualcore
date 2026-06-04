/**
 * Canonical opportunity clustering for ingest.
 *
 * Source feeds often repost the same federal opportunity under different local
 * IDs. We keep every source row, then attach it to a canonical cluster so UI
 * and scoring can collapse duplicates later without losing source provenance.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { OpportunityRow } from "@/lib/rfp/ingest/normalize";

export interface OpportunityRowWithId extends OpportunityRow {
  id: string;
}

export interface CanonicalAliasResult {
  aliases_upserted: number;
  canonicals_seen: number;
  errors: string[];
}

interface CanonicalCandidate {
  canonical_key: string;
  opportunity: OpportunityRowWithId;
  confidence: number;
  evidence: Record<string, unknown>;
}

interface CanonicalRow {
  id: string;
  canonical_key: string;
}

const FEDERAL_SOURCES = new Set([
  "grants_gov",
  "nih_grants",
  "nsf_grants",
  "fed_register",
]);

function cleanIdentifier(input: unknown): string | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const cleaned = String(input)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || null;
}

function cleanTitle(input: string): string {
  return input
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function grantsGovIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const match = /grants\.gov\/search-results-detail\/([0-9]+)/i.exec(url);
  return match?.[1] ?? null;
}

function readRawString(row: OpportunityRow, key: string): string | null {
  const value = row.raw_json[key];
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return null;
}

export function deriveOpportunityCanonicalKey(
  row: OpportunityRow,
): { key: string; confidence: number; evidence: Record<string, unknown> } {
  const grantsGovId =
    cleanIdentifier(readRawString(row, "id")) ??
    cleanIdentifier(grantsGovIdFromUrl(row.url));
  if (grantsGovId && FEDERAL_SOURCES.has(row.source)) {
    return {
      key: `grants_gov:${grantsGovId}`,
      confidence: 0.98,
      evidence: { match: "grants_gov_id", grants_gov_id: grantsGovId },
    };
  }

  const opportunityNumber =
    cleanIdentifier(readRawString(row, "number")) ??
    cleanIdentifier(readRawString(row, "opportunityNumber")) ??
    cleanIdentifier(row.source_id);
  if (opportunityNumber) {
    return {
      key: `opportunity_number:${opportunityNumber}`,
      confidence: 0.9,
      evidence: { match: "opportunity_number", opportunity_number: opportunityNumber },
    };
  }

  const titleKey = cleanTitle(row.title);
  const agencyKey = cleanTitle(row.agency ?? "");
  return {
    key: `title:${agencyKey}:${titleKey}`,
    confidence: 0.72,
    evidence: { match: "title_agency", title: titleKey, agency: agencyKey },
  };
}

export async function persistCanonicalAliases(
  opportunities: OpportunityRowWithId[],
): Promise<CanonicalAliasResult> {
  if (opportunities.length === 0) {
    return { aliases_upserted: 0, canonicals_seen: 0, errors: [] };
  }

  const candidates: CanonicalCandidate[] = opportunities.map((opportunity) => {
    const derived = deriveOpportunityCanonicalKey(opportunity);
    return {
      canonical_key: derived.key,
      opportunity,
      confidence: derived.confidence,
      evidence: derived.evidence,
    };
  });

  const canonicalPayload = Array.from(
    new Map(candidates.map((candidate) => [candidate.canonical_key, candidate])).values(),
  ).map((candidate) => ({
    canonical_key: candidate.canonical_key,
    primary_opp_id: candidate.opportunity.id,
    title: candidate.opportunity.title,
    agency: candidate.opportunity.agency,
    updated_at: new Date().toISOString(),
  }));

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      upsert: (
        values: unknown,
        options?: { onConflict?: string; ignoreDuplicates?: boolean },
      ) => {
        select: (columns: string) => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };

  const { data: canonicalData, error: canonicalError } = await supabase
    .from("rfp_opportunity_canonicals")
    .upsert(canonicalPayload, {
      onConflict: "canonical_key",
      ignoreDuplicates: false,
    })
    .select("id, canonical_key");

  if (canonicalError) {
    return {
      aliases_upserted: 0,
      canonicals_seen: 0,
      errors: [`canonical_upsert: ${canonicalError.message}`],
    };
  }

  const canonicalRows = (canonicalData ?? []) as CanonicalRow[];
  const canonicalIds = new Map(
    canonicalRows.map((row) => [row.canonical_key, row.id]),
  );

  const aliasPayload = candidates
    .map((candidate) => {
      const canonicalId = canonicalIds.get(candidate.canonical_key);
      if (!canonicalId) return null;
      return {
        canonical_id: canonicalId,
        opp_id: candidate.opportunity.id,
        source: candidate.opportunity.source,
        source_id: candidate.opportunity.source_id,
        confidence: candidate.confidence,
        evidence: candidate.evidence,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const { data: aliasData, error: aliasError } = await supabase
    .from("rfp_opportunity_aliases")
    .upsert(aliasPayload, {
      onConflict: "opp_id",
      ignoreDuplicates: false,
    })
    .select("opp_id");

  if (aliasError) {
    return {
      aliases_upserted: 0,
      canonicals_seen: canonicalRows.length,
      errors: [`alias_upsert: ${aliasError.message}`],
    };
  }

  return {
    aliases_upserted: ((aliasData ?? []) as unknown[]).length || aliasPayload.length,
    canonicals_seen: canonicalRows.length,
    errors: [],
  };
}
