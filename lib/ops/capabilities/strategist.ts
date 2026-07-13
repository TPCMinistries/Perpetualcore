import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { config as loadDotenv } from 'dotenv';
import type { Capability, Finding, OpsCtx } from '../types';
import { runCapability } from '../runner';
import { complianceWatch } from './compliance-watch';
import { sendOpsTelegram } from '../telegram';

/**
 * strategist — the company's weekly COO memo.
 *
 * Gathers the always-current portfolio-pnl snapshot, the latest revenue-pulse /
 * pipeline / rls-audit reports, a fresh compliance-watch run, the ratified
 * autonomy charter, and the decision-ledger tail — then asks Claude to write a
 * one-page operator memo (headline, per-engine double/hold/kill calls, this
 * week's autonomous marketing reallocation, compliance due in 14 days, and a
 * "needs Lorenzo" list scoped to charter-reserved items only).
 *
 * Every source is read in isolation (missing/unreadable → warn finding, memo
 * generation continues with "(unavailable)" in its place). The Anthropic call
 * itself falls back claude-fable-5 -> claude-sonnet-5 -> warn-finding-no-memo,
 * matching daily-brief's `settled()` degrade-graceful posture.
 *
 * Reallocation directives the memo proposes are autonomous per the charter, so
 * they get appended to decision-ledger.md the same day — the memo is notice,
 * not a request.
 */

const VAULT = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault');
const OPS_DIR = path.join(VAULT, '_claude', 'memory', 'ops-findings');
const CHARTER_PATH = path.join(OPS_DIR, 'autonomy-charter.md');
const LEDGER_PATH = path.join(OPS_DIR, 'decision-ledger.md');
const PNL_PATH = path.join(OPS_DIR, 'portfolio-pnl.md');

// Owner Telegram chat (Lorenzo) — same default as daily-brief.ts.
const BRIEF_CHAT_ID = process.env.OPS_BRIEF_CHAT_ID || '6460142816';

const SYSTEM_PROMPT = `You are the strategist agent for Perpetual Core, an AI-operated portfolio of engines (Sentinel, Janice, Sage SaaS, RFP Engine, Academy, lorenzodc, Streams of Grace, and others) under the Institute for Human Advancement / Uplift Communities. You write the weekly one-page operator memo for Lorenzo Daughtry-Chambers, the founder.

Autonomy rules (from the ratified autonomy charter — follow them exactly):
- You MAY, autonomously, with this weekly memo as sufficient notice: reallocate content topics/SEO targets/email-sequence emphasis across engines; pause a nurture sequence or content lane that is measurably dead (zero engagement over its window); reorder the marketing queue and change which engine gets production hours; open findings/recommendations at any severity.
- You MUST put in "Needs Lorenzo" instead of acting: anything that spends or bills real money; sending anything to a NEW external recipient (cold outreach, first-touch email, public post); price changes on any engine; killing or launching an engine (recommend only — Lorenzo decides); legal/entity actions (contracts, terms changes, Stripe entity moves, BAAs); anything touching customer PII beyond read-only aggregation.
- Standing rule: an engine below its conversion threshold at week 6 of its distribution runway defaults to a PAUSE recommendation (Lorenzo can override).

Base every number and call ONLY on the sources given below. If a source is marked unavailable, say so — never invent a figure.

Write the memo in EXACTLY this markdown structure (needed for automated parsing downstream — do not deviate from these headings):

# Operator Memo — <date>

> Headline: <one sentence with the headline numbers>

## Engine Calls
- <Engine>: DOUBLE|HOLD|KILL — <one sentence reasoning>

## Marketing Reallocation Directives (autonomous, effective this week)
- <concrete directive — which engine gets content focus, which sequence pauses, etc.>
(if there is nothing to reallocate this week, write exactly: "- None this week.")

## Compliance — due within 14 days
- <item — days out — action>
(if nothing is due, write exactly: "- Nothing due within 14 days.")

## Needs Lorenzo
- <charter-reserved item only>
(if nothing is queued, write exactly: "- Nothing queued.")

One page. Be concrete and terse. No preamble, no closing pleasantries.`;

