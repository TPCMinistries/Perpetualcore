/**
 * Rich Profile Builder — agentic web-search upgrade of a starter capture profile.
 *
 * buildStarterProfileJson (starter-profile.ts) produces a deterministic
 * profile from data already on hand at org creation (name/type/NAICS/summary)
 * so scoring never sees an empty profile. This module goes further: it runs
 * ONE Claude session with the server-side web_search tool to actually
 * identify the org on the live web and produce a fuller profile (mission,
 * programs, populations served, past funders, a written capacity narrative)
 * — the same "one session, forced final tool" shape as agent.ts's
 * runVerticalAgent, but finalizing on `submit_profile` instead of
 * `submit_leads`.
 *
 * Disambiguation is the whole risk here: a wrong-org profile silently
 * corrupts every future score, so identified=false (kept starter, not
 * upgraded) is treated as a normal, expected outcome — not an error.
 *
 * ProPublica: NEVER call the ProPublica API or scrape propublica.org from
 * this agent — that data is licensed and off-limits for this product.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { computeCostUsd, guardedLLMCall } from "@/lib/rfp/ai/guardrail";
import { recomputeAllForOrg } from "@/lib/rfp/scoring/recompute";
import { WEB_SEARCH_USD_PER_SEARCH } from "./agent";

const AGENT_NAME = "profile_builder_v1";
const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 4_096;
const MAX_SEARCHES = 6;
const MAX_CONTINUATIONS = 4;

// ── Untyped admin handle (rfp_* tables aren't in database.types.ts yet) ────
// Matches the pattern in lib/rfp/scoring/recompute.ts's rfpAdmin().
function rfpAdmin(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

// ── Submission shape (submit_profile tool_use input) ───────────────────────

export interface ProfileSubmission {
  identified: boolean;
  website: string | null;
  mission: string;
  programs: string[];
  populations_served: string[];
  capacity_keywords: string[];
  geo_focus: string[];
  typical_award_min: number | null;
  typical_award_max: number | null;
  past_funders: string[];
  capacity_narrative: string;
  sources: string[];
}

const MAX_KEYWORDS = 18;
const MAX_FUNDERS = 12;

// Glue words that pass the >=3-char rule but carry zero matching signal for
// the keyword-overlap scorer (score.ts matches profile keywords against opp
// title/brief tokens — "and" matching everywhere inflates nothing but noise).
const KEYWORD_STOPWORDS = new Set([
  "and", "the", "for", "with", "from", "into", "that", "this", "their",
  "our", "its", "are", "was", "were", "will", "can", "all", "more",
  "other", "through", "across", "also", "org", "inc", "non", "not",
]);

/** Lowercase, tokenize, dedupe, drop <3-char tokens + stopwords, clamp to MAX_KEYWORDS. */
function normalizeKeywordTokens(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    for (const tok of entry.toLowerCase().split(/[^a-z0-9]+/)) {
      if (tok.length < 3 || KEYWORD_STOPWORDS.has(tok) || seen.has(tok)) continue;
      seen.add(tok);
      out.push(tok);
      if (out.length >= MAX_KEYWORDS) return out;
    }
  }
  return out;
}

// The scorer (lib/rfp/scoring/score.ts geo component) matches opp.geo codes
// like "US"/"NY"/"NYC" case-insensitively and treats any focus entry of <=5
// chars as a US sub-region. Long-form names ("UNITED STATES") or non-code
// regions ("GLOBAL SOUTH") silently zero the geo score, so we map what we
// can to codes and drop what we can't — international scope belongs in the
// narrative, not in geo_focus.
const GEO_NAME_TO_CODE: Record<string, string> = {
  "UNITED STATES": "US", "UNITED STATES OF AMERICA": "US", "USA": "US",
  "U.S.": "US", "AMERICA": "US", "NATIONAL": "US", "NATIONWIDE": "US",
  "NEW YORK CITY": "NYC", "BRONX": "NYC", "BROOKLYN": "NYC", "QUEENS": "NYC",
  "MANHATTAN": "NYC", "STATEN ISLAND": "NYC", "HARLEM": "NYC",
  "NEW YORK": "NY", "NEW YORK STATE": "NY",
  "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
  "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
  "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
  "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
  "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
  "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN",
  "MISSISSIPPI": "MS", "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE",
  "NEVADA": "NV", "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND",
  "OHIO": "OH", "OKLAHOMA": "OK", "OREGON": "OR", "PENNSYLVANIA": "PA",
  "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD",
  "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT", "VERMONT": "VT",
  "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
  "WISCONSIN": "WI", "WYOMING": "WY",
  "WASHINGTON DC": "DC", "WASHINGTON, D.C.": "DC", "DISTRICT OF COLUMBIA": "DC",
};

