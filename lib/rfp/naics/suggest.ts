/**
 * lib/rfp/naics/suggest.ts — NAICS code suggester for org onboarding.
 *
 * Given a one-sentence description of what an organization does, returns
 * 3–5 NAICS codes with one-line rationales. Used by /api/orgs/naics-suggest
 * to power the "Help me pick" assistant on /orgs/new.
 *
 * Why GPT-4o-mini: this is a short classification task — input is ≤500
 * chars, output is a small JSON list. 4o-mini is ~17× cheaper than 4o
 * with no meaningful quality drop for taxonomy lookup. Typical run cost
 * is well under $0.001.
 */

import OpenAI from "openai";

export const MIN_DESCRIPTION_CHARS = 10;
export const MAX_DESCRIPTION_CHARS = 500;

const MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 800;

// gpt-4o-mini pricing (USD per million tokens).
const PRICE_PER_M_INPUT = 0.15;
const PRICE_PER_M_OUTPUT = 0.6;

export interface NaicsSuggestion {
  code: string;
  title: string;
  rationale: string;
}

export interface NaicsSuggestResult {
  suggestions: NaicsSuggestion[];
  cost_usd: number;
}

const SYSTEM_PROMPT = `You are a NAICS code expert helping a nonprofit or social-impact organization classify itself for federal, state, and city RFP discovery (SAM.gov, NY State Grants Gateway, NYC PASSPort, etc.).

Given a short description of what the organization does, return 3–5 NAICS 2022 codes that best match. Prefer 6-digit codes when the description is specific; fall back to 4-digit codes when the work spans multiple sub-industries.

Return ONLY a JSON object with this exact shape:
{
  "suggestions": [
    {
      "code": "624310",
      "title": "Vocational Rehabilitation Services",
      "rationale": "One short sentence on why this code fits what they described."
    }
  ]
}

Rules:
- Codes must be real NAICS 2022 codes, 2 to 6 digits.
- Titles must be the official NAICS title verbatim (no paraphrasing).
- Rationale must be ≤20 words and specific to what the user described — not generic boilerplate.
- Prefer codes that federal grantmakers and state procurement systems actually filter on.
- If the description is too vague for confident 6-digit specificity, return 2–3 broad 4-digit codes instead of guessing.
- Do NOT include duplicate codes.`;

/**
 * Suggest NAICS codes from a free-text org description.
 *
 * Throws on bad input or malformed model output rather than returning
 * placeholder data — the caller decides how to surface the failure.
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
    temperature: 0.2,
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
    !Array.isArray((parsed as { suggestions?: unknown }).suggestions)
  ) {
    throw new Error("naics_suggest_invalid_shape: missing suggestions array");
  }

  const raw = (parsed as { suggestions: unknown[] }).suggestions;
  const seen = new Set<string>();
  const validated: NaicsSuggestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const i = item as Record<string, unknown>;
    const code = typeof i.code === "string" ? i.code.trim() : "";
    const title = typeof i.title === "string" ? i.title.trim() : "";
    const rationale = typeof i.rationale === "string" ? i.rationale.trim() : "";
    if (!/^\d{2,6}$/.test(code)) continue;
    if (!title || !rationale) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    validated.push({ code, title, rationale });
  }

  if (validated.length === 0) {
    throw new Error("naics_suggest_no_valid_codes");
  }

  const tokens_in = res.usage?.prompt_tokens ?? 0;
  const tokens_out = res.usage?.completion_tokens ?? 0;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return { suggestions: validated, cost_usd };
}
