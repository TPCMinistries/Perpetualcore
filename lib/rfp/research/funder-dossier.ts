/**
 * Funder Dossier — one-shot deep-dive on a single funder for a single
 * opportunity, backed by rfp_funder_profiles.
 *
 * Unlike runVerticalAgent (agent.ts), which sweeps many funders per session,
 * this runs ONE agentic web-search session on ONE named funder and persists
 * the result as `raw_json.dossiers_by_org[orgId]` on that funder's
 * rfp_funder_profiles row. The dossier is generated FROM the requesting org's
 * capacity profile (fit_note, similar_to_org grantee tags), so it is cached
 * per-org, not globally — a row is shared across every org's opportunities
 * with this funder, but each org gets its own tailored write-up. The
 * org-agnostic columns (typical_amount_min/max, grant_focus, geo_focus,
 * last_enriched_at) ARE shared and get refreshed from any org's run.
 * A dossier is reused for 30 days (or until opts.force) so repeat views of
 * the same opportunity don't re-spend the AI budget. Even a forced refresh
 * still reuses a result from the last 10 minutes, so a fast double-click on
 * "force" can't double-spend.
 *
 * Matching an opportunity's free-text funder name to an existing
 * rfp_funder_profiles row is fuzzy on purpose — IRS BMF names, foundation
 * self-descriptions, and scraper-extracted agency names rarely agree on
 * "Inc"/"Foundation"/"The". matchFunderProfile() is the pure matcher; no
 * match creates a stub row (source='ai_research') so the dossier still has
 * somewhere to live.
 *
 * Never-throw philosophy for the agent portion — a search/model failure
 * comes back as `error` on the result, not a thrown exception. The one
 * exception to "never throw" is BudgetExceededError from guardedLLMCall,
 * which is allowed to propagate so the route can map it to a 402.
 */

import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { computeCostUsd, guardedLLMCall, BudgetExceededError } from "@/lib/rfp/ai/guardrail";
import { WEB_SEARCH_USD_PER_SEARCH } from "./agent";
import { loadLatestProfile } from "@/lib/rfp/scoring/recompute";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 8_192;
const MAX_SEARCHES_PER_DOSSIER = 8;
const MAX_CONTINUATIONS = 4;
const CACHE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FORCE_MIN_INTERVAL_MS = 10 * 60_000; // 10 minutes — guards against force-spam
const AGENT_NAME = "funder_dossier_v1";

// ---------------------------------------------------------------------------
// matchFunderProfile — pure fuzzy matcher
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the",
  "foundation",
  "fund",
  "inc",
  "trust",
  "charitable",
]);

/** lowercase, strip punctuation, drop stopwords -> significant tokens only. */
function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t));
}

export interface FunderProfileCandidate {
  id: string;
  name: string;
  ein: string | null;
}

/**
 * Fuzzy-match a free-text funder name against known funder profiles.
 * Returns the matched profile id, or null when nothing qualifies.
 *
 * Pass 1: exact match on the normalized (stopword-stripped) token string.
 * Pass 2: containment either direction, but only when the shorter side has
 * >= 2 significant tokens — a single generic word ("Fund", "Trust") is never
 * enough to call it a match on its own.
 * A funder name that reduces to zero significant tokens (stopwords only,
 * e.g. "The Foundation") never matches anything.
 */