/**
 * Map long-form geo names to scorer codes; keep short codes as-is; drop
 * anything unmappable and longer than 5 chars. Always ensures "US" is
 * present (federal opps carry geo='US' and exact match beats the 0.5
 * sub-region heuristic). Defaults ["US"].
 */
function normalizeGeoFocus(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const upper = entry.trim().toUpperCase();
    if (!upper) continue;
    const code = GEO_NAME_TO_CODE[upper] ?? (upper.length <= 5 ? upper : null);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  if (!seen.has("US")) out.push("US");
  return out;
}

/** Only a real band when both bounds are positive numbers and min < max. */
function normalizeAwardBand(
  min: number | null | undefined,
  max: number | null | undefined
): { min: number; max: number } | null {
  if (typeof min !== "number" || typeof max !== "number") return null;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min <= 0 || max <= 0) return null;
  if (min >= max) return null;
  return { min, max };
}

// Generic descriptions the agent sometimes returns instead of funder names
// ("Government agencies (mentioned as workforce cohort funders)"). The
// past-funder scorer does substring matching against opp.agency, so generic
// strings poison it — only proper names earn a slot.
const GENERIC_FUNDER_RE =
  /^(government|federal|state|local|city|universit|foundation|international organization|corporate|various|multiple|individual|donor|philanthrop|grantmaker|agencies)/i;

/** Dedupe by case-insensitive name, drop generic/parenthetical descriptions, cap at MAX_FUNDERS. */
function dedupeFunders(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const name = entry.trim();
    if (!name || name.includes("(") || GENERIC_FUNDER_RE.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_FUNDERS) break;
  }
  return out;
}

/** The prior profile_json fields the mapper falls back to / merges with. */
export interface PrevProfileJson {
  capacity_keywords?: string[];
  geo_focus?: string[];
  typical_award_band?: { min: number; max: number } | null;
  past_funders?: string[];
}

/**
 * Pure mapper: ProfileSubmission -> rfp_capture_profiles.profile_json shape.
 * Matches the fields loadLatestProfile() reads (capacity_keywords, geo_focus,
 * typical_award_band, past_funders) plus rich-profile extras carried through
 * for the UI/prompting layer (capacity_narrative, sources, rich flag).
 *
 * `prev` (the starter or prior profile) is a floor, not history: rich
 * keywords lead but starter keywords fill remaining slots (NAICS-derived
 * terms like "cna"/"nursing" survive an org whose website speaks in brand
 * language), and band/geo/funders fall back to prev when research came back
 * empty — a rich profile must never score WORSE than the starter it replaces.
 */
export function mapSubmissionToProfileJson(
  sub: ProfileSubmission,
  prev?: PrevProfileJson | null
): Record<string, unknown> {
  // Reserve slots for prior-profile keywords: rich terms lead (better
  // quality) but NAICS/starter-derived core terms like "cna"/"nursing" must
  // survive an org whose website doesn't use them.
  const RICH_KEYWORD_SLOTS = 12;
  const richKeywords = normalizeKeywordTokens(sub.capacity_keywords ?? []).slice(
    0,
    RICH_KEYWORD_SLOTS
  );
  const mergedKeywords = normalizeKeywordTokens([
    ...richKeywords,
    ...(prev?.capacity_keywords ?? []),
  ]);

  // Geo is a union with the prior profile — research may widen geography but
  // must never narrow it (an agent that reports only national scope would
  // otherwise zero the org's home-city geo score).
  const geo = normalizeGeoFocus([
    ...(sub.geo_focus ?? []),
    ...(prev?.geo_focus ?? []),
  ]);

  const band =
    normalizeAwardBand(sub.typical_award_min, sub.typical_award_max) ??
    prev?.typical_award_band ??
    null;

  const funders = dedupeFunders(sub.past_funders ?? []);
  const mergedFunders = funders.length > 0 ? funders : dedupeFunders(prev?.past_funders ?? []);

  return {
    capacity_keywords: mergedKeywords,
    geo_focus: geo,
    typical_award_band: band,
    past_funders: mergedFunders,
    capacity_narrative:
      typeof sub.capacity_narrative === "string" ? sub.capacity_narrative : "",
    website: sub.website,
    mission: sub.mission,
    programs: sub.programs,
    populations_served: sub.populations_served,
    rich: true,
    generated_at: new Date().toISOString(),
    sources: Array.isArray(sub.sources)
      ? sub.sources.filter((s): s is string => typeof s === "string")
      : [],
  };
}

