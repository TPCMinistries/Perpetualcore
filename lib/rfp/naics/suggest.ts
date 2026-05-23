/**
 * lib/rfp/naics/suggest.ts — NAICS code suggester for org onboarding.
 *
 * v2: Multi-program grouping. The model is asked to identify distinct
 * service areas in the description and return codes grouped by program,
 * with 2–3 sentence rationales that name the specific procurement systems
 * each code unlocks. This is the "wow" surface for new orgs landing on
 * /orgs/new — it has to convince them on contact that this product knows
 * the federal/state/city procurement landscape, not just NAICS taxonomy.
 *
 * Model: gpt-4o (not 4o-mini). The richer rationale + program grouping
 * needs the larger model's grant-landscape knowledge. Typical cost is
 * ~$0.003 per call — fine for a one-time onboarding moment.
 */

import OpenAI from "openai";

export const MIN_DESCRIPTION_CHARS = 10;
export const MAX_DESCRIPTION_CHARS = 600;

const MODEL = "gpt-4o";
const MAX_OUTPUT_TOKENS = 2400;

// gpt-4o pricing (USD per million tokens). Keep in sync with the rest of
// lib/rfp/* — they all assume the same OPENAI_API_KEY.
const PRICE_PER_M_INPUT = 2.5;
const PRICE_PER_M_OUTPUT = 10.0;

export const PROCUREMENT_SYSTEMS = [
  "SAM.gov",
  "Grants.gov",
  "NY State Grants Gateway",
  "NYC PASSPort",
  "GSA eBuy",
  "State procurement portals",
  "City/County RFPs",
  "Foundation funders",
] as const;
export type ProcurementSystem = (typeof PROCUREMENT_SYSTEMS)[number];

export interface NaicsCode {
  /** 2–6 digit NAICS 2022 code. */
  code: string;
  /** Official NAICS title, verbatim. */
  title: string;
  /** 2–3 sentence rationale: why it matches, what kinds of opps it unlocks. */
  rationale: string;
  /** Procurement systems that filter on this code. */
  procurement: ProcurementSystem[];
  /** Confidence in this match: high / medium / low. */
  confidence: "high" | "medium" | "low";
}

export interface NaicsProgram {
  /** Short label, e.g. "Workforce Training". */
  name: string;
  /** One-line summary of what this program does (model's understanding). */
  summary: string;
  /** Codes for this program. */
  codes: NaicsCode[];
}

export interface NaicsSuggestResult {
  /** Programs grouped from the description, each with their own code set. */
  programs: NaicsProgram[];
  /** Total cost of the model call in USD. */
  cost_usd: number;
}

const SYSTEM_PROMPT = `You are a NAICS code expert AND a federal/state/city procurement specialist helping a nonprofit or social-impact organization classify itself for grant and contract discovery (SAM.gov, Grants.gov, NY State Grants Gateway, NYC PASSPort, GSA eBuy, etc.).

Your job, given a free-text description of what the organization does:

1. IDENTIFY DISTINCT PROGRAMS. Most operating nonprofits run more than one service line (e.g. workforce training AND case management AND policy advocacy). Extract each distinct program from the description. If the description only describes one program, return one. Cap at 4 programs.

2. FOR EACH PROGRAM, return 2–4 NAICS 2022 codes that best match. Prefer 6-digit codes when the program is specific; fall back to 4-digit codes when it spans sub-industries.

3. WRITE A REAL RATIONALE for each code. 2–3 sentences. Name SPECIFIC things this code unlocks — which procurement systems filter on it, what kinds of contracts/grants commonly use it, what budget ranges are typical. Avoid generic boilerplate like "this matches your work."

4. TAG EACH CODE with the procurement systems that actually use it. Only include systems from this exact list: ${PROCUREMENT_SYSTEMS.map((p) => `"${p}"`).join(", ")}.

5. MARK CONFIDENCE. "high" = the code is a textbook fit and grantmakers use it for this exact work. "medium" = it's a reasonable match but not perfectly aligned. "low" = adjacent / worth including but lower priority.

Return ONLY a JSON object with this exact shape:

{
  "programs": [
    {
      "name": "Workforce Training",
      "summary": "Hands-on healthcare credentialing for young adults in NYC.",
      "codes": [
        {
          "code": "624310",
          "title": "Vocational Rehabilitation Services",
          "rationale": "Your CNA/EKG/phlebotomy training is the textbook fit for this code. It's the primary classification NY State DOL and federal DOL use for workforce development contracts, including WIOA Title I funds. Awards in this code typically run $250K–$2.5M and surface on Grants Gateway and SAM.gov.",
          "procurement": ["SAM.gov", "Grants.gov", "NY State Grants Gateway"],
          "confidence": "high"
        }
      ]
    }
  ]
}

Hard rules:
- Codes must be real NAICS 2022 codes, 2 to 6 digits.
- Titles must be the official NAICS title verbatim.
- No duplicate codes across programs — if a code fits two programs, put it in the more central one and reference it in the second program's summary instead of repeating.
- No procurement systems outside the allowed list.
- No code with empty rationale or empty procurement array.
- Total codes across all programs: between 5 and 12.`;