export function matchFunderProfile(
  funderName: string,
  profiles: FunderProfileCandidate[]
): string | null {
  const queryTokens = significantTokens(funderName);
  if (queryTokens.length === 0) return null;
  const queryNorm = queryTokens.join(" ");

  for (const profile of profiles) {
    const tokens = significantTokens(profile.name);
    if (tokens.length === 0) continue;
    if (tokens.join(" ") === queryNorm) return profile.id;
  }

  for (const profile of profiles) {
    const tokens = significantTokens(profile.name);
    if (tokens.length === 0) continue;
    const [shorter, longer] =
      tokens.length <= queryTokens.length
        ? [tokens, queryTokens]
        : [queryTokens, tokens];
    if (shorter.length < 2) continue;
    const longerSet = new Set(longer);
    if (shorter.every((t) => longerSet.has(t))) return profile.id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// submit_dossier tool + agent session
// ---------------------------------------------------------------------------

export interface FunderDossierGrantee {
  name: string;
  amount: string;
  year: string;
  similar_to_org: boolean;
}

/** Shape submitted by the agent's submit_dossier tool call. */
export interface FunderDossierSubmission {
  summary: string;
  giving_history: string;
  typical_award_min: number | null;
  typical_award_max: number | null;
  focus_areas: string[];
  geo_focus: string[];
  recent_grantees: FunderDossierGrantee[];
  application_process: string;
  next_cycle: string;
  fit_note: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
}

/** What actually gets persisted at rfp_funder_profiles.raw_json.dossiers_by_org[orgId]. */
export interface FunderDossierPayload extends FunderDossierSubmission {
  researched_at: string;
  opportunity_id: string;
}

export interface FunderDossierResult {
  cached: boolean;
  profileId: string | null;
  dossier: FunderDossierPayload | null;
  error?: string;
}

const SUBMIT_DOSSIER_TOOL: Anthropic.Tool = {
  name: "submit_dossier",
  description:
    "Submit the final funder dossier. Call exactly once, when research is complete. Use null for any numeric field you could not verify — a guess is worse than a null.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "3-5 sentences: who this funder is and what they fund.",
      },
      giving_history: {
        type: "string",
        description: "What the funder's giving pattern has looked like historically.",
      },
      typical_award_min: { type: ["number", "null"] },
      typical_award_max: { type: ["number", "null"] },
      focus_areas: { type: "array", items: { type: "string" } },
      geo_focus: { type: "array", items: { type: "string" } },
      recent_grantees: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            amount: { type: "string" },
            year: { type: "string" },
            similar_to_org: {
              type: "boolean",
              description: "True if this grantee resembles the researching org.",
            },
          },
          required: ["name", "amount", "year", "similar_to_org"],
        },
      },
      application_process: { type: "string" },
      next_cycle: { type: "string" },
      fit_note: {
        type: "string",
        description: "2-3 sentences on fit for THIS org specifically.",
      },
      sources: {
        type: "array",
        items: { type: "string" },
        description: "URLs you actually opened.",
      },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: [
      "summary",
      "giving_history",
      "typical_award_min",
      "typical_award_max",
      "focus_areas",
      "geo_focus",
      "recent_grantees",
      "application_process",
      "next_cycle",
      "fit_note",
      "sources",
      "confidence",
    ],
  },
};

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

function isDossierShaped(v: unknown): v is FunderDossierSubmission {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.summary === "string" &&
    typeof o.giving_history === "string" &&
    Array.isArray(o.focus_areas) &&
    Array.isArray(o.geo_focus) &&
    Array.isArray(o.recent_grantees) &&
    typeof o.application_process === "string" &&
    typeof o.next_cycle === "string" &&
    typeof o.fit_note === "string" &&
    Array.isArray(o.sources) &&
    typeof o.confidence === "string"
  );
}

function extractDossier(
  content: Anthropic.ContentBlock[]
): FunderDossierSubmission | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "submit_dossier") {
      const input = block.input as unknown;
      if (isDossierShaped(input)) return input;
    }
  }
  return null;
}

interface DossierAgentResult {
  submission: FunderDossierSubmission | null;
  tokensIn: number;
  tokensOut: number;
  searchesUsed: number;
  error?: string;
}

/**
 * Run one agentic web-search session on a single funder. Never throws — a
 * failed session comes back as { submission: null, error }.
 */