// ── Anthropic session (agent.ts pattern, finalizing on submit_profile) ─────

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

const SUBMIT_PROFILE_TOOL: Anthropic.Tool = {
  name: "submit_profile",
  description:
    "Submit the researched capture profile for this organization. Call exactly once. If you cannot confidently identify THIS specific organization (matching name, type, and location/NAICS signals), set identified=false, leave the other fields as best-effort or empty, and stop searching.",
  input_schema: {
    type: "object" as const,
    properties: {
      identified: { type: "boolean" },
      website: { type: ["string", "null"] },
      mission: { type: "string" },
      programs: { type: "array", items: { type: "string" } },
      populations_served: { type: "array", items: { type: "string" } },
      capacity_keywords: {
        type: "array",
        items: { type: "string" },
        description:
          "12-18 single lowercase SEARCH keywords describing fundable program work (e.g. workforce, healthcare, nursing, training, youth, reentry) — terms a grant database would match. NOT brand or vision language (never words like venture, studios, formation, innovation).",
      },
      geo_focus: {
        type: "array",
        items: { type: "string" },
        description:
          "Short region CODES only — the scoring engine matches codes, not names. Allowed: US, NYC, or a 2-letter US state code (NY, CA, NJ...). Use US for national scope. International work belongs in capacity_narrative, never here.",
      },
      typical_award_min: {
        type: ["number", "null"],
        description:
          "Estimate from actual grants/contracts you saw evidence of; null if none visible.",
      },
      typical_award_max: { type: ["number", "null"] },
      past_funders: {
        type: "array",
        items: { type: "string" },
        description:
          "SPECIFIC funder names only (e.g. 'NYC DYCD', 'Robin Hood Foundation'). Never generic descriptions like 'government agencies' — omit if unknown.",
      },
      capacity_narrative: {
        type: "string",
        description:
          "4-6 sentences, third person, focused on the org's fundable capacity",
      },
      sources: { type: "array", items: { type: "string" } },
    },
    required: [
      "identified",
      "mission",
      "programs",
      "populations_served",
      "capacity_keywords",
      "geo_focus",
      "past_funders",
      "capacity_narrative",
      "sources",
    ],
  },
};

interface ProfileAgentOrgInput {
  name: string;
  type: string;
  naics: string[];
  capacity_summary: string | null;
}

interface ProfileAgentResult {
  submission: ProfileSubmission | null;
  tokensIn: number;
  tokensOut: number;
  searchesUsed: number;
  error?: string;
}

function isProfileSubmissionShaped(v: unknown): v is Record<string, unknown> {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.identified === "boolean" && typeof o.mission === "string";
}

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

function extractSubmission(content: Anthropic.ContentBlock[]): ProfileSubmission | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "submit_profile") {
      const input = block.input as Record<string, unknown>;
      if (!isProfileSubmissionShaped(input)) return null;
      return {
        identified: input.identified as boolean,
        website: typeof input.website === "string" ? input.website : null,
        mission: input.mission as string,
        programs: toStringArray(input.programs),
        populations_served: toStringArray(input.populations_served),
        capacity_keywords: toStringArray(input.capacity_keywords),
        geo_focus: toStringArray(input.geo_focus),
        typical_award_min:
          typeof input.typical_award_min === "number" ? input.typical_award_min : null,
        typical_award_max:
          typeof input.typical_award_max === "number" ? input.typical_award_max : null,
        past_funders: toStringArray(input.past_funders),
        capacity_narrative:
          typeof input.capacity_narrative === "string" ? input.capacity_narrative : "",
        sources: toStringArray(input.sources),
      };
    }
  }
  return null;
}

