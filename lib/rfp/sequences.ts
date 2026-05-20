/**
 * lib/rfp/sequences.ts — RFP nurture sequence definitions + dispatcher.
 *
 * Sequences live in code rather than a DB table so that editing a step
 * requires a PR (visible, reviewable, version-controlled). Enrollment
 * state lives in rfp_email_enrollments; sent-history in rfp_email_log.
 *
 * v1 ships ONE sequence (trial-onboarding) wired to org creation. The
 * remaining sequences from the plan (lead-capture, activation-reengagement,
 * win-loss, monthly-digest) are stubs at the bottom — adding them is
 * just an entry in SEQUENCES + a trigger somewhere relevant.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface SequenceContext {
  email: string;
  orgName?: string;
  orgId?: string;
  sequenceKey?: string;
}

function unsubscribeUrl(ctx: SequenceContext): string {
  const params = new URLSearchParams({ email: ctx.email });
  if (ctx.sequenceKey) params.set("seq", ctx.sequenceKey);
  return `https://rfp.perpetualcore.com/unsubscribe?${params.toString()}`;
}

export interface SequenceStep {
  delay_days: number;
  subject: string;
  buildHtml: (ctx: SequenceContext) => string;
}

export interface Sequence {
  key: string;
  description: string;
  steps: SequenceStep[];
}

// ── Shared email frame ───────────────────────────────────────────────────────

function emailFrame(opts: {
  preheader: string;
  body: string;
  unsubscribeHref: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RFP Engine</title>
  </head>
  <body style="margin:0;padding:0;background:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
          <tr><td style="padding:0 0 24px 0;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#34d399;">RFP Engine</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;margin-top:4px;">by Perpetual Core</div>
          </td></tr>
          <tr><td style="padding:0;color:#e4e4e7;font-size:15px;line-height:1.6;">
            ${opts.body}
          </td></tr>
          <tr><td style="padding:40px 0 0 0;border-top:1px solid #27272a;margin-top:32px;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;color:#52525b;line-height:1.5;">
              Perpetual Core LLC · <a href="https://rfp.perpetualcore.com" style="color:#71717a;text-decoration:underline;">rfp.perpetualcore.com</a>
              <br>
              <a href="${opts.unsubscribeHref}" style="color:#52525b;text-decoration:underline;">Unsubscribe from these emails</a>
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function cta(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#34d399;color:#09090b;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;">${label}</a>`;
}

// ── Sequences ────────────────────────────────────────────────────────────────

const trialOnboarding: Sequence = {
  key: "trial-onboarding",
  description:
    "Activates a newly-created org. Walks them through the four high-leverage capabilities in order.",
  steps: [
    {
      delay_days: 1,
      subject: "Train your voice in 5 minutes",
      buildHtml: (ctx) =>
        emailFrame({
          unsubscribeHref: unsubscribeUrl(ctx),
          preheader:
            "Paste 3-10 past proposals. Future drafts will sound like you, not like a vendor.",
          body: `
            <p>Hi,</p>
            <p>You created ${ctx.orgName ?? "your org"} on rfp.perpetualcore.com yesterday. The single highest-leverage thing you can do today is train the voice fingerprint.</p>
            <p>It's a stylometric profile — sentence rhythm, signature phrases, framing patterns — extracted from 3-10 of your past proposals. Future drafts then read like you, not like a vendor template.</p>
            <p>This step takes about 5 minutes and is the difference between a draft you can cut down and a draft you have to rewrite.</p>
            <p style="margin:24px 0;">${cta(ctx.orgId ? `https://rfp.perpetualcore.com/org/${ctx.orgId}/settings/voice` : "https://rfp.perpetualcore.com/orgs", "Train your voice")}</p>
            <p style="color:#a1a1aa;font-size:13px;">Lorenzo Daughtry-Chambers · Founder</p>
          `,
        }),
    },
    {
      delay_days: 2, // Day 3 from enrollment (1+2)
      subject: "Upload 3 docs to your vault",
      buildHtml: (ctx) =>
        emailFrame({
          unsubscribeHref: unsubscribeUrl(ctx),
          preheader:
            "Vault grounding stops hallucinated facts. Every claim ties to a real chunk you uploaded.",
          body: `
            <p>Hi again,</p>
            <p>Two days in. The next step that compounds is seeding the vault.</p>
            <p>Upload 3 documents that contain real facts about ${ctx.orgName ?? "your org"} — annual reports, past program narratives, evaluation summaries, founder bio. Once they're in, the drafter cites them inline with [CITE: vault-N] markers and refuses to fabricate org-specific numbers.</p>
            <p>It's the difference between "we serve over 1,000 youth annually" (you'd write that) and "1,247 youth in FY24 [CITE: vault-3]" (your drafter will write that, because chunk 3 of your annual report said so).</p>
            <p style="margin:24px 0;">${cta(ctx.orgId ? `https://rfp.perpetualcore.com/org/${ctx.orgId}/settings/vault` : "https://rfp.perpetualcore.com/orgs", "Upload vault docs")}</p>
            <p style="color:#a1a1aa;font-size:13px;">— Lorenzo</p>
          `,
        }),
    },
    {
      delay_days: 4, // Day 7
      subject: "Try the reviewer agent on your first draft",
      buildHtml: (ctx) =>
        emailFrame({
          unsubscribeHref: unsubscribeUrl(ctx),
          preheader:
            "An Opus pass against the funder's brief, with severity-graded findings and a 0-100 score.",
          body: `
            <p>One week in.</p>
            <p>You've likely run a draft or two by now. The reviewer agent is the second-pass critique — a single Opus call that reads your draft against the opportunity brief and surfaces what a real federal reviewer or foundation program officer would dock you for.</p>
            <p>You'll see severity-graded findings (blocker / high / medium / low), each anchored to a section, with a cited excerpt and a concrete suggestion. Score is calibrated to "would a strong reviewer recommend funding" — 70 means closer look, 80 means competitive.</p>
            <p>Open any draft and click <em>Run reviewer</em>. ~30 seconds, costs ~$0.50.</p>
            <p style="margin:24px 0;">${cta(ctx.orgId ? `https://rfp.perpetualcore.com/org/${ctx.orgId}/discovery` : "https://rfp.perpetualcore.com/orgs", "Open your dashboard")}</p>
            <p style="color:#a1a1aa;font-size:13px;">— Lorenzo</p>
          `,
        }),
    },
    {
      delay_days: 7, // Day 14
      subject: "How's the engine working for you?",
      buildHtml: (ctx) =>
        emailFrame({
          unsubscribeHref: unsubscribeUrl(ctx),
          preheader:
            "Two weeks in. What's landing? What's broken? Reply to this email — Lorenzo reads every one.",
          body: `
            <p>Two weeks since ${ctx.orgName ?? "you"} joined RFP Engine.</p>
            <p>I read every reply to this email. Three questions if you have 90 seconds:</p>
            <ol style="color:#d4d4d8;padding-left:20px;">
              <li>What's the most useful thing the engine has done for you so far?</li>
              <li>What's the most frustrating thing — anything that made you close the tab?</li>
              <li>What's one capability that would lock in your decision to keep using this?</li>
            </ol>
            <p>No form, no survey. Just reply.</p>
            <p style="color:#a1a1aa;font-size:13px;">— Lorenzo</p>
          `,
        }),
    },
  ],
};

export const SEQUENCES: Record<string, Sequence> = {
  [trialOnboarding.key]: trialOnboarding,
};

// ── Dispatch helpers ────────────────────────────────────────────────────────

/**
 * Enroll a user/org in a sequence. Idempotent — second call returns the
 * existing enrollment row without resetting progress. Sets next_send_at
 * to delay_days from now for the first step.
 */
