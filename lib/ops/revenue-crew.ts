import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as os from 'node:os';
import * as path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import type { Finding } from './types';

/**
 * revenue-crew — shared infrastructure for the Revenue Crew capabilities
 * (speed-to-lead, reactivation).
 *
 * The autonomy charter is the law here: money/outbound ALWAYS queues for
 * Lorenzo. Wave 1 ships with a two-key send gate that is default-OFF on both
 * keys — the env var alone can never send, and every template ships
 * `approved: false`. Drafts land in the vault queue
 * (`revenue-crew-queue.md`), touches in the ledger
 * (`revenue-crew-touches.md`), dedupe state in `revenue-crew-state.json`.
 *
 * No secret ever appears in this file or its outputs. The Resend key resolves
 * from env → .env.local only (same posture as strategist's
 * resolveAnthropicKey) and is never logged.
 */

// Same vault ops dir every existing capability writes to (portfolio-pnl,
// strategist, writeback.ts) — NOT the vault root.
export const OPS_DIR = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'memory', 'ops-findings');

const QUEUE_PATH = path.join(OPS_DIR, 'revenue-crew-queue.md');
const TOUCHES_PATH = path.join(OPS_DIR, 'revenue-crew-touches.md');
const STATE_PATH = path.join(OPS_DIR, 'revenue-crew-state.json');

export const QUEUE_STATUS = 'QUEUED-AWAITING-LORENZO';

// --- From-address map ---------------------------------------------------------

export interface FromAddress {
  from: string;
  /**
   * true ONLY when the from-domain is confirmed verified in the shared Resend
   * account. Per the Wave 1 hard constraint, any property whose from-domain is
   * NOT confirmed verified is queue-only regardless of gate state.
   */
  verified: boolean;
}

/**
 * From-addresses per property. tpcmin.com is the ONLY domain confirmed
 * verified in the shared Resend account (memory: tpc-resend-domain-not-verified
 * — theprayercenter.org is NOT verified; perpetualcore.com is unconfirmed from
 * this repo, so it stays queue-only until verified).
 */
export const FROM_ADDRESSES = {
  pc: { from: 'sales@perpetualcore.com', verified: false },
  coaching: { from: 'lorenzo@perpetualcore.com', verified: false },
  tpc: { from: 'lorenzo@tpcmin.com', verified: true },
} satisfies Record<string, FromAddress>;

export type Property = keyof typeof FROM_ADDRESSES;

// --- Templates + the two-key send gate -----------------------------------------

export type TemplateVars = Record<string, string>;

export interface EmailTemplate {
  /**
   * Flip only after Lorenzo approves the template text — flipping the env var
   * alone can never send. Wave 1 ships EVERY template `approved: false`.
   */
  approved: boolean;
  subject: (v: TemplateVars) => string;
  body: (v: TemplateVars) => string;
}

function greet(v: TemplateVars): string {
  return v.firstName ? `Hi ${v.firstName},` : 'Hi there,';
}

export const APPROVED_TEMPLATES: Record<string, EmailTemplate> = {
  // --- speed-to-lead acknowledgments (property: pc) ---------------------------
  'stl-leads': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Thanks for reaching out to Perpetual Core',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Thanks for reaching out${v.company ? ` from ${v.company}` : ''} — I saw your note come in and wanted to acknowledge it personally.\n\n` +
      `What's the main problem you're hoping to solve? Reply here and I'll point you at the fastest path.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },
  'stl-consultation': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Your consultation request — next step',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Got your consultation request${v.company ? ` for ${v.company}` : ''}. I'll follow up shortly with times — in the meantime, if there's one thing you want to make sure we cover, reply with it and I'll come prepared.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },
  'stl-demo': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Your Perpetual Core demo request',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Thanks for requesting an enterprise demo${v.company ? ` for ${v.company}` : ''}. I'll reach out to schedule — a quick note on your team size and the workflow you most want to see will help me tailor it.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },
  'stl-contact': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Got your message',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Your message landed — thanks for writing in. I read these personally and will get back to you soon. If it's time-sensitive, reply with "urgent" and I'll bump it.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },

  // --- reactivation win-back (pc / coaching tone) -----------------------------
  'reactivation-touch-1': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: (v) => `Checking in — how did ${v.engine || 'it'} work out?`,
    body: (v) =>
      `${greet(v)}\n\n` +
      `It's been about ${v.monthsSince || 'a few'} months since you picked up ${v.engine || 'one of our products'} — I wanted to check in personally. Did it do what you needed?\n\n` +
      `If anything fell short, tell me straight; if it worked, I'd love to hear what it unlocked.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },
  'reactivation-touch-2': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Worth a quick call?',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Following up on my last note — a lot has shipped since you last used ${v.engine || 'our products'}. If you're open to it, let's jump on a 15-minute call and I'll show you what's new and where it could plug in for you.\n\n` +
      `Just reply with a couple of times that work.\n\n` +
      `— Lorenzo\nPerpetual Core`,
  },

  // --- reactivation win-back (TPC — ministry tone, its own entity) ------------
  'reactivation-tpc-touch-1': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'Thinking of you — from TPC Ministries',
    body: (v) =>
      `${greet(v)}\n\n` +
      `It's been about ${v.monthsSince || 'a few'} months since we last connected, and I wanted to reach out — not to ask for anything, just to check in. How are you and your family doing?\n\n` +
      `We'd love to have you back with us, and if there's anything we can be praying with you about, reply and let me know.\n\n` +
      `Grace and peace,\nLorenzo\nTPC Ministries`,
  },
  'reactivation-tpc-touch-2': {
    approved: false, // Flip only after Lorenzo approves the template text — flipping the env var alone can never send.
    subject: () => 'An open invitation',
    body: (v) =>
      `${greet(v)}\n\n` +
      `Following up on my last note — the door is always open. If you'd like to catch up, I'd love to find a few minutes to talk and hear how this season has been for you.\n\n` +
      `Just reply and we'll set it up.\n\n` +
      `Grace and peace,\nLorenzo\nTPC Ministries`,
  },
};