function clip(text: string, max = 4000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n… [truncated, ${text.length - max} more chars]`;
}

function renderFindingsMd(findings: Finding[]): string {
  if (findings.length === 0) return '(no findings)';
  return findings.map((f) => `- [${f.severity}] ${f.project}: ${f.summary}${f.detail ? ` — ${f.detail}` : ''}`).join('\n');
}

/** Lines between a `## Heading` (matched by `headingRe`) and the next `##` heading. */
function extractSection(md: string, headingRe: RegExp): string[] {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return end === -1 ? rest : rest.slice(0, end);
}

async function readSource(filePath: string, label: string, findings: Finding[]): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    findings.push({
      severity: 'warn',
      project: 'Strategist',
      summary: `Source unavailable: ${label}`,
      detail: (err as Error).message.slice(0, 200),
    });
    return null;
  }
}

/** Most recent `<prefix>-YYYY-MM-DD.md` file in the vault ops-findings dir. */
async function latestDated(prefix: string): Promise<{ file: string; content: string } | null> {
  let files: string[];
  try {
    files = await fs.readdir(OPS_DIR);
  } catch {
    return null;
  }
  const re = new RegExp(`^${prefix}-(\\d{4}-\\d{2}-\\d{2})\\.md$`);
  const dated = files
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => x.m !== null)
    .sort((a, b) => (a.m[1] < b.m[1] ? 1 : -1));
  if (dated.length === 0) return null;
  try {
    const content = await fs.readFile(path.join(OPS_DIR, dated[0].f), 'utf8');
    return { file: dated[0].f, content };
  } catch {
    return null;
  }
}

/** ANTHROPIC_API_KEY from env, falling back to .env.local for the headless/launchd path. */
function resolveAnthropicKey(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  loadDotenv({ path: path.join(process.cwd(), '.env.local') });
  return process.env.ANTHROPIC_API_KEY || null;
}

