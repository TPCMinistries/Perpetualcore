/**
 * Phase 05-03 — AI-generated fit summary.
 *
 * Generates a 1-2 sentence "why this opp matches" reasoning blurb that the
 * feed UI (Plan 05-04) renders below the structured chips. Chips are the
 * durable, model-agnostic explanation; the summary is the narrative gloss.
 *
 * Model selection:
 *   - Primary: Claude Sonnet 4 (claude-sonnet-4-5)
 *   - Fallback: Claude Haiku 4.5 (claude-haiku-4-5)
 *   - Last resort: OpenAI gpt-4o — same pattern as drafter/voice/reviewer,
 *     added 2026-06-09 because the Anthropic account ran out of credit and
 *     every summary silently nulled. Anthropic re-enables automatically when
 *     credit lands (it's earlier in the chain).
 *   - On any error (rate limit, network, model down) returns null. Caller
 *     treats null as "keep existing summary or leave blank." Never throws.
 *
 * Profile-pending case:
 *   Skip AI entirely. Returns a fixed sentinel so we don't pay for tokens to
 *   generate "we don't have your profile yet" prose.
 *
 * Caching:
 *   Caller is responsible for checking the scored_version cache key — when the
 *   (opp_id, org_id) row already has the same scored_version, the caller skips
 *   `generateFitSummary` entirely. This module is a pure generator; cache
 *   logic lives in recompute.ts.
 *
 * Phase 17-04: Return shape changed from `string | null` to
 * `{ text, tokensIn, tokensOut, costUsd }` so the cron can ledger per-org cost
 * without a separate DB insert here.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { computeCostUsd } from '@/lib/rfp/ai/guardrail';
import type {
  OpportunityForScoring,
  CaptureProfileForScoring,
  ScoreBreakdown,
} from './score';
import type { ExplainedDimensions } from './dimensions';
import type { RetrievedChunk } from '@/lib/rfp/vault/retrieve';

// Lazy init — matches lib/ai/router.ts pattern. Don't crash at build-time when
// ANTHROPIC_API_KEY is absent.
let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

/** Sentinel returned when profile is pending — no AI call. */
const PROFILE_PENDING_SUMMARY =
  'Capture profile not yet built. Score uses geo and deadline only.';

/** Primary + fallback model ids. Sonnet 4.5 / Haiku 4.5 per Anthropic 2026 lineup. */
const MODEL_PRIMARY = 'claude-sonnet-4-5';
const MODEL_FALLBACK = 'claude-haiku-4-5';
/** Last-resort fallback when Anthropic is unavailable (e.g. credit exhausted). */
const MODEL_OPENAI_FALLBACK = 'gpt-4o';
const MODEL_CHAIN = [MODEL_PRIMARY, MODEL_FALLBACK, MODEL_OPENAI_FALLBACK];

/**
 * Call one model in the chain and return its raw text + usage, or null on any
 * failure (missing key, API error, empty response). Dispatches on the model id:
 * gpt-* goes to OpenAI, everything else to Anthropic. Never throws.
 */
