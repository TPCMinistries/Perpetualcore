/**
 * Canonical RFP source catalog.
 *
 * This is the product/ops inventory for every opportunity source we run,
 * plan to run, or intentionally block. It gives ingestion, admin health, and
 * public scale claims one shared vocabulary.
 */

export type RfpSourceStatus = "live" | "planned" | "blocked";
export type RfpSourcePriority = "p0" | "p1" | "p2";
export type RfpSourceCategory =
  | "federal"
  | "state"
  | "city"
  | "foundation"
  | "corporate"
  | "research"
  | "import";
export type RfpSourceIngestMode =
  | "api"
  | "html_scrape"
  | "manual_import"
  | "licensed"
  | "curated";

export type RfpOpportunitySource =
  | "sam_gov"
  | "grants_gov"
  | "simpler_grants"
  | "sbir"
  | "fed_register"
  | "ny_state"
  | "nyc_dycd"
  | "nyc_hra"
  | "nyc_doe"
  | "nyc_passport"
  | "ca_grants"
  | "foundation_url";

export interface RfpSourceCatalogEntry {
  source: string;
  label: string;
  category: RfpSourceCategory;
  status: RfpSourceStatus;
  priority: RfpSourcePriority;
  ingestMode: RfpSourceIngestMode;
  geography: string;
  targetScale: string;
  targetIndexedEstimate: number | null;
  canonicalUrl: string | null;
  nextStep: string;
}

export const RFP_ALLOWED_OPPORTUNITY_SOURCES: RfpOpportunitySource[] = [
  "sam_gov",
  "grants_gov",
  "simpler_grants",
  "sbir",
  "fed_register",
  "ny_state",
  "nyc_dycd",
  "nyc_hra",
  "nyc_doe",
  "nyc_passport",
  "ca_grants",
  "foundation_url",
];

