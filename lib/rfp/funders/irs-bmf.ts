/**
 * IRS EO Business Master File funder-profile ingest.
 *
 * Primary source: https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf
 *
 * This intentionally uses the IRS public CSV files directly instead of the
 * ProPublica Nonprofit Explorer API. ProPublica's Data Store terms are not a
 * clean fit for a paid SaaS surface; IRS BMF data is the safer primary record.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import { recordBaseline, recordDrift } from "@/lib/rfp/ingest/scrape/drift";

const SOURCE = "irs_990_foundations";
const SOURCE_PAGE =
  "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf";
const STATE_FILES = ["ct", "nj", "ny", "pa"] as const;
const PRIVATE_FOUNDATION_CODES = new Set(["02", "03", "04"]);
const MAX_PROFILES_PER_RUN = 5_000;
const UPSERT_BATCH_SIZE = 500;

interface IrsBmfRow {
  EIN: string;
  NAME: string;
  ICO: string;
  STREET: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  GROUP: string;
  SUBSECTION: string;
  AFFILIATION: string;
  CLASSIFICATION: string;
  RULING: string;
  DEDUCTIBILITY: string;
  FOUNDATION: string;
  ACTIVITY: string;
  ORGANIZATION: string;
  STATUS: string;
  TAX_PERIOD: string;
  ASSET_CD: string;
  INCOME_CD: string;
  FILING_REQ_CD: string;
  PF_FILING_REQ_CD: string;
  ACCT_PD: string;
  ASSET_AMT: string;
  INCOME_AMT: string;
  REVENUE_AMT: string;
  NTEE_CD: string;
  SORT_NAME: string;
}

export interface IrsFunderProfileInput {
  source: typeof SOURCE;
  source_id: string;
  name: string;
  ein: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  subsection_code: string | null;
  foundation_code: string | null;
  deductibility_code: string | null;
  ruling_month: string | null;
  ntee_code: string | null;
  asset_amount: number | null;
  income_amount: number | null;
  revenue_amount: number | null;
  grant_focus: string[];
  typical_amount_min: number | null;
  typical_amount_max: number | null;
  geo_focus: string[];
  source_url: string;
  raw_json: Record<string, unknown>;
}

export interface IrsFunderIngestResult {
  source: typeof SOURCE;
  fetched: number;
  upserted: number;
  errors: string[];
  duration_ms: number;
}

export async function fetchIrsBmfFunderProfiles(options?: {
  states?: readonly string[];
  maxProfiles?: number;
}): Promise<IrsFunderProfileInput[]> {
  const states = options?.states ?? STATE_FILES;
  const maxProfiles = options?.maxProfiles ?? MAX_PROFILES_PER_RUN;
  const profiles: IrsFunderProfileInput[] = [];

  for (const state of states) {
    const normalizedState = state.toLowerCase();
    const url = `https://www.irs.gov/pub/irs-soi/eo_${normalizedState}.csv`;
    let csv = "";
    let status = 0;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/csv,text/plain,*/*",
          "User-Agent":
            "PerpetualCore-RFP-Engine/1.0 (contact: lorenzo@tpcmin.org)",
        },
      });
      status = response.status;
      csv = await response.text();
    } catch (err) {
      await recordDrift({
        source: SOURCE,
        reason: "fetch_error",
        details: {
          endpoint: url,
          state: normalizedState.toUpperCase(),
          message: err instanceof Error ? err.message : String(err),
        },
      });
      continue;
    }

    if (status >= 400) {
      await recordDrift({
        source: SOURCE,
        reason: "http_status",
        details: { endpoint: url, status, state: normalizedState.toUpperCase() },
      });
      continue;
    }

    const rows = parseCsv(csv);
    if (rows.length === 0) {
      await recordDrift({
        source: SOURCE,
        reason: "zero_nodes",
        details: { endpoint: url, state: normalizedState.toUpperCase() },
      });
      continue;
    }

    for (const row of rows) {
      if (profiles.length >= maxProfiles) break;
      const profile = normalizeBmfRow(row, url);
      if (profile) profiles.push(profile);
    }

    if (profiles.length >= maxProfiles) break;
  }

  return dedupeByEin(profiles);
}