async function callAnthropic(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export const strategist: Capability = {
  id: 'strategist',
  label: 'STRATEGIST',
  cadence: '0 11 * * 1',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const day = ctx.now.slice(0, 10);

    // --- Gather sources, each isolated -----------------------------------
    const pnl = await readSource(PNL_PATH, 'portfolio-pnl.md', findings);
    const revenuePulse = await latestDated('revenue-pulse');
    if (!revenuePulse) {
      findings.push({ severity: 'warn', project: 'Strategist', summary: 'Source unavailable: no revenue-pulse-*.md found in vault' });
    }
    const pipelineLatest = await latestDated('pipeline');
    if (!pipelineLatest) {
      findings.push({ severity: 'warn', project: 'Strategist', summary: 'Source unavailable: no pipeline-*.md found in vault' });
    }
    const rlsAuditLatest = await latestDated('rls-audit');
    if (!rlsAuditLatest) {
      findings.push({ severity: 'warn', project: 'Strategist', summary: 'Source unavailable: no rls-audit-*.md found in vault' });
    }
    const charter = await readSource(CHARTER_PATH, 'autonomy-charter.md', findings);
    const ledgerRaw = await readSource(LEDGER_PATH, 'decision-ledger.md', findings);
    const ledgerTail = ledgerRaw ? ledgerRaw.split('\n').slice(-30).join('\n') : null;

    let complianceFindings: Finding[] = [];
    try {
      const result = await runCapability(complianceWatch, { runSql: ctx.runSql, now: ctx.now });
      complianceFindings = result.findings;
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'Strategist',
        summary: 'compliance-watch run failed inside strategist',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    // --- Compose the source packet for the model ---------------------------
    const userContent = [
      `## Portfolio P&L (always-current)\n${pnl ? clip(pnl) : '(unavailable)'}`,
      `## Revenue Pulse (latest: ${revenuePulse?.file ?? 'unavailable'})\n${revenuePulse ? clip(revenuePulse.content) : '(unavailable)'}`,
      `## Pipeline (latest: ${pipelineLatest?.file ?? 'unavailable'})\n${pipelineLatest ? clip(pipelineLatest.content) : '(unavailable)'}`,
      `## RLS Audit (latest: ${rlsAuditLatest?.file ?? 'unavailable'})\n${rlsAuditLatest ? clip(rlsAuditLatest.content) : '(unavailable)'}`,
      `## Compliance Watch (this run)\n${renderFindingsMd(complianceFindings)}`,
      `## Autonomy Charter\n${charter ? clip(charter) : '(unavailable)'}`,
      `## Decision Ledger (last 30 lines)\n${ledgerTail ?? '(unavailable)'}`,
    ].join('\n\n---\n\n');

    // --- Call Anthropic, fable -> sonnet -> give up -------------------------
    const apiKey = resolveAnthropicKey();
    let memoText: string | null = null;
    let modelUsed: string | null = null;
    if (!apiKey) {
      findings.push({
        severity: 'warn',
        project: 'Strategist',
        summary: 'ANTHROPIC_API_KEY not found (env or .env.local) — no memo generated',
      });
    } else {
      try {
        memoText = await callAnthropic(apiKey, 'claude-fable-5', SYSTEM_PROMPT, userContent);
        modelUsed = 'claude-fable-5';
      } catch (errFable) {
        try {
          memoText = await callAnthropic(apiKey, 'claude-sonnet-5', SYSTEM_PROMPT, userContent);
          modelUsed = 'claude-sonnet-5';
        } catch (errSonnet) {
          findings.push({
            severity: 'warn',
            project: 'Strategist',
            summary: 'Anthropic call failed on claude-fable-5 and claude-sonnet-5 — no memo generated',
            detail: `fable: ${(errFable as Error).message.slice(0, 150)} | sonnet: ${(errSonnet as Error).message.slice(0, 150)}`,
          });
        }
      }
    }

    if (!memoText || !modelUsed) {
      return findings;
    }

    // --- Persist the memo: dated + always-current, matching portfolio-pnl --
    const frontmatter = (dated: boolean) =>
      [
        '---',
        `name: strategist-memo${dated ? `-${day}` : ''}`,
        `description: Weekly operator memo — ${dated ? day : 'always-current (last run ' + day + ')'} (model ${modelUsed})`,
        'metadata:',
        '  type: reference',
        '  source: ops-strategist',
        '---',
        '',
        '',
      ].join('\n');

    try {
      await fs.mkdir(OPS_DIR, { recursive: true });
      await fs.writeFile(path.join(OPS_DIR, `strategist-memo-${day}.md`), frontmatter(true) + memoText + '\n', 'utf8');
      await fs.writeFile(path.join(OPS_DIR, 'strategist-memo.md'), frontmatter(false) + memoText + '\n', 'utf8');
    } catch (err) {
      findings.push({
        severity: 'warn',
        project: 'strategist-memo.md',
        summary: 'Could not write memo file(s) (memo still generated)',
        detail: (err as Error).message.slice(0, 200),
      });
    }

    // --- Reallocation directives are notice, not a request — log them today
    const directiveLines = extractSection(memoText, /^##\s*Marketing Reallocation Directives/i)
      .filter((l) => l.trim().startsWith('- '))
      .map((l) => l.trim().replace(/^-\s*/, ''))
      .filter((l) => !/^none this week\.?$/i.test(l));

    if (directiveLines.length > 0) {
      const reviewBy = new Date(Date.parse(ctx.now) + 7 * 86_400_000).toISOString().slice(0, 10);
      const entry =
        `\n**${day} · strategist (autonomous, per charter)** — DECISION: ${directiveLines.join('; ')}.\n` +
        `Reasoning: see strategist memo ${day} for full context; reallocation authority per [[autonomy-charter]]. Review: ${reviewBy}.\n`;
      try {
        await fs.appendFile(LEDGER_PATH, entry, 'utf8');
      } catch (err) {
        findings.push({
          severity: 'warn',
          project: 'decision-ledger.md',
          summary: 'Could not append reallocation directive(s) to decision ledger',
          detail: (err as Error).message.slice(0, 200),
        });
      }
    }

    // --- Deliver ------------------------------------------------------------
    const sent = await sendOpsTelegram(BRIEF_CHAT_ID, memoText);
    if (!sent) {
      findings.push({ severity: 'warn', project: 'Telegram', summary: 'Strategist memo generated but Telegram delivery failed/skipped' });
    }

    const headlineMatch = memoText.match(/^>\s*Headline:\s*(.+)$/im);
    const headline = headlineMatch ? headlineMatch[1].trim() : 'Strategist memo generated (no headline line found)';
    findings.unshift({
      severity: 'ok',
      project: 'Strategist',
      summary: headline,
      detail: `Model: ${modelUsed}. Memo: strategist-memo-${day}.md`,
    });

    return findings;
  },
};