export const RFP_SOURCE_CATALOG: RfpSourceCatalogEntry[] = [
  {
    source: "sam_gov",
    label: "SAM.gov Contract Opportunities",
    category: "federal",
    status: "live",
    priority: "p0",
    ingestMode: "api",
    geography: "US",
    targetScale: "Federal RFPs and contract notices",
    targetIndexedEstimate: 25_000,
    canonicalUrl: "https://sam.gov/content/opportunities",
    nextStep: "Keep parser drift at zero and enrich NAICS/agency fields.",
  },
  {
    source: "grants_gov",
    label: "Grants.gov",
    category: "federal",
    status: "live",
    priority: "p0",
    ingestMode: "api",
    geography: "US",
    targetScale: "Federal grant opportunities",
    targetIndexedEstimate: 5_000,
    canonicalUrl: "https://www.grants.gov/search-grants",
    nextStep: "Verify daily ingest volume against Grants.gov published counts.",
  },
  {
    source: "simpler_grants",
    label: "Simpler Grants",
    category: "federal",
    status: "live",
    priority: "p0",
    ingestMode: "api",
    geography: "US",
    targetScale: "Federal grant API search",
    targetIndexedEstimate: 5_000,
    canonicalUrl: "https://simpler.grants.gov",
    nextStep: "Keep as a cross-check against Grants.gov records.",
  },
  {
    source: "sbir",
    label: "SBIR/STTR",
    category: "federal",
    status: "live",
    priority: "p0",
    ingestMode: "api",
    geography: "US",
    targetScale: "Innovation and research solicitations",
    targetIndexedEstimate: 4_000,
    canonicalUrl: "https://www.sbir.gov/funding",
    nextStep: "Normalize agency program phases and award ranges.",
  },
  {
    source: "fed_register",
    label: "Federal Register funding notices",
    category: "federal",
    status: "live",
    priority: "p1",
    ingestMode: "api",
    geography: "US",
    targetScale: "NOFO and policy notices",
    targetIndexedEstimate: 10_000,
    canonicalUrl: "https://www.federalregister.gov",
    nextStep: "Watch precision and add broader NOFO query terms after QA.",
  },
  {
    source: "ny_state",
    label: "New York State Contract Reporter",
    category: "state",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NY",
    targetScale: "New York State procurement",
    targetIndexedEstimate: 8_000,
    canonicalUrl: "https://www.nyscr.ny.gov",
    nextStep: "Repair source drift and confirm renewal cadence.",
  },
  {
    source: "nyc_dycd",
    label: "NYC DYCD",
    category: "city",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NYC",
    targetScale: "Youth and community development RFPs",
    targetIndexedEstimate: 500,
    canonicalUrl: "https://www.nyc.gov/site/dycd/about/contracts-rfps.page",
    nextStep: "Keep agency-specific parsing stable.",
  },
  {
    source: "nyc_doe",
    label: "NYC DOE",
    category: "city",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NYC",
    targetScale: "Education procurement and grants",
    targetIndexedEstimate: 1_000,
    canonicalUrl: "https://www.schools.nyc.gov",
    nextStep: "Add school/program taxonomy tags.",
  },
  {
    source: "nyc_hra",
    label: "NYC HRA",
    category: "city",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NYC",
    targetScale: "Human services procurement",
    targetIndexedEstimate: 500,
    canonicalUrl: "https://www.nyc.gov/site/hra/about/contracts.page",
    nextStep: "Confirm deadlines and attachment extraction.",
  },
  {
    source: "nyc_passport",
    label: "NYC PASSPort",
    category: "city",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NYC",
    targetScale: "NYC citywide procurement",
    targetIndexedEstimate: 12_000,
    canonicalUrl: "https://passport.cityofnewyork.us",
    nextStep: "Stabilize source coverage and duplicate matching.",
  },
  {
    source: "ca_grants",
    label: "California Grants Portal",
    category: "state",
    status: "live",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "CA",
    targetScale: "High-volume state grant catalog",
    targetIndexedEstimate: 12_000,
    canonicalUrl: "https://www.grants.ca.gov",
    nextStep: "Verify daily volume and dedupe federal pass-through sources.",
  },
  {
    source: "foundation_url",
    label: "Manual foundation/imported opportunities",
    category: "import",
    status: "live",
    priority: "p0",
    ingestMode: "manual_import",
    geography: "Any",
    targetScale: "User-imported foundation and private grants",
    targetIndexedEstimate: null,
    canonicalUrl: null,
    nextStep: "Add structured extraction from imported opportunity pages.",
  },
  {
    source: "nj_grants",
    label: "New Jersey grants and procurement",
    category: "state",
    status: "planned",
    priority: "p0",
    ingestMode: "html_scrape",
    geography: "NJ",
    targetScale: "Regional nonprofit and workforce expansion",
    targetIndexedEstimate: 4_000,
    canonicalUrl: "https://www.nj.gov",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "ct_grants",
    label: "Connecticut grants and procurement",
    category: "state",
    status: "planned",
    priority: "p1",
    ingestMode: "html_scrape",
    geography: "CT",
    targetScale: "Regional nonprofit and workforce expansion",
    targetIndexedEstimate: 3_000,
    canonicalUrl: "https://portal.ct.gov",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "pa_grants",
    label: "Pennsylvania grants and procurement",
    category: "state",
    status: "planned",
    priority: "p1",
    ingestMode: "html_scrape",
    geography: "PA",
    targetScale: "Regional nonprofit and workforce expansion",
    targetIndexedEstimate: 4_000,
    canonicalUrl: "https://www.pa.gov",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "nih_grants",
    label: "NIH Guide",
    category: "research",
    status: "planned",
    priority: "p1",
    ingestMode: "api",
    geography: "US",
    targetScale: "Biomedical and public health funding",
    targetIndexedEstimate: 8_000,
    canonicalUrl: "https://grants.nih.gov/funding/searchguide/index.html",
    nextStep: "Parse NIH Guide opportunities and map activity codes.",
  },
  {
    source: "nsf_grants",
    label: "NSF funding search",
    category: "research",
    status: "planned",
    priority: "p1",
    ingestMode: "api",
    geography: "US",
    targetScale: "STEM education and research funding",
    targetIndexedEstimate: 3_000,
    canonicalUrl: "https://new.nsf.gov/funding/opportunities",
    nextStep: "Build source connector and program taxonomy.",
  },
  {
    source: "irs_990_foundations",
    label: "IRS 990 foundation intelligence",
    category: "foundation",
    status: "planned",
    priority: "p1",
    ingestMode: "api",
    geography: "US",
    targetScale: "Funder discovery, not open RFP inventory",
    targetIndexedEstimate: null,
    canonicalUrl: "https://www.irs.gov/charities-non-profits",
    nextStep: "Ingest funder profiles separately from opportunity records.",
  },
  {
    source: "candid_foundation_directory",
    label: "Candid/Foundation Directory",
    category: "foundation",
    status: "blocked",
    priority: "p1",
    ingestMode: "licensed",
    geography: "US",
    targetScale: "Private foundation prospecting",
    targetIndexedEstimate: null,
    canonicalUrl: "https://candid.org",
    nextStep: "Resolve licensing/API terms before ingesting proprietary data.",
  },
  {
    source: "corporate_foundations",
    label: "Corporate foundation programs",
    category: "corporate",
    status: "planned",
    priority: "p2",
    ingestMode: "curated",
    geography: "US",
    targetScale: "CSR and corporate giving programs",
    targetIndexedEstimate: 3_000,
    canonicalUrl: null,
    nextStep: "Start with curated target list and manual QA before automation.",
  },
  {
    source: "bank_cra",
    label: "Bank CRA and community grants",
    category: "corporate",
    status: "planned",
    priority: "p2",
    ingestMode: "curated",
    geography: "US",
    targetScale: "CRA-aligned community investment programs",
    targetIndexedEstimate: 2_000,
    canonicalUrl: null,
    nextStep: "Create curated source list by geography and funding area.",
  },
];

export const RFP_SOURCE_CATALOG_BY_SOURCE = new Map(
  RFP_SOURCE_CATALOG.map((entry) => [entry.source, entry]),
);

export function getRfpSourceCatalogEntry(source: string): RfpSourceCatalogEntry {
  return (
    RFP_SOURCE_CATALOG_BY_SOURCE.get(source) ?? {
      source,
      label: source,
      category: "import",
      status: "planned",
      priority: "p2",
      ingestMode: "curated",
      geography: "Unknown",
      targetScale: "Observed source outside canonical catalog",
      targetIndexedEstimate: null,
      canonicalUrl: null,
      nextStep: "Classify this source and add it to the scale catalog.",
    }
  );
}

export function isAllowedOpportunitySource(
  source: string,
): source is RfpOpportunitySource {
  return RFP_ALLOWED_OPPORTUNITY_SOURCES.includes(source as RfpOpportunitySource);
}

export function sourceKeyToOpportunitySource(source: string): RfpOpportunitySource {
  const normalized = source === "sbir_gov" ? "sbir" : source;
  if (!isAllowedOpportunitySource(normalized)) {
    throw new Error(`Unsupported opportunity source: ${source}`);
  }
  return normalized;
}