export async function enrollInSequence(opts: {
  email: string;
  sequenceKey: string;
  userId?: string;
  orgId?: string;
  orgName?: string;
}): Promise<{ enrollment_id: string; created: boolean } | null> {
  const seq = SEQUENCES[opts.sequenceKey];
  if (!seq) return null;
  const firstStep = seq.steps[0];
  if (!firstStep) return null;

  const admin = createAdminClient();
  const nextSendAt = new Date(
    Date.now() + firstStep.delay_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Upsert on (email, sequence_key) to keep idempotency simple.
  const { data, error } = await admin
    .from("rfp_email_enrollments")
    .upsert(
      {
        email: opts.email.toLowerCase(),
        sequence_key: opts.sequenceKey,
        user_id: opts.userId ?? null,
        org_id: opts.orgId ?? null,
        current_step: 0,
        next_send_at: nextSendAt,
        metadata: opts.orgName ? { org_name: opts.orgName } : {},
      },
      { onConflict: "email,sequence_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[rfp-sequences] enroll failed:", error.message.slice(0, 120));
    return null;
  }
  if (!data) {
    // ignoreDuplicates returned no row — fetch existing
    const { data: existing } = await admin
      .from("rfp_email_enrollments")
      .select("id")
      .eq("email", opts.email.toLowerCase())
      .eq("sequence_key", opts.sequenceKey)
      .maybeSingle();
    return existing ? { enrollment_id: existing.id, created: false } : null;
  }
  return { enrollment_id: data.id, created: true };
}