export async function runIrsBmfFunderProfileIngest(options?: {
  states?: readonly string[];
  maxProfiles?: number;
}): Promise<IrsFunderIngestResult> {
  const startedAt = Date.now();
  const errors: string[] = [];
  const profiles = await fetchIrsBmfFunderProfiles(options);
  let upserted = 0;

  if (profiles.length === 0) {
    errors.push("No IRS BMF private foundation profiles parsed.");
  } else {
    const supabase = createAdminClient() as unknown as {
      from: (table: string) => any;
    };
    const now = new Date().toISOString();
    const rows = profiles.map((profile) => ({
      ...profile,
      active_rfp_ids: [],
      last_enriched_at: now,
      updated_at: now,
    }));

    for (let start = 0; start < rows.length; start += UPSERT_BATCH_SIZE) {
      const batch = rows.slice(start, start + UPSERT_BATCH_SIZE);
      const { data, error } = await supabase
        .from("rfp_funder_profiles")
        .upsert(batch as unknown as never[], {
          onConflict: "source,source_id",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        errors.push(`upsert failed: ${error.message}`);
        await recordDrift({
          source: SOURCE,
          reason: "shape_mismatch",
          details: {
            phase: "upsert",
            message: error.message,
            batch_start: start,
          },
        }).catch(() => {});
        break;
      }
      upserted += Array.isArray(data) ? data.length : batch.length;
    }
  }

  if (profiles.length > 0) {
    await recordBaseline(SOURCE, profiles.length);
  }

  const duration_ms = Date.now() - startedAt;
  await logRfpCronExecution({
    cronName: "rfp-funder-intelligence",
    durationMs: duration_ms,
    status: errors.length === 0 ? "success" : "warning",
    result: {
      source: SOURCE,
      fetched: profiles.length,
      upserted,
      states: [...(options?.states ?? STATE_FILES)],
    },
    errors: errors.length > 0 ? { errors } : null,
  });

  return {
    source: SOURCE,
    fetched: profiles.length,
    upserted,
    errors,
    duration_ms,
  };
}

function normalizeBmfRow(
  row: Partial<IrsBmfRow>,
  sourceUrl: string,
): IrsFunderProfileInput | null {
  const ein = clean(row.EIN);
  const name = clean(row.NAME);
  const foundationCode = normalizeCode(row.FOUNDATION);
  if (!ein || !name || !PRIVATE_FOUNDATION_CODES.has(foundationCode ?? "")) {
    return null;
  }

  const state = clean(row.STATE);
  const assetAmount = toNumber(row.ASSET_AMT);
  const incomeAmount = toNumber(row.INCOME_AMT);
  const revenueAmount = toNumber(row.REVENUE_AMT);
  const ntee = clean(row.NTEE_CD);

  return {
    source: SOURCE,
    source_id: ein,
    name,
    ein,
    city: clean(row.CITY),
    state,
    zip: clean(row.ZIP),
    subsection_code: normalizeCode(row.SUBSECTION),
    foundation_code: foundationCode,
    deductibility_code: normalizeCode(row.DEDUCTIBILITY),
    ruling_month: clean(row.RULING),
    ntee_code: ntee,
    asset_amount: assetAmount,
    income_amount: incomeAmount,
    revenue_amount: revenueAmount,
    grant_focus: inferGrantFocus(ntee),
    typical_amount_min: null,
    typical_amount_max: null,
    geo_focus: state ? [state] : [],
    source_url: sourceUrl,
    raw_json: {
      source_page: SOURCE_PAGE,
      bmf_row: row,
      foundation_status: describeFoundationCode(foundationCode),
    },
  };
}

function parseCsv(csv: string): Array<Partial<IrsBmfRow>> {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0] ?? "");
  if (headers.length === 0) return [];

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row as Partial<IrsBmfRow>;
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function inferGrantFocus(ntee: string | null): string[] {
  if (!ntee) return [];
  const major = ntee[0]?.toUpperCase();
  const labels: Record<string, string> = {
    A: "arts_culture_humanities",
    B: "education",
    C: "environment",
    D: "animal_welfare",
    E: "health",
    F: "mental_health",
    G: "disease_disorders",
    H: "medical_research",
    I: "crime_legal",
    J: "employment",
    K: "food_agriculture",
    L: "housing",
    M: "public_safety",
    N: "recreation_sports",
    O: "youth_development",
    P: "human_services",
    Q: "international",
    R: "civil_rights",
    S: "community_improvement",
    T: "philanthropy",
    U: "science_technology",
    V: "social_science",
    W: "public_society_benefit",
    X: "religion",
    Y: "mutual_benefit",
    Z: "unknown",
  };
  return labels[major] ? [labels[major]] : [];
}

function describeFoundationCode(code: string | null): string {
  switch (code) {
    case "02":
      return "Private operating foundation";
    case "03":
      return "Private non-operating foundation";
    case "04":
      return "Private foundation";
    default:
      return "Not classified as private foundation for this ingest";
  }
}

function normalizeCode(value: unknown): string | null {
  const cleaned = clean(value);
  if (!cleaned) return null;
  return cleaned.padStart(2, "0");
}

function toNumber(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

function dedupeByEin(
  profiles: IrsFunderProfileInput[],
): IrsFunderProfileInput[] {
  const seen = new Set<string>();
  const out: IrsFunderProfileInput[] = [];
  for (const profile of profiles) {
    if (seen.has(profile.ein)) continue;
    seen.add(profile.ein);
    out.push(profile);
  }
  return out;
}
