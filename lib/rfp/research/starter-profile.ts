/**
 * lib/rfp/research/starter-profile.ts — Pure starter capture-profile generator.
 *
 * Bug context: rfp_capture_profiles had zero rows for any org because
 * org creation never wrote one, so scoreOpportunity() always hit the
 * profile-pending path (lib/rfp/scoring/score.ts) and every opportunity
 * scored 0. This builds a reasonable non-empty default profile_json from
 * data already collected at org creation (name, type, naics,
 * capacity_summary) so first-run scores are meaningful instead of all-zero.
 *
 * Pure function — no DB, no AI, no async. Consumed by lib/rfp/orgs.ts
 * (createOrgWithOwner) and scripts/backfill-capture-profiles.ts.
 *
 * capacity_keywords must stay lowercase single words capped at 18 — the
 * scorer's keyword component (lib/rfp/scoring/score.ts) is matched/total,
 * so a bloated list dilutes every org's score.
 */

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "our", "are", "was",
  "were", "been", "being", "has", "have", "had", "will", "would", "could",
  "should", "into", "onto", "about", "over", "under", "your", "their",
  "org", "inc", "llc", "ltd", "corp", "corporation", "company",
]);

/** Lowercase, split on non-alphanumeric, keep tokens >=3 chars, drop stopwords. */
function extractTokens(text: string | null | undefined): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const tok of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (tok.length >= 3 && !STOPWORDS.has(tok)) out.push(tok);
  }
  return out;
}

/**
 * NAICS prefix → capacity keywords. Sorted longest-prefix-first below so a
 * code checks its most specific match before falling back to its broader
 * sector. 611420 bakes in both the 611 (education) and computer/technology
 * keywords directly rather than stacking two lookups.
 */
const NAICS_KEYWORD_MAP: Array<{ prefix: string; keywords: string[] }> = [
  { prefix: "611420", keywords: ["education", "training", "instruction", "computer", "technology", "digital"] },
  { prefix: "624310", keywords: ["vocational", "workforce", "training", "employment"] },
  { prefix: "541611", keywords: ["consulting", "management", "strategy"] },
  { prefix: "541612", keywords: ["consulting", "management", "strategy"] },
  { prefix: "541618", keywords: ["consulting", "management", "strategy"] },
  { prefix: "813319", keywords: ["advocacy", "community", "nonprofit"] },
  { prefix: "6242", keywords: ["community", "services", "youth", "family"] },
  { prefix: "6241", keywords: ["community", "services", "youth", "family"] },
  { prefix: "5415", keywords: ["technology", "software", "data", "ai"] },
  { prefix: "611", keywords: ["education", "training", "instruction"] },
  { prefix: "62", keywords: ["health", "healthcare"] },
  { prefix: "23", keywords: ["construction"] },
  { prefix: "3", keywords: ["manufacturing", "production"] },
].sort((a, b) => b.prefix.length - a.prefix.length);

/** Best (most specific) NAICS keyword match per code; unknown codes degrade to no keywords. */
function naicsKeywords(naics: string[]): string[] {
  const out: string[] = [];
  for (const code of naics) {
    const match = NAICS_KEYWORD_MAP.find((entry) => code.startsWith(entry.prefix));
    if (match) out.push(...match.keywords);
  }
  return out;
}

const GEO_RULES: Array<{ pattern: RegExp; geo: string[] }> = [
  { pattern: /\b(nyc|new york|bronx|brooklyn|queens|manhattan|harlem|staten island)\b/i, geo: ["NYC", "NY", "US"] },
  { pattern: /\b(new york state|albany|buffalo|rochester)\b/i, geo: ["NY", "US"] },
  { pattern: /\bcalifornia\b/i, geo: ["CA", "US"] },
  { pattern: /\bnew jersey\b/i, geo: ["NJ", "US"] },
  { pattern: /\bconnecticut\b/i, geo: ["CT", "US"] },
  { pattern: /\bpennsylvania\b/i, geo: ["PA", "US"] },
];

function detectGeoFocus(text: string): string[] {
  for (const rule of GEO_RULES) {
    if (rule.pattern.test(text)) return rule.geo;
  }
  return ["US"];
}

const MAX_KEYWORDS = 18;

export function buildStarterProfileJson(org: {
  name: string;
  type: string;
  naics: string[];
  capacity_summary: string | null;
}): Record<string, unknown> {
  const fromNaics = naicsKeywords(org.naics ?? []);
  const fromText = [
    ...extractTokens(org.capacity_summary),
    ...extractTokens(org.name),
  ];
  const capacity_keywords = Array.from(new Set([...fromNaics, ...fromText])).slice(
    0,
    MAX_KEYWORDS
  );

  const geo_focus = detectGeoFocus(`${org.capacity_summary ?? ""} ${org.name}`);

  const typical_award_band =
    org.type === "nonprofit"
      ? { min: 25_000, max: 750_000 }
      : { min: 50_000, max: 2_000_000 };

  return {
    capacity_keywords,
    geo_focus,
    typical_award_band,
    past_funders: [],
    starter: true,
    generated_at: new Date().toISOString(),
  };
}