/**
 * The two-key send gate — the CRITICAL safety rail. Returns true ONLY when
 * BOTH keys turn:
 *   (a) process.env.OPS_REVENUE_CREW_SEND === 'true'   (operator arms sending)
 *   (b) the template's APPROVED_TEMPLATES entry has approved: true
 *       (Lorenzo approved the exact text)
 *
 * Wave 1 ships every template `approved: false`, so this returns false even
 * if the env var is set — the crew physically cannot send.
 */
export function isSendArmed(templateId: string): boolean {
  if (process.env.OPS_REVENUE_CREW_SEND !== 'true') return false;
  const template = APPROVED_TEMPLATES[templateId];
  return template !== undefined && template.approved === true;
}

// --- Resend key resolution ------------------------------------------------------

/**
 * RESEND_API_KEY from env, falling back to .env.local for the headless/launchd
 * path (same shape as strategist's resolveAnthropicKey). Never logged, never
 * thrown on missing — returns null so callers degrade to queue-only.
 */
export function resolveResendKey(): string | null {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  loadDotenv({ path: path.join(process.cwd(), '.env.local') });
  return process.env.RESEND_API_KEY || null;
}

// --- Email masking (touch ledger privacy) ---------------------------------------

/** Mask a third-party email's local part: `john@acme.com` → `j***@acme.com`. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email.length > 1 ? `${email[0]}***` : '***';
  return `${email[0]}***${email.slice(at)}`;
}

export function newDraftId(capability: string): string {
  return `${capability}-${randomUUID().slice(0, 8)}`;
}

// --- Vault writers (never throw — return a warn Finding on failure) --------------

export interface QueuedDraft {
  id: string;
  ts: string;
  capability: string;
  source: string;
  to: string;
  from: string;
  subject: string;
  body: string;
}

const QUEUE_HEADER = [
  '---',
  'name: revenue-crew-queue',
  'description: Revenue Crew outbound drafts awaiting Lorenzo — NOTHING here has been sent',
  'metadata:',
  '  type: reference',
  '  source: ops-revenue-crew',
  '---',
  '',
  '# Revenue Crew — Draft Queue',
  '',
  `> Every entry below is status ${QUEUE_STATUS}. Per the autonomy charter, money/outbound always queues for Lorenzo.`,
  '',
].join('\n');

async function ensureFile(filePath: string, header: string): Promise<void> {
  await fs.mkdir(OPS_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, header, 'utf8');
  }
}

/** Append a draft to the vault queue. Failure → warn Finding, never throws. */
export async function queueDraft(draft: QueuedDraft): Promise<Finding | null> {
  const block = [
    '',
    `## ${draft.id}`,
    '',
    `- ts: ${draft.ts}`,
    `- capability: ${draft.capability}`,
    `- source: ${draft.source}`,
    `- to: ${draft.to}`,
    `- from: ${draft.from}`,
    `- subject: ${draft.subject}`,
    `- status: ${QUEUE_STATUS}`,
    '',
    '```text',
    draft.body,
    '```',
    '',
    '---',
    '',
  ].join('\n');
  try {
    await ensureFile(QUEUE_PATH, QUEUE_HEADER);
    await fs.appendFile(QUEUE_PATH, block, 'utf8');
    return null;
  } catch (err) {
    return {
      severity: 'warn',
      project: 'revenue-crew-queue.md',
      summary: `Could not queue draft ${draft.id} (run continues)`,
      detail: (err as Error).message.slice(0, 200),
    };
  }
}