async function runFunderDossierAgent(
  funderName: string,
  opportunityContext: { title: string; url: string | null },
  orgProfileSummary: { capacityKeywords: string[]; geoFocus: string[] }
): Promise<DossierAgentResult> {
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
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: MAX_SEARCHES_PER_DOSSIER,
    },
    SUBMIT_DOSSIER_TOOL,
  ];

  const system =
    "You are a meticulous funder-intelligence researcher. " +
    "NEVER use the ProPublica API or scrape propublica.org — its data is licensed and off-limits here. " +
    "Instead use the funder's own website, IRS TEOS/990 public filings, press coverage, and grantee announcements. " +
    "Prefer nulls over guesses on any number you can't verify. Every claim needs a source you actually opened. " +
    "Do not write a prose report; the submit_dossier call is your entire deliverable.";

  const userPrompt = [
    `Research this funder: "${funderName}".`,
    `Context: the org is considering opportunity "${opportunityContext.title}"` +
      (opportunityContext.url ? ` (${opportunityContext.url})` : "") +
      " from this funder.",
    orgProfileSummary.capacityKeywords.length
      ? `The researching org's capacity keywords: ${orgProfileSummary.capacityKeywords.join(", ")}. ` +
        `Geo focus: ${orgProfileSummary.geoFocus.join(", ") || "US"}. ` +
        "When you list recent_grantees, mark similar_to_org=true for grantees whose work resembles this org's, so the fit read is concrete."
      : "No capacity profile is available for the researching org — leave similar_to_org false unless a grantee is an obvious peer.",
    "Call submit_dossier exactly once when done.",
  ].join("\n\n");

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

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

      const submission = extractDossier(resp.content);
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
            "Finalize now: call submit_dossier exactly once with everything you've verified so far. Use null for anything unverified.",
        });
        continue;
      }
    }
    return {
      submission: null,
      tokensIn,
      tokensOut,
      searchesUsed,
      error: "agent never called submit_dossier",
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

// ---------------------------------------------------------------------------
// Profile lookup / creation
// ---------------------------------------------------------------------------

interface FunderProfileRow {
  id: string;
  name: string;
  ein: string | null;
  raw_json: Record<string, unknown> | null;
  last_enriched_at: string | null;
  typical_amount_min: number | null;
  typical_amount_max: number | null;
  grant_focus: string[] | null;
  geo_focus: string[] | null;
}

/**
 * rfp_funder_profiles predates the last `generate_typescript_types` run, so it
 * isn't a key of Database['public']['Tables'] yet — the typed `.from()` overload
 * resolution on that name alone blows up into "type instantiation excessively
 * deep" errors. Same workaround already used in lib/rfp/funders/irs-bmf.ts.
 */
function fundersClient(): { from: (table: string) => any } {
  return createAdminClient() as unknown as { from: (table: string) => any };
}

/** Stable slug for an AI-discovered funder so re-runs update rather than duplicate. */
function funderSourceId(funderName: string): string {
  const base = funderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const hash = createHash("sha256").update(funderName).digest("hex").slice(0, 8);
  return `${base}-${hash}`;
}

/** Read-only: find an existing rfp_funder_profiles row for this funder name, if any. */
async function findFunderProfile(
  funderName: string
): Promise<FunderProfileRow | null> {
  const admin = fundersClient();
  const token = significantTokens(funderName)[0];
  if (!token) return null;

  const { data: candidates } = await admin
    .from("rfp_funder_profiles")
    .select(
      "id, name, ein, raw_json, last_enriched_at, typical_amount_min, typical_amount_max, grant_focus, geo_focus"
    )
    .ilike("name", `%${token}%`)
    .order("last_enriched_at", { ascending: false, nullsFirst: false })
    .limit(25);

  const rows = (candidates ?? []) as FunderProfileRow[];
  const matchedId = matchFunderProfile(funderName, rows);
  if (!matchedId) return null;
  return rows.find((r) => r.id === matchedId) ?? null;
}

/** Find an existing profile row, or create a stub one, for this funder name. */
async function findOrCreateFunderProfile(
  funderName: string
): Promise<FunderProfileRow> {
  const existing = await findFunderProfile(funderName);
  if (existing) return existing;

  const admin = fundersClient();
  const { data: inserted, error } = await admin
    .from("rfp_funder_profiles")
    .upsert(
      { source: "ai_research", source_id: funderSourceId(funderName), name: funderName },
      { onConflict: "source,source_id" }
    )
    .select(
      "id, name, ein, raw_json, last_enriched_at, typical_amount_min, typical_amount_max, grant_focus, geo_focus"
    )
    .single();

  if (error || !inserted) {
    throw new Error(`funder_profile_stub_failed: ${error?.message ?? "no data returned"}`);
  }
  return inserted as FunderProfileRow;
}

/**
 * This org's dossier entry, if one exists. A dossier written under the old
 * single `raw_json.dossier` shape (pre-per-org-cache) is invisible here by
 * design — it was generated for whichever org happened to run it first, so
 * treating it as "absent" rather than migrating it is the safe move.
 */
function getOrgDossierEntry(
  profile: FunderProfileRow,
  orgId: string
): FunderDossierPayload | null {
  const byOrg = profile.raw_json?.dossiers_by_org as
    | Record<string, FunderDossierPayload>
    | undefined;
  return byOrg?.[orgId] ?? null;
}

/**
 * This org's cached dossier entry, if still fresh enough to reuse.
 * Freshness is judged off the entry's OWN researched_at, not the funder row's
 * last_enriched_at — that column is shared across orgs and can be bumped by a
 * different org's run, which would otherwise make a stale per-org entry look
 * fresh. A forced refresh still reuses a result from the last
 * FORCE_MIN_INTERVAL_MS so rapid repeat clicks on "force" can't double-spend.
 */
function cachedDossier(
  profile: FunderProfileRow,
  orgId: string,
  opts: { force?: boolean } = {}
): FunderDossierPayload | null {
  const entry = getOrgDossierEntry(profile, orgId);
  if (!entry?.researched_at) return null;
  const age = Date.now() - new Date(entry.researched_at).getTime();
  const window = opts.force ? FORCE_MIN_INTERVAL_MS : CACHE_WINDOW_MS;
  return age <= window ? entry : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read-only status check for a GET — never creates rows, never spends budget.
 * Returns this org's dossier entry (any age) or null.
 */
export async function getFunderDossierStatus(
  orgId: string,
  opportunityId: string
): Promise<{ profileId: string | null; dossier: FunderDossierPayload | null }> {
  const admin = createAdminClient();
  const { data: opp } = await admin
    .from("rfp_opportunities")
    .select("funder_name, agency")
    .eq("id", opportunityId)
    .maybeSingle();

  const funderName = (opp?.funder_name as string | null) ?? (opp?.agency as string | null);
  if (!funderName) return { profileId: null, dossier: null };

  const profile = await findFunderProfile(funderName);
  if (!profile) return { profileId: null, dossier: null };

  return { profileId: profile.id, dossier: getOrgDossierEntry(profile, orgId) };
}

/**
 * Build (or return the cached) funder dossier for one opportunity.
 * Never throws except BudgetExceededError, which propagates so the caller
 * can map it to a 402.
 */
export async function buildFunderDossier(
  orgId: string,
  opportunityId: string,
  opts: { force?: boolean } = {}
): Promise<FunderDossierResult> {
  try {
    const admin = createAdminClient();
    const { data: opp } = await admin
      .from("rfp_opportunities")
      .select("title, url, funder_name, agency")
      .eq("id", opportunityId)
      .maybeSingle();

    if (!opp) {
      return { cached: false, profileId: null, dossier: null, error: "opportunity_not_found" };
    }

    const funderName = (opp.funder_name as string | null) ?? (opp.agency as string | null);
    if (!funderName) {
      return { cached: false, profileId: null, dossier: null, error: "funder_name_unavailable" };
    }

    const profile = await findOrCreateFunderProfile(funderName);

    const cached = cachedDossier(profile, orgId, opts);
    if (cached) {
      return { cached: true, profileId: profile.id, dossier: cached };
    }

    const org = await loadLatestProfile(orgId);
    const orgProfileSummary = {
      capacityKeywords: (org.profile?.capacity_keywords as string[] | undefined) ?? [],
      geoFocus: (org.profile?.geo_focus as string[] | undefined) ?? [],
    };

    const agentOut = await guardedLLMCall(orgId, async () => {
      const out = await runFunderDossierAgent(
        funderName,
        { title: opp.title as string, url: (opp.url as string | null) ?? null },
        orgProfileSummary
      );
      const costUsd =
        computeCostUsd(MODEL, out.tokensIn, out.tokensOut) +
        out.searchesUsed * WEB_SEARCH_USD_PER_SEARCH;
      return {
        agent: AGENT_NAME,
        sessionId: `${AGENT_NAME}_${profile.id}_${Date.now().toString(36)}`,
        model: MODEL,
        tokensIn: out.tokensIn,
        tokensOut: out.tokensOut,
        costUsd,
        out,
      };
    });

    if (agentOut.out.error || !agentOut.out.submission) {
      return {
        cached: false,
        profileId: profile.id,
        dossier: null,
        error: agentOut.out.error ?? "no_dossier_submitted",
      };
    }

    const submitted = agentOut.out.submission;
    const dossierPayload: FunderDossierPayload = {
      ...submitted,
      researched_at: new Date().toISOString(),
      opportunity_id: opportunityId,
    };

    const existingByOrg =
      (profile.raw_json?.dossiers_by_org as
        | Record<string, FunderDossierPayload>
        | undefined) ?? {};
    const updatePayload: Record<string, unknown> = {
      raw_json: {
        ...(profile.raw_json ?? {}),
        dossiers_by_org: { ...existingByOrg, [orgId]: dossierPayload },
      },
      grant_focus: submitted.focus_areas,
      geo_focus: submitted.geo_focus,
      last_enriched_at: new Date().toISOString(),
    };
    if (submitted.typical_award_min !== null && submitted.typical_award_min !== undefined) {
      updatePayload.typical_amount_min = submitted.typical_award_min;
    }
    if (submitted.typical_award_max !== null && submitted.typical_award_max !== undefined) {
      updatePayload.typical_amount_max = submitted.typical_award_max;
    }

    await fundersClient().from("rfp_funder_profiles").update(updatePayload).eq("id", profile.id);

    return { cached: false, profileId: profile.id, dossier: dossierPayload };
  } catch (err) {
    if (err instanceof BudgetExceededError) throw err;
    return {
      cached: false,
      profileId: null,
      dossier: null,
      error: err instanceof Error ? err.message.slice(0, 300) : "unknown error",
    };
  }
}
