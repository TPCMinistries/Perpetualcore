/**
 * Phase 05-05 — Quick Import: Claude-based field extractor.
 *
 * Single entry point: `extractOpportunityFromText(text, url)`. Asks Claude
 * Sonnet 4.5 to extract opportunity metadata as strict JSON, parses the
 * response, and returns a `Partial<OpportunityInput>` shape ready for
 * normalization. Confidence is graded so the orchestrator can decide
 * whether to flag the row as `needs_review`.
 *
 * Never throws on AI errors — every failure path returns a low-confidence
 * empty fields object. The orchestrator persists the raw URL with
 * `needs_review = true` so the user can complete the row by hand. This is
 * the "save raw + flag" contract from 05-CONTEXT.md.
 *
 * Model selection mirrors `lib/rfp/scoring/summary.ts`:
 *   - Primary: claude-sonnet-4-5-20250929
 *   - Fallback: claude-haiku-4-5-20251001
 *
 * Why Sonnet for extraction (vs Haiku) — extraction quality on dense,
 * federal-grant-style PDFs is meaningfully better on Sonnet, and we're
 * only running this per user-submitted URL (not on every cron-discovered
 * opp). The cost trade-off is acceptable.
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Lazy init (same pattern as lib/rfp/scoring/summary.ts) ───────────────────

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

const MODEL_PRIMARY = "claude-sonnet-4-5-20250929";
const MODEL_FALLBACK = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 800;
/** Hard cap on the prompt body — keeps total tokens predictable. */
const MAX_TEXT_INPUT_CHARS = 60_000;

// ── Public types ─────────────────────────────────────────────────────────────

export type ExtractionConfidence = "high" | "medium" | "low";

/**
 * Shape Claude is asked to return. Mirrors a strict subset of
 * `OpportunityInput` (lib/rfp/ingest/normalize.ts) — what an LLM can
 * realistically lift from an opportunity page without hallucinating
 * structured fields like raw_json.
 */
export interface ExtractedFields {
  title: string | null;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  /** ISO 8601 string, e.g. "2026-06-14" or "2026-06-14T17:00:00Z". */
  deadline: string | null;
  /** 1-2 sentence summary, capped at 300 chars by the prompt. */
  brief: string | null;
  /** ≤10 lowercase keywords. */
  keywords: string[];
  /** Free-form geo string: "US", "NY", "NYC", country code. */
  geo: string | null;
}

