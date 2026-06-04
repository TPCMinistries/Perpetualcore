export interface SourceAlias {
  source: string;
  source_id: string;
  opp_id: string;
  confidence: number;
}

export interface OpportunityCanonicalMetadata {
  canonical_id: string;
  canonical_primary_opp_id: string | null;
  duplicate_count: number;
  source_aliases: SourceAlias[];
}

interface AliasRow {
  opp_id: string;
  canonical_id: string;
  source: string;
  source_id: string;
  confidence: number | string | null;
}

interface CanonicalRow {
  id: string;
  primary_opp_id: string | null;
}

interface RfpReadClient {
  from(table: string): any;
}

function asConfidence(input: number | string | null): number {
  if (typeof input === "number") return input;
  if (typeof input === "string") {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function loadCanonicalMetadataForOpps(
  client: RfpReadClient,
  oppIds: string[],
): Promise<Map<string, OpportunityCanonicalMetadata>> {
  const uniqueOppIds = Array.from(new Set(oppIds.filter(Boolean)));
  if (uniqueOppIds.length === 0) return new Map();

  const { data: seedAliases, error: seedError } = await client
    .from("rfp_opportunity_aliases")
    .select("opp_id, canonical_id, source, source_id, confidence")
    .in("opp_id", uniqueOppIds);

  if (seedError) {
    throw new Error(`canonical_seed_aliases_failed: ${seedError.message}`);
  }

  const seedRows = (seedAliases ?? []) as AliasRow[];
  const canonicalIds = Array.from(
    new Set(seedRows.map((row) => row.canonical_id).filter(Boolean)),
  );
  if (canonicalIds.length === 0) return new Map();

  const [{ data: allAliases, error: aliasesError }, { data: canonicals, error: canonicalsError }] =
    await Promise.all([
      client
        .from("rfp_opportunity_aliases")
        .select("opp_id, canonical_id, source, source_id, confidence")
        .in("canonical_id", canonicalIds),
      client
        .from("rfp_opportunity_canonicals")
        .select("id, primary_opp_id")
        .in("id", canonicalIds),
    ]);

  if (aliasesError) {
    throw new Error(`canonical_aliases_failed: ${aliasesError.message}`);
  }
  if (canonicalsError) {
    throw new Error(`canonical_rows_failed: ${canonicalsError.message}`);
  }

  const canonicalById = new Map(
    ((canonicals ?? []) as CanonicalRow[]).map((row) => [row.id, row]),
  );
  const aliasesByCanonical = new Map<string, SourceAlias[]>();
  for (const row of (allAliases ?? []) as AliasRow[]) {
    const list = aliasesByCanonical.get(row.canonical_id) ?? [];
    list.push({
      source: row.source,
      source_id: row.source_id,
      opp_id: row.opp_id,
      confidence: asConfidence(row.confidence),
    });
    aliasesByCanonical.set(row.canonical_id, list);
  }

  const result = new Map<string, OpportunityCanonicalMetadata>();
  for (const row of seedRows) {
    const aliases = aliasesByCanonical.get(row.canonical_id) ?? [];
    const canonical = canonicalById.get(row.canonical_id);
    result.set(row.opp_id, {
      canonical_id: row.canonical_id,
      canonical_primary_opp_id: canonical?.primary_opp_id ?? null,
      duplicate_count: Math.max(0, aliases.length - 1),
      source_aliases: aliases.sort((a, b) => {
        if (a.source !== b.source) return a.source.localeCompare(b.source);
        return a.source_id.localeCompare(b.source_id);
      }),
    });
  }

  return result;
}