async function callModel(
  model: string,
  prompt: string,
  maxTokens: number,
  oppId: string
): Promise<{ rawText: string; tokensIn: number; tokensOut: number } | null> {
  try {
    if (model.startsWith('gpt-')) {
      const client = getOpenAI();
      if (!client) return null;
      const resp = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = (resp.choices[0]?.message?.content ?? '').trim();
      if (!rawText) return null;
      return {
        rawText,
        tokensIn: resp.usage?.prompt_tokens ?? 0,
        tokensOut: resp.usage?.completion_tokens ?? 0,
      };
    }
    const client = getAnthropic();
    if (!client) return null;
    const resp = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = resp.content[0];
    if (!block || block.type !== 'text') return null;
    const rawText = block.text.trim();
    if (!rawText) return null;
    return {
      rawText,
      tokensIn: resp.usage.input_tokens,
      tokensOut: resp.usage.output_tokens,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scoring/summary] ${model} failed for opp=${oppId}: ${msg}`);
    return null;
  }
}

/** Cap response at ~50 tokens — this is a one-or-two-sentence summary. */
const MAX_TOKENS = 80;

/**
 * Build the prompt sent to Claude. Kept tight — no verbose framing, no
 * marketing language coaching. The model is given the matched signal so it
 * can name them specifically.
 */
function buildPrompt(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring,
  breakdown: ScoreBreakdown
): string {
  const briefTruncated = (opp.brief ?? '').slice(0, 200);
  const amountStr =
    opp.amount_max != null ? `$${opp.amount_max.toLocaleString()}` : 'unspecified amount';
  const deadlineStr = opp.deadline ?? 'no deadline given';
  const naicsList = profile.naics.join(',') || 'none';
  const capStr = profile.capacity_keywords.slice(0, 5).join(', ') || 'none';
  const geoStr = profile.geo_focus.join('/') || 'none';

  return [
    'You explain why an opportunity matches an organization in 1-2 sentences.',
    'Be specific. Reference NAICS code, capacity area, geo, or past funder by name when they match.',
    'No marketing language. No "Strong fit" — that\'s already shown elsewhere.',
    '',
    `Opportunity: ${opp.title} — ${opp.agency ?? 'agency unknown'} — ${amountStr} — deadline ${deadlineStr} — ${briefTruncated}`,
    `Org: NAICS ${naicsList} · capacity ${capStr} · geo ${geoStr}`,
    `Score breakdown: NAICS ${breakdown.naics.score}, keyword ${breakdown.keyword.score}, geo ${breakdown.geo.score}, dollar ${breakdown.dollar_band.score}, past ${breakdown.past_funder.score}`,
    '',
    'Return only the summary. No quotes, no preamble.',
  ].join('\n');
}

/** Structured result returned by generateFitSummary (Phase 17-04). */
export interface FitSummaryResult {
  text: string | null;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/** Zero-cost sentinel for branches that make no AI call. */
const ZERO_COST_RESULT: FitSummaryResult = {
  text: null,
  tokensIn: 0,
  tokensOut: 0,
  costUsd: 0,
};

/**
 * Generate a 1-2 sentence reasoning summary.
 *
 * @returns a FitSummaryResult with text and cost metadata in every branch.
 *   - Profile-pending: text = PROFILE_PENDING_SUMMARY, cost = 0.
 *   - No ANTHROPIC_API_KEY: text = null, cost = 0.
 *   - Successful call: text = summary prose, cost computed via computeCostUsd.
 *   - Both models failed: text = null, cost = 0.
 *   Never throws.
 */
export async function generateFitSummary(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring | null,
  breakdown: ScoreBreakdown
): Promise<FitSummaryResult> {
  // Profile-pending case: skip the AI call.
  if (breakdown.profile_pending || profile === null) {
    return { text: PROFILE_PENDING_SUMMARY, tokensIn: 0, tokensOut: 0, costUsd: 0 };
  }

  const prompt = buildPrompt(opp, profile, breakdown);

  // Try primary, fall back to Haiku, then gpt-4o on transient errors.
  for (const model of MODEL_CHAIN) {
    const result = await callModel(model, prompt, MAX_TOKENS, opp.id);
    if (!result) continue;
    return {
      text: result.rawText,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      costUsd: computeCostUsd(model, result.tokensIn, result.tokensOut),
    };
  }

  // All models failed (no keys, rate limit, network) — return null per contract.
  return ZERO_COST_RESULT;
}

// ── Phase 18: Vault-grounded cited summary ────────────────────────────────────

/**
 * One cited vault artifact in the explained summary output.
 * Maps to a row in rfp_fit_evidence (dimension is added by the caller).
 */
export interface CitedArtifact {
  artifact_id: string;    // doc_id from vault chunk
  excerpt: string;        // ≤120 chars from chunk.text
  artifact_title: string; // chunk.doc_title
}

/**
 * Extended result returned by generateExplainedSummary.
 * Extends FitSummaryResult with vault citation data.
 * On JSON parse failure, citation arrays are empty (graceful degrade — Pitfall 4).
 */
export interface ExplainedSummaryResult extends FitSummaryResult {
  cited_artifact_ids: string[];
  cited_excerpts: CitedArtifact[];
}

/** Zero-cost sentinel for the explained summary (empty vault or no key). */
const ZERO_EXPLAINED_RESULT: ExplainedSummaryResult = {
  text: null,
  tokensIn: 0,
  tokensOut: 0,
  costUsd: 0,
  cited_artifact_ids: [],
  cited_excerpts: [],
};

/**
 * Cap response at ~200 tokens — enough for 2-3 sentence narrative + JSON citations.
 */
const EXPLAINED_MAX_TOKENS = 350;

/**
 * Build the prompt for generateExplainedSummary.
 * When vaultChunks is empty, falls back to a plain summary without citation instructions.
 */
function buildExplainedPrompt(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring,
  dimensions: ExplainedDimensions,
  vaultChunks: RetrievedChunk[]
): string {
  const briefTruncated = (opp.brief ?? '').slice(0, 200);
  const amountStr =
    opp.amount_max != null ? `$${opp.amount_max.toLocaleString()}` : 'unspecified amount';
  const deadlineStr = opp.deadline ?? 'no deadline given';
  const naicsList = profile.naics.join(',') || 'none';
  const capStr = profile.capacity_keywords.slice(0, 5).join(', ') || 'none';

  const dimSummary = [
    `Mission fit: ${dimensions.mission_fit.sub_score}/100 — ${dimensions.mission_fit.label}`,
    `Eligibility: ${dimensions.eligibility.sub_score}/100 — ${dimensions.eligibility.label}`,
    `Track record: ${dimensions.track_record.sub_score}/100 — ${dimensions.track_record.label}`,
    `Capacity: ${dimensions.capacity.sub_score}/100 — ${dimensions.capacity.label}`,
    `Funder relationship: ${dimensions.funder_relationship.sub_score}/100 — ${dimensions.funder_relationship.label}`,
  ].join('\n');

  if (vaultChunks.length === 0) {
    // Empty-vault degrade: plain summary, no citation instructions.
    return [
      'You explain why an opportunity matches an organization in 2-3 sentences.',
      'Be specific. Reference NAICS code, capacity area, geo, or past funder by name when they match.',
      'No marketing language. No "Strong fit" — that\'s already shown elsewhere.',
      '',
      `Opportunity: ${opp.title} — ${opp.agency ?? 'agency unknown'} — ${amountStr} — deadline ${deadlineStr} — ${briefTruncated}`,
      `Org: NAICS ${naicsList} · capacity ${capStr}`,
      `Dimension scores:\n${dimSummary}`,
      '',
      'Return ONLY valid JSON: {"text":"...","cited_artifact_ids":[],"cited_excerpts":[]}',
    ].join('\n');
  }

  // Build vault chunk context (trim each chunk to 300 chars to keep prompt short).
  const chunkContext = vaultChunks
    .map(
      (c, i) =>
        `[${i + 1}] id="${c.doc_id}" title="${c.doc_title}" text="${c.text.slice(0, 300)}"`
    )
    .join('\n');

  return [
    'You explain why an opportunity matches an organization in 2-3 sentences, citing the org\'s own vault documents by name.',
    'Be specific. Reference the vault doc titles that provide evidence for the fit.',
    'No marketing language. No "Strong fit" — that\'s already shown elsewhere.',
    '',
    `Opportunity: ${opp.title} — ${opp.agency ?? 'agency unknown'} — ${amountStr} — deadline ${deadlineStr} — ${briefTruncated}`,
    `Org: NAICS ${naicsList} · capacity ${capStr}`,
    `Dimension scores:\n${dimSummary}`,
    '',
    'Relevant vault documents:',
    chunkContext,
    '',
    'Return ONLY valid JSON with this exact shape (no markdown, no preamble):',
    '{"text":"2-3 sentence summary citing vault doc titles by name","cited_artifact_ids":["doc_id_1",...],"cited_excerpts":[{"artifact_id":"doc_id","excerpt":"≤120 chars","artifact_title":"doc title"},...]  }',
  ].join('\n');
}

/**
 * Generate a vault-grounded, cited fit summary.
 *
 * Reuses the same model selection (MODEL_PRIMARY / MODEL_FALLBACK) as
 * generateFitSummary — do NOT introduce a new model.
 *
 * Do NOT call guardedLLMCall inside this function — the caller wraps it.
 * This keeps the function reusable and independently testable.
 *
 * @param opp        Opportunity being scored
 * @param profile    Capture profile for the org (may be null → profile-pending)
 * @param dimensions Dimension breakdown from mapToDimensions
 * @param vaultChunks Retrieved vault chunks (may be empty → empty-vault degrade)
 * @returns ExplainedSummaryResult with text + citation arrays + cost metadata.
 *   Never throws. On JSON parse failure, degrades to plain text with empty citations.
 */
export async function generateExplainedSummary(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring | null,
  dimensions: ExplainedDimensions,
  vaultChunks: RetrievedChunk[]
): Promise<ExplainedSummaryResult> {
  // Profile-pending case: skip AI.
  if (profile === null) {
    return {
      text: PROFILE_PENDING_SUMMARY,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      cited_artifact_ids: [],
      cited_excerpts: [],
    };
  }

  const prompt = buildExplainedPrompt(opp, profile, dimensions, vaultChunks);

  for (const model of MODEL_CHAIN) {
    {
      const result = await callModel(model, prompt, EXPLAINED_MAX_TOKENS, opp.id);
      if (!result) continue;

      const { rawText, tokensIn, tokensOut } = result;
      const costUsd = computeCostUsd(model, tokensIn, tokensOut);

      // Try to parse the JSON response (Pitfall 4: graceful degrade on failure).
      try {
        // Strip markdown code fences if present (common LLM output artifact).
        const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(jsonStr) as {
          text?: unknown;
          cited_artifact_ids?: unknown;
          cited_excerpts?: unknown;
        };

        const text =
          typeof parsed.text === 'string' && parsed.text.length > 0
            ? parsed.text
            : rawText;

        const cited_artifact_ids = Array.isArray(parsed.cited_artifact_ids)
          ? (parsed.cited_artifact_ids as unknown[]).filter(
              (id): id is string => typeof id === 'string'
            )
          : [];

        const cited_excerpts: CitedArtifact[] = [];
        if (Array.isArray(parsed.cited_excerpts)) {
          for (const item of parsed.cited_excerpts as unknown[]) {
            if (
              item &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>).artifact_id === 'string' &&
              typeof (item as Record<string, unknown>).excerpt === 'string' &&
              typeof (item as Record<string, unknown>).artifact_title === 'string'
            ) {
              const i = item as Record<string, unknown>;
              cited_excerpts.push({
                artifact_id: i.artifact_id as string,
                excerpt: (i.excerpt as string).slice(0, 120), // enforce ≤120 chars
                artifact_title: i.artifact_title as string,
              });
            }
          }
        }

        return { text, tokensIn, tokensOut, costUsd, cited_artifact_ids, cited_excerpts };
      } catch {
        // JSON parse failed — fall back to plain text with empty citations.
        console.warn(
          `[scoring/summary] generateExplainedSummary: JSON parse failed for opp=${opp.id} model=${model} — falling back to plain text`
        );
        return {
          text: rawText,
          tokensIn,
          tokensOut,
          costUsd,
          cited_artifact_ids: [],
          cited_excerpts: [],
        };
      }
    }
  }

  return ZERO_EXPLAINED_RESULT;
}