/** Run one profile-research session. Never throws — errors return submission: null + error. */
async function runProfileAgent(org: ProfileAgentOrgInput): Promise<ProfileAgentResult> {
  const client = getAnthropic();
  if (!client) {
    return {
      submission: null,
      tokensIn: 0,
      tokensOut: 0,
      searchesUsed: 0,
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20250305", name: "web_search", max_uses: MAX_SEARCHES },
    SUBMIT_PROFILE_TOOL,
  ];

  const system = [
    "You are a meticulous researcher building a fundable-capacity profile for ONE specific organization inside a grant-capture product.",
    "Disambiguation is critical: confirm you have the right organization (matching name, type, and location/NAICS signals) before reporting anything about it.",
    "If you cannot confidently identify this specific org on the live web, set identified=false, leave the other fields as best-effort or empty, and STOP searching — never guess or substitute a similarly-named organization.",
    "NEVER call the ProPublica API or scrape propublica.org — that data is licensed and off-limits here.",
    "Work efficiently: a handful of searches to find the org's own website and any 990/press presence, verify identity, then call submit_profile exactly once. Do not write a prose report; the submit_profile call is your entire deliverable.",
  ].join(" ");

  const naicsText = org.naics.length > 0 ? org.naics.join(", ") : "none on file";
  const userPrompt = [
    `Identify and research this organization on the live web: "${org.name}".`,
    `Type: ${org.type}. NAICS codes on file: ${naicsText}.`,
    org.capacity_summary
      ? `Internal capacity summary on file (may contain a location or program hint): "${org.capacity_summary}"`
      : "No internal capacity summary on file.",
    "Find the org's own website, any 990/nonprofit-database presence (NOT ProPublica), and press mentions. Confirm mission, programs, populations served, rough geography, and any past funders you can verify on their own materials.",
    "Then call submit_profile exactly once with your findings. If you cannot confidently confirm this is the right organization, call submit_profile with identified=false immediately rather than continuing to search.",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];

  let tokensIn = 0;
  let tokensOut = 0;
  let searchesUsed = 0;

  try {
    for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools,
        messages,
      });

      tokensIn += resp.usage?.input_tokens ?? 0;
      tokensOut += resp.usage?.output_tokens ?? 0;
      searchesUsed += resp.usage?.server_tool_use?.web_search_requests ?? 0;

      const submission = extractSubmission(resp.content);
      if (submission) {
        return { submission, tokensIn, tokensOut, searchesUsed };
      }

      if (resp.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: resp.content });
        continue;
      }

      if (turn < MAX_CONTINUATIONS) {
        messages.push({ role: "assistant", content: resp.content });
        messages.push({
          role: "user",
          content:
            "Finalize now: call submit_profile exactly once. If you never confirmed the organization, call it with identified=false.",
        });
        continue;
      }
    }
    return {
      submission: null,
      tokensIn,
      tokensOut,
      searchesUsed,
      error: "agent never called submit_profile",
    };
  } catch (err) {
    return {
      submission: null,
      tokensIn,
      tokensOut,
      searchesUsed,
      error: err instanceof Error ? err.message.slice(0, 300) : "unknown error",
    };
  }
}

// ── Public entry point ──────────────────────────────────────────────────────

export interface RichProfileResult {
  upgraded: boolean;
  reason?: string;
  version?: number;
  profileJson?: Record<string, unknown>;
}

/** A rich profile younger than this is served as-is instead of re-researched. */
const RICH_PROFILE_FRESH_MS = 24 * 60 * 60 * 1000;

/**
 * Upgrade an org's capture profile from starter (deterministic) to rich
 * (agentic web-search). Writes a NEW rfp_capture_profiles version rather
 * than mutating the existing row — loadLatestProfile always reads the
 * highest version, so old profile history stays intact for audit.
 */