/** Count drafts currently in the vault queue (for queue-depth reporting). */
export async function countQueuedDrafts(): Promise<number> {
  try {
    const md = await fs.readFile(QUEUE_PATH, 'utf8');
    return md.split('\n').filter((l) => l.includes(`status: ${QUEUE_STATUS}`)).length;
  } catch {
    return 0;
  }
}

export interface Touch {
  ts: string;
  capability: string;
  source: string;
  /** lead id, or an email — emails are masked before writing (never raw third-party addresses) */
  leadRef: string;
  action: string;
}

const TOUCHES_HEADER = [
  '---',
  'name: revenue-crew-touches',
  'description: Revenue Crew touch ledger — one line per drafted/queued/sent touch',
  'metadata:',
  '  type: reference',
  '  source: ops-revenue-crew',
  '---',
  '',
  '# Revenue Crew — Touch Ledger',
  '',
].join('\n');

/** Append one line to the touch ledger. Failure → warn Finding, never throws. */
export async function logTouch(touch: Touch): Promise<Finding | null> {
  // Defense in depth: never let a raw third-party email into the ledger.
  const ref = touch.leadRef.includes('@') ? maskEmail(touch.leadRef) : touch.leadRef;
  const line = `- ${touch.ts} · ${touch.capability} · ${touch.source} · ${ref} · ${touch.action}\n`;
  try {
    await ensureFile(TOUCHES_PATH, TOUCHES_HEADER);
    await fs.appendFile(TOUCHES_PATH, line, 'utf8');
    return null;
  } catch (err) {
    return {
      severity: 'warn',
      project: 'revenue-crew-touches.md',
      summary: 'Could not append to touch ledger (run continues)',
      detail: (err as Error).message.slice(0, 200),
    };
  }
}

// --- Dedupe state -----------------------------------------------------------------

export interface RevenueCrewState {
  speedToLead: { touchedLeadKeys: string[]; lastRunIso: string | null };
  reactivation: { draftedCustomerKeys: string[]; lastRunIso: string | null };
}

export function defaultState(): RevenueCrewState {
  return {
    speedToLead: { touchedLeadKeys: [], lastRunIso: null },
    reactivation: { draftedCustomerKeys: [], lastRunIso: null },
  };
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Load dedupe state. Missing file → fresh default (info). Corrupt → fresh default (warn). Never throws. */
export async function loadState(): Promise<{ state: RevenueCrewState; finding: Finding | null }> {
  let raw: string;
  try {
    raw = await fs.readFile(STATE_PATH, 'utf8');
  } catch {
    return {
      state: defaultState(),
      finding: {
        severity: 'info',
        project: 'revenue-crew-state.json',
        summary: 'No state file found — starting with fresh dedupe state (normal on first run)',
      },
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<RevenueCrewState>;
    return {
      state: {
        speedToLead: {
          touchedLeadKeys: strArray(parsed.speedToLead?.touchedLeadKeys),
          lastRunIso: typeof parsed.speedToLead?.lastRunIso === 'string' ? parsed.speedToLead.lastRunIso : null,
        },
        reactivation: {
          draftedCustomerKeys: strArray(parsed.reactivation?.draftedCustomerKeys),
          lastRunIso: typeof parsed.reactivation?.lastRunIso === 'string' ? parsed.reactivation.lastRunIso : null,
        },
      },
      finding: null,
    };
  } catch (err) {
    return {
      state: defaultState(),
      finding: {
        severity: 'warn',
        project: 'revenue-crew-state.json',
        summary: 'State file corrupt — starting with fresh dedupe state (run continues)',
        detail: (err as Error).message.slice(0, 200),
      },
    };
  }
}

/** Persist dedupe state. Failure → warn Finding, never throws. */
export async function saveState(state: RevenueCrewState): Promise<Finding | null> {
  try {
    await fs.mkdir(OPS_DIR, { recursive: true });
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
    return null;
  } catch (err) {
    return {
      severity: 'warn',
      project: 'revenue-crew-state.json',
      summary: 'Could not save dedupe state (this run\'s drafts may re-queue next run)',
      detail: (err as Error).message.slice(0, 200),
    };
  }
}
