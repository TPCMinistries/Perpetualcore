/**
 * lib/rfp/draft/generate.ts — first-pass drafter.
 *
 * Single round of Sonnet, no reviewer, no vault retrieval, no voice
 * fingerprint. Returns five section drafts plus token/cost metadata so the
 * caller can persist an rfp_agent_sessions audit row. The five sections
 * are defined in ./sections.ts.
 *
 * Honest defaults: voice_fingerprint is not yet implemented, so we do not
 * pretend to apply it. capacity_summary is the only org-specific signal the
 * model gets. Anything else org-specific the model writes must be wrapped in
 * `[VERIFY: ...]` markers per the system prompt.
 *
 * Model: claude-sonnet-4-6. Chosen for cost (~$3/M input, $15/M output) —
 * an Opus reviewer pass will be a separate Phase 7 build. v1 input is
 * ~1500 tokens, output ~2000 tokens → ~$0.03/draft. Cheap enough to
 * dogfood liberally on Uplift submissions.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ALL_SECTION_SPECS, SECTION_TYPES, type SectionType } from "./sections";

const MODEL = "claude-sonnet-4-6";

// Sonnet 4.6 pricing (USD per million tokens) — keep in sync with
// lib/agents/executor/planner.ts if/when that file is unified.
const PRICE_PER_M_INPUT = 3.0;
const PRICE_PER_M_OUTPUT = 15.0;

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
}

const SYSTEM_PROMPT = `You are a senior grant and proposal writer drafting a first pass for an organization that will then iterate on what you produce. You are explicit and honest about uncertainty.

Style rules — non-negotiable:
- Concrete numbers and named outcomes over adjectives. Never write "evidence-based" without naming the evidence.
- One idea per sentence. No throat-clearing transitions ("It is important to note...", "In today's world...").
- When you would otherwise invent an org-specific fact (a number, an award, a partnership, a staff name, a dollar figure), wrap it in a [VERIFY: ...] marker so the human writer knows to fill it in. Better to flag than to fabricate.
- Plain text only. No markdown headings, no bullet symbols, no emoji. Paragraph breaks are blank lines.

You will produce exactly five sections in the order specified, separated by the literal line "---SECTION:<type>---" before each section's content (no other formatting around that marker). Do not produce any preamble, postscript, commentary, or section index. Begin your response with the first section marker.

The user message contains the funder opportunity and the applicant organization context. The applicant's "capacity_summary" is the only org-specific information you have — anything more specific must be a [VERIFY] marker.`;

function buildUserPrompt(input: DraftInput): string {
  const { opportunity: opp, org } = input;
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

  return `# Funder opportunity

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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const session_id = `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  const sections = parseSections(text);
  const tokens_in = res.usage.input_tokens;
  const tokens_out = res.usage.output_tokens;
  const cost_usd =
    (tokens_in / 1_000_000) * PRICE_PER_M_INPUT +
    (tokens_out / 1_000_000) * PRICE_PER_M_OUTPUT;

  return { sections, tokens_in, tokens_out, cost_usd, model: MODEL, session_id };
}