/**
 * Suggest NAICS codes grouped by program from a free-text org description.
 *
 * Throws on bad input or malformed model output rather than persisting
 * partial garbage — the API route decides how to surface failures to the UI.
 */
export async function suggestNaicsCodes(
  description: string,
): Promise<NaicsSuggestResult> {
  const trimmed = description.trim();
  if (
    trimmed.length < MIN_DESCRIPTION_CHARS ||
    trimmed.length > MAX_DESCRIPTION_CHARS
  ) {
    throw new Error(
      `naics_suggest_bad_input: description must be ${MIN_DESCRIPTION_CHARS}-${MAX_DESCRIPTION_CHARS} chars, got ${trimmed.length}`,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("naics_suggest_no_api_key: OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `naics_suggest_invalid_json: ${err instanceof Error ? err.message : "parse error"}`,
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { programs?: unknown }).programs)
  ) {
    throw new Error("naics_suggest_invalid_shape: missing programs array");
  }

  const rawPrograms = (parsed as { programs: unknown[] }).programs;
  const seenCodes = new Set<string>();
  const programs: NaicsProgram[] = [];

  for (const rp of rawPrograms) {
    if (!rp || typeof rp !== "object") continue;
    const p = rp as Record<string, unknown>;
    const name = typeof p.name === "string" ? p.name.trim() : "";
    const summary = typeof p.summary === "string" ? p.summary.trim() : "";
    if (!name) continue;

    const rawCodes = Array.isArray(p.codes) ? p.codes : [];
    const codes: NaicsCode[] = [];
    for (const rc of rawCodes) {
      if (!rc || typeof rc !== "object") continue;
      const c = rc as Record<string, unknown>;
      const code = typeof c.code === "string" ? c.code.trim() : "";
      const title = typeof c.title === "string" ? c.title.trim() : "";
      const rationale =
        typeof c.rationale === "string" ? c.rationale.trim() : "";
      if (!/^\d{2,6}$/.test(code)) continue;
      if (!title || !rationale) continue;
      if (seenCodes.has(code)) continue;

      const procurementRaw = Array.isArray(c.procurement) ? c.procurement : [];
      const procurement: ProcurementSystem[] = [];
      for (const ps of procurementRaw) {
        if (
          typeof ps === "string" &&
          (PROCUREMENT_SYSTEMS as readonly string[]).includes(ps)
        ) {
          procurement.push(ps as ProcurementSystem);
        }
      }
      if (procurement.length === 0) continue;

      const confidenceRaw =
        typeof c.confidence === "string" ? c.confidence : "medium";
      const confidence: NaicsCode["confidence"] =
        confidenceRaw === "high" || confidenceRaw === "low"
          ? confidenceRaw
          : "medium";

      seenCodes.add(code);
      codes.push({ code, title, rationale, procurement, confidence });
    }

    if (codes.length === 0) continue;
    programs.push({ name, summary, codes });
  }

  if (programs.length === 0) {
    throw new Error("naics_suggest_no_valid_programs");
  }

  const tokens_in = res.usage?.prompt_tokens ?? 0;
  const tokens_out = res.usage?.completion_tokens ?? 0;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return { programs, cost_usd };
}