export async function buildRichProfile(
  orgId: string,
  opts?: { force?: boolean }
): Promise<RichProfileResult> {
  const admin = rfpAdmin();

  const [{ data: orgRow }, { data: latestProfileRow }] = await Promise.all([
    admin
      .from("rfp_orgs")
      .select("id, name, type, naics, capacity_summary")
      .eq("id", orgId)
      .maybeSingle(),
    admin
      .from("rfp_capture_profiles")
      .select("version, profile_json")
      .eq("org_id", orgId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!orgRow) {
    return { upgraded: false, reason: "org_not_found" };
  }

  // Idempotency guard: a rich profile from the last 24h is authoritative —
  // POST-spamming the route (or a double-fired org-create hook) must not
  // re-spend a full agentic session per call.
  const prevJson = (latestProfileRow?.profile_json ?? null) as
    | (PrevProfileJson & { rich?: boolean; generated_at?: string })
    | null;
  if (!opts?.force && prevJson?.rich === true && prevJson.generated_at) {
    const age = Date.now() - new Date(prevJson.generated_at).getTime();
    if (Number.isFinite(age) && age >= 0 && age < RICH_PROFILE_FRESH_MS) {
      return {
        upgraded: false,
        reason: "cached",
        version: latestProfileRow?.version as number | undefined,
        profileJson: prevJson as Record<string, unknown>,
      };
    }
  }

  const nextVersion = ((latestProfileRow?.version as number | undefined) ?? 0) + 1;

  const agentOut = await guardedLLMCall(orgId, async () => {
    const out = await runProfileAgent({
      name: orgRow.name as string,
      type: orgRow.type as string,
      naics: Array.isArray(orgRow.naics) ? (orgRow.naics as string[]) : [],
      capacity_summary: (orgRow.capacity_summary as string | null) ?? null,
    });
    const costUsd =
      computeCostUsd(MODEL, out.tokensIn, out.tokensOut) +
      out.searchesUsed * WEB_SEARCH_USD_PER_SEARCH;
    return {
      agent: AGENT_NAME,
      sessionId: `${AGENT_NAME}_${orgId}_${Date.now().toString(36)}`,
      model: MODEL,
      tokensIn: out.tokensIn,
      tokensOut: out.tokensOut,
      costUsd,
      out,
    };
  });

  const { submission, error } = agentOut.out;
  if (!submission || !submission.identified) {
    return { upgraded: false, reason: error ?? "not_identified" };
  }

  // Merge with the prior (starter) profile so research gaps never make the
  // org score worse than before the upgrade.
  const profileJson = mapSubmissionToProfileJson(submission, prevJson);

  // rfp_capture_profiles has UNIQUE(org_id, version) and this read-then-insert
  // has no lock — on a concurrent build, bump the version and retry rather
  // than failing the whole (already-paid-for) research run.
  let insertedVersion = nextVersion;
  let insertErr: { message: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    ({ error: insertErr } = await admin.from("rfp_capture_profiles").insert({
      org_id: orgId,
      version: insertedVersion,
      profile_json: profileJson as unknown as Json,
      voice_examples: [],
    }));
    if (!insertErr) break;
    if (!/duplicate key|unique/i.test(insertErr.message)) break;
    insertedVersion += 1;
  }
  if (insertErr) {
    throw new Error(`profile_insert_failed: ${insertErr.message}`);
  }

  const existingSummary = (orgRow.capacity_summary as string | null) ?? null;
  if ((!existingSummary || !existingSummary.trim()) && submission.capacity_narrative) {
    const { error: updateErr } = await admin
      .from("rfp_orgs")
      .update({ capacity_summary: submission.capacity_narrative })
      .eq("id", orgId);
    if (updateErr) {
      console.warn(
        "[profile-builder] capacity_summary update failed (non-fatal):",
        updateErr.message
      );
    }
  }

  // Fire-and-forget rescore so the richer profile takes effect immediately,
  // same pattern as runDeepResearch's post-ingest rescore.
  void recomputeAllForOrg(orgId, { aiSummaries: false }).catch((err) => {
    console.warn(
      "[profile-builder] post-upgrade rescore failed:",
      err instanceof Error ? err.message.slice(0, 200) : "unknown"
    );
  });

  return { upgraded: true, version: insertedVersion, profileJson };
}