export interface ExtractionResult {
  fields: ExtractedFields;
  confidence: ExtractionConfidence;
  /** Names of fields that came back null. Used by orchestrator UI. */
  missing: string[];
  /** Which model produced the result (`null` when API was unavailable). */
  model: string | null;
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(text: string, url: string): string {
  const truncated =
    text.length > MAX_TEXT_INPUT_CHARS
      ? text.slice(0, MAX_TEXT_INPUT_CHARS) + "\n[…truncated…]"
      : text;
  return [
    "You extract structured opportunity metadata from grant / contract / RFP pages.",
    "Return STRICT JSON only — no preamble, no markdown fences, no commentary.",
    "If a field is not clearly stated in the text, return null for it. Do not guess.",
    "",
    "Schema:",
    "{",
    '  "title": string | null,',
    '  "agency": string | null,',
    '  "amount_min": number | null,         // USD, integer if possible',
    '  "amount_max": number | null,         // USD, integer if possible',
    '  "deadline": string | null,           // ISO 8601, e.g. "2026-06-14" or "2026-06-14T17:00:00Z"',
    '  "brief": string | null,              // ≤300 characters, 1-2 sentences',
    '  "keywords": string[],                // ≤10 lowercase keywords',
    '  "geo": string | null                 // "US", "NY", "NYC", country code, or null',
    "}",
    "",
    `Source URL: ${url}`,
    "Text (may be truncated):",
    '"""',
    truncated,
    '"""',
    "",
    "Return only the JSON object.",
  ].join("\n");
}

// ── JSON parsing (defensive) ─────────────────────────────────────────────────

const EMPTY_FIELDS: ExtractedFields = {
  title: null,
  agency: null,
  amount_min: null,
  amount_max: null,
  deadline: null,
  brief: null,
  keywords: [],
  geo: null,
};

/**
 * Pull the first balanced JSON object substring out of a Claude response.
 * Sonnet usually returns clean JSON, but Haiku occasionally wraps in a
 * code fence or adds a sentence. We slice from the first `{` to the
 * matching `}` and JSON.parse that.
 */
function extractJsonBlock(raw: string): string | null {
  const trimmed = raw.trim();
  // Strip ```json fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]!.trim() : trimmed;
  const first = body.indexOf("{");
  if (first === -1) return null;
  // Walk to the matching brace, naive but sufficient for well-formed AI output.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = first; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return body.slice(first, i + 1);
    }
  }
  return null;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function coerceString(v: unknown, maxLen?: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (maxLen && trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

function coerceKeywords(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of v) {
    if (typeof k !== "string") continue;
    const trimmed = k.trim().toLowerCase();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeFields(raw: unknown): ExtractedFields {
  if (!raw || typeof raw !== "object") return { ...EMPTY_FIELDS };
  const obj = raw as Record<string, unknown>;
  return {
    title: coerceString(obj.title, 500),
    agency: coerceString(obj.agency, 200),
    amount_min: coerceNumber(obj.amount_min),
    amount_max: coerceNumber(obj.amount_max),
    deadline: coerceString(obj.deadline, 64),
    brief: coerceString(obj.brief, 300),
    keywords: coerceKeywords(obj.keywords),
    geo: coerceString(obj.geo, 64),
  };
}

// ── Confidence + missing-field analysis ──────────────────────────────────────

function gradeConfidence(fields: ExtractedFields): {
  confidence: ExtractionConfidence;
  missing: string[];
} {
  const present = {
    title: fields.title !== null,
    agency: fields.agency !== null,
    amount: fields.amount_min !== null || fields.amount_max !== null,
    deadline: fields.deadline !== null,
  };
  const missing: string[] = [];
  if (!fields.title) missing.push("title");
  if (!fields.agency) missing.push("agency");
  if (!fields.amount_min && !fields.amount_max) missing.push("amount");
  if (!fields.deadline) missing.push("deadline");
  if (!fields.brief) missing.push("brief");
  if (!fields.geo) missing.push("geo");
  if (fields.keywords.length === 0) missing.push("keywords");

  // Plan rules: high = title + (deadline or amount) + agency;
  //             medium = title + 1 of (deadline / amount / agency);
  //             low otherwise.
  if (present.title && (present.deadline || present.amount) && present.agency) {
    return { confidence: "high", missing };
  }
  if (present.title && (present.deadline || present.amount || present.agency)) {
    return { confidence: "medium", missing };
  }
  return { confidence: "low", missing };
}

// ── Anthropic call ───────────────────────────────────────────────────────────

async function callClaude(
  client: Anthropic,
  model: string,
  prompt: string
): Promise<string> {
  const resp = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });
  // Concatenate any text blocks returned. Claude's SDK returns a typed union;
  // we narrow to the text variant.
  const text = (resp.content ?? [])
    .map((block) => {
      if (
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        (block as { type: string }).type === "text"
      ) {
        return (block as { text: string }).text;
      }
      return "";
    })
    .join("")
    .trim();
  return text;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract opportunity metadata from raw text. Never throws — every error
 * path returns an empty-fields result with confidence='low'. The caller
 * (`lib/rfp/import/run.ts`) maps that to a `needs_review=true` row.
 */
export async function extractOpportunityFromText(
  text: string,
  url: string
): Promise<ExtractionResult> {
  if (!text || text.trim().length < 20) {
    // Not enough signal to bother with the model.
    return {
      fields: { ...EMPTY_FIELDS },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: null,
    };
  }

  const client = getAnthropic();
  if (!client) {
    console.warn(
      "[quick-import/extract] ANTHROPIC_API_KEY missing — returning low-confidence empty result"
    );
    return {
      fields: { ...EMPTY_FIELDS },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: null,
    };
  }

  const prompt = buildPrompt(text, url);

  // Try primary, fall back to Haiku. Any thrown error in both is swallowed.
  let raw: string | null = null;
  let usedModel: string | null = null;
  try {
    raw = await callClaude(client, MODEL_PRIMARY, prompt);
    usedModel = MODEL_PRIMARY;
  } catch (e) {
    console.warn(
      `[quick-import/extract] primary model failed (${
        e instanceof Error ? e.message : String(e)
      }), trying fallback`
    );
    try {
      raw = await callClaude(client, MODEL_FALLBACK, prompt);
      usedModel = MODEL_FALLBACK;
    } catch (e2) {
      console.error(
        `[quick-import/extract] both models failed: ${
          e2 instanceof Error ? e2.message : String(e2)
        }`
      );
      raw = null;
    }
  }

  if (!raw) {
    return {
      fields: { ...EMPTY_FIELDS },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: usedModel,
    };
  }

  const json = extractJsonBlock(raw);
  if (!json) {
    console.warn(
      `[quick-import/extract] no JSON block in response from ${usedModel}: ${raw.slice(0, 200)}`
    );
    return {
      fields: { ...EMPTY_FIELDS },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: usedModel,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.warn(
      `[quick-import/extract] JSON.parse failed: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
    return {
      fields: { ...EMPTY_FIELDS },
      confidence: "low",
      missing: ["title", "agency", "amount", "deadline", "brief", "geo", "keywords"],
      model: usedModel,
    };
  }

  const fields = normalizeFields(parsed);
  const { confidence, missing } = gradeConfidence(fields);
  return { fields, confidence, missing, model: usedModel };
}
