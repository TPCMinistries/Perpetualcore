/**
 * lib/rfp/draft/generate.ts — first-pass drafter.
 *
 * Single round of GPT-4o. As of Voice Fingerprint v1 the drafter optionally
 * accepts a stylometric profile (see lib/rfp/voice/extract.ts) and prepends
 * it to the system prompt via lib/rfp/voice/apply.ts. As of Vault Grounding
 * v1 the drafter optionally accepts retrieved vault chunks (see
 * lib/rfp/vault/retrieve.ts) and inserts them as "Vault facts" with
 * citation instructions. When neither is provided the drafter behaves
 * identically to pre-augmentation.
 *
 * Honest defaults: voice augmentation is system-prompt-level only — not
 * fine-tuning. Vault grounding is single-shot retrieval-before-generation;
 * not multi-hop RAG, not agentic browsing. Anything the model would
 * otherwise invent that is NOT in the provided vault chunks must still be
 * wrapped in [VERIFY: ...] markers — the system prompt enforces this and
 * adds [CITE: vault-N] markers to claims that DO come from a vault chunk.
 *
 * Model: gpt-4o. Cost ($2.50/M input + $10/M output). v1 input is ~1500
 * tokens base (+~250 with voice, +~600-1600 with vault depending on k and
 * chunk size), output ~2000 tokens → typical cost $0.02-0.05/draft.
 */

import OpenAI from "openai";
import { ALL_SECTION_SPECS, SECTION_TYPES, type SectionType } from "./sections";
import { applyVoiceFingerprint } from "@/lib/rfp/voice/apply";
import type { VoiceFingerprint } from "@/lib/rfp/voice/extract";
import type { RetrievedChunk } from "@/lib/rfp/vault/retrieve";

const MODEL = "gpt-4o";

// GPT-4o pricing (USD per million tokens). Keep in sync with
// lib/rfp/voice/extract.ts and lib/rfp/review/generate.ts.
const PRICE_PER_M_INPUT = 2.5;
const PRICE_PER_M_OUTPUT = 10.0;

export interface DraftInput {
  opportunity: {
    title: string;
    agency: string | null;
    brief: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    url: string | null;
  };
  org: {
    name: string;
    type: "nonprofit" | "forprofit" | "dual";
    capacity_summary: string | null;
  };
  /**
   * Optional Voice Fingerprint v1. When provided we prepend the formatted
   * voice guidance ahead of the default system prompt. When absent the
   * drafter behaves exactly as it did pre-voice.
   */
  voiceFingerprint?: VoiceFingerprint;
  /**
   * Optional Vault Grounding v1. Caller retrieves top-K chunks via
   * lib/rfp/vault/retrieve.ts and passes them here. The drafter inserts
   * them as a numbered facts block and instructs the model to cite them
   * inline as [CITE: vault-N]. Anything outside the chunks remains a
   * [VERIFY: ...] marker.
   */
  vaultChunks?: RetrievedChunk[];
}

export interface DraftSection {
  type: SectionType;
  content: string;
}

export interface DraftResult {
  sections: DraftSection[];
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  model: string;
  session_id: string;
  /** True iff a VoiceFingerprint was applied to the system prompt. */
  voice_applied: boolean;
  /** True iff vault chunks were injected as citation material. */
  vault_applied: boolean;
  /** Count of vault chunks injected (0 when none). */
  vault_chunks_used: number;
}

const SYSTEM_PROMPT = `You are a senior grant and proposal writer drafting a first pass for an organization that will then iterate on what you produce. You are explicit and honest about uncertainty.

Style rules — non-negotiable:
- Concrete numbers and named outcomes over adjectives. Never write "evidence-based" without naming the evidence.
- One idea per sentence. No throat-clearing transitions ("It is important to note...", "In today's world...").
- When you would otherwise invent an org-specific fact (a number, an award, a partnership, a staff name, a dollar figure), wrap it in a [VERIFY: ...] marker so the human writer knows to fill it in. Better to flag than to fabricate.
- Plain text only. No markdown headings, no bullet symbols, no emoji. Paragraph breaks are blank lines.

You will produce exactly five sections in the order specified, separated by the literal line "---SECTION:<type>---" before each section's content (no other formatting around that marker). Do not produce any preamble, postscript, commentary, or section index. Begin your response with the first section marker.

The user message contains the funder opportunity and the applicant organization context. The applicant's "capacity_summary" is one source of org-specific information. If a "Vault facts" block is present, those are additional verified org-specific facts you may cite directly — when you state a claim drawn from a Vault fact, append [CITE: vault-N] where N is the fact's number. Facts not in the Vault must remain [VERIFY: ...] markers — never promote a [VERIFY] to a [CITE] without a backing chunk.`;

function buildVaultBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  const lines = chunks.map((c, i) => {
    const idx = i + 1;
    const head = `[vault-${idx}] (${c.doc_type} — "${c.doc_title}", chunk ${c.chunk_index + 1}, similarity ${c.similarity_score.toFixed(2)}):`;
    // Compact whitespace so each chunk reads as one block.
    const body = c.text.replace(/\s+/g, " ").trim();
    return `${head}\n${body}`;
  });
  return `# Vault facts (cite as [CITE: vault-N] when used)\n\n${lines.join("\n\n")}\n\n`;
}

function buildUserPrompt(input: DraftInput): string {
  const { opportunity: opp, org, vaultChunks } = input;
  const vaultBlock = buildVaultBlock(vaultChunks ?? []);
  const amount =
    opp.amount_min && opp.amount_max
      ? `$${opp.amount_min.toLocaleString()}–$${opp.amount_max.toLocaleString()}`
      : opp.amount_max
        ? `up to $${opp.amount_max.toLocaleString()}`
        : opp.amount_min
          ? `from $${opp.amount_min.toLocaleString()}`
          : "amount not specified";

  const sections_spec = ALL_SECTION_SPECS.map(
    (s) =>
      `  - ${s.type} ("${s.label}", target ~${s.target_words} words): ${s.guidance}`,
  ).join("\n");

  return `${vaultBlock}# Funder opportunity

Title: ${opp.title}
Agency: ${opp.agency ?? "[VERIFY: agency]"}
Amount: ${amount}
Deadline: ${opp.deadline ?? "[VERIFY: deadline]"}
Source URL: ${opp.url ?? "[VERIFY: source URL]"}

Brief / synopsis:
${opp.brief ?? "[no brief provided — infer scope conservatively from the title]"}

# Applicant organization

Name: ${org.name}
Type: ${org.type}
Capacity summary: ${org.capacity_summary ?? "[no capacity summary on file — write the organizational_capacity section largely as [VERIFY] markers and leave a one-sentence stub for the rest]"}

# Sections to produce, in this order

${sections_spec}

Produce the five sections now, separated by the section markers as instructed.`;
}

function parseSections(raw: string): DraftSection[] {
  const out: DraftSection[] = [];
  const re = /---SECTION:([a-z_]+)---\s*\n?/g;
  const markers: { type: SectionType; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const t = m[1] as SectionType;
    if (!SECTION_TYPES.includes(t)) continue;
    markers.push({ type: t, start: m.index + m[0].length, end: 0 });
  }
  for (let i = 0; i < markers.length; i++) {
    markers[i].end = i + 1 < markers.length ? markers[i + 1].start - 1 : raw.length;
    const content = raw.slice(markers[i].start, markers[i].end).trim();
    if (content) out.push({ type: markers[i].type, content });
  }
  return out;
}

export async function generateDraft(input: DraftInput): Promise<DraftResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const session_id = `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  // Voice augmentation — prepend the formatted fingerprint ahead of the
  // default system prompt when supplied. The order matters: the voice block
  // sets cadence/lexicon, then the system rules govern structure + section
  // markers. Separating with two blank lines so the model treats them as
  // distinct sections of guidance.
  const voiceApplied = !!input.voiceFingerprint;
  const system = voiceApplied
    ? `${applyVoiceFingerprint(input.voiceFingerprint!)}\n\n${SYSTEM_PROMPT}`
    : SYSTEM_PROMPT;

  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";

  const sections = parseSections(text);
  const tokens_in = res.usage?.prompt_tokens ?? 0;
  const tokens_out = res.usage?.completion_tokens ?? 0;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  const vaultChunks = input.vaultChunks ?? [];
  return {
    sections,
    tokens_in,
    tokens_out,
    cost_usd,
    model: MODEL,
    session_id,
    voice_applied: voiceApplied,
    vault_applied: vaultChunks.length > 0,
    vault_chunks_used: vaultChunks.length,
  };
}
