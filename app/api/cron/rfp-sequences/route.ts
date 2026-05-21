/**
 * GET /api/cron/rfp-sequences
 *
 * Daily cron (vercel.json: "0 9 * * *"). For each enrollment row that is
 * due, sends the next step's email via Resend, logs the result, and
 * advances current_step + next_send_at — or marks the enrollment
 * completed when the last step has been dispatched.
 *
 * No retry-on-failure in v1: a failed Resend send writes a 'failed' row
 * to rfp_email_log but does NOT advance the enrollment, so the next cron
 * run picks it up again. If Resend is hard-down for >24h the same row
 * gets re-tried; we'll add an explicit retry-count cap when that becomes
 * an issue.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resend, EMAIL_CONFIG } from "@/lib/email/config";
import {
  SEQUENCES,
  enrollInSequence,
  type SequenceContext,
} from "@/lib/rfp/sequences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM_ADDRESS = EMAIL_CONFIG.from;

interface EnrollmentRow {
  id: string;
  email: string;
  sequence_key: string;
  current_step: number;
  org_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Cron auth — same pattern as every other cron in vercel.json.
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "resend_not_configured" },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // ── Activation re-engagement enrollment ─────────────────────────────────
  // Scan for orgs created ≥7 days ago with 0 proposals. Enroll the owner
  // (or every member with an email if multiple) once — enrollInSequence is
  // idempotent on (email, sequence_key). Best-effort: failure here does
  // NOT block the main sequence dispatch loop below.
  let activation_enrolled = 0;
  try {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Pull candidate orgs: created ≥7d ago, name + id + owner mapping.
    // We re-resolve owner email below so a deleted user doesn't 500 us.
    const { data: candidateOrgs } = await admin
      .from("rfp_orgs")
      .select("id, name, created_at")
      .lte("created_at", sevenDaysAgo)
      .returns<{ id: string; name: string; created_at: string }[]>();

    for (const org of candidateOrgs ?? []) {
      // Has any proposals? Skip if yes.
      const { count: pCount } = await admin
        .from("rfp_proposals")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id);
      if ((pCount ?? 0) > 0) continue;

      // Resolve owner email. We try the first owner row; if multiple
      // owners exist this will pick one deterministically by created_at.
      const { data: ownerMembership } = await admin
        .from("rfp_user_orgs")
        .select("user_id")
        .eq("org_id", org.id)
        .eq("role", "owner")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle<{ user_id: string }>();
      if (!ownerMembership?.user_id) continue;

      const { data: userResp } =
        await admin.auth.admin.getUserById(ownerMembership.user_id);
      const email = userResp?.user?.email;
      if (!email) continue;

      const result = await enrollInSequence({
        email,
        sequenceKey: "activation-reengagement",
        userId: ownerMembership.user_id,
        orgId: org.id,
        orgName: org.name,
      });
      if (result?.created) activation_enrolled++;
    }
  } catch (err) {
    console.warn(
      "[rfp-sequences] activation scan skipped:",
      err instanceof Error ? err.message.slice(0, 120) : "unknown",
    );
  }

  const { data: due, error } = await admin
    .from("rfp_email_enrollments")
    .select("id, email, sequence_key, current_step, org_id, user_id, metadata")
    .lte("next_send_at", now)
    .is("completed_at", null)
    .is("unsubscribed_at", null)
    .limit(50)
    .returns<EnrollmentRow[]>();

  if (error) {
    return NextResponse.json(
      { error: "query_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const rows = due ?? [];
  let sent = 0;
  let failed = 0;
  let completed = 0;

  for (const row of rows) {
    const seq = SEQUENCES[row.sequence_key];
    if (!seq) {
      // Unknown sequence — mark complete to drain the queue rather than
      // re-process forever. Logs the failure for traceability.
      await admin
        .from("rfp_email_log")
        .insert({
          enrollment_id: row.id,
          step: row.current_step,
          status: "failed",
          error_message: `unknown_sequence:${row.sequence_key}`,
        });
      await admin
        .from("rfp_email_enrollments")
        .update({ completed_at: now })
        .eq("id", row.id);
      completed++;
      continue;
    }

    const step = seq.steps[row.current_step];
    if (!step) {
      // Past the last step — finalize.
      await admin
        .from("rfp_email_enrollments")
        .update({ completed_at: now })
        .eq("id", row.id);
      completed++;
      continue;
    }

    const ctx: SequenceContext = {
      email: row.email,
      sequenceKey: row.sequence_key,
      orgId: row.org_id ?? undefined,
      orgName:
        typeof row.metadata?.org_name === "string"
          ? row.metadata.org_name
          : undefined,
    };

    const unsubscribeUrl = `https://rfp.perpetualcore.com/unsubscribe?email=${encodeURIComponent(row.email)}&seq=${encodeURIComponent(row.sequence_key)}`;

    let resendId: string | null = null;
    let sendErr: string | null = null;
    try {
      const html = step.buildHtml(ctx);
      const res = await resend.emails.send({
        from: FROM_ADDRESS,
        to: row.email,
        subject: step.subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:lorenzo@tpcmin.org?subject=RFP%20unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (res.error) {
        sendErr = res.error.message ?? "resend_error";
      } else {
        resendId = res.data?.id ?? null;
      }
    } catch (err) {
      sendErr = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    }

    if (sendErr) {
      await admin.from("rfp_email_log").insert({
        enrollment_id: row.id,
        step: row.current_step,
        status: "failed",
        error_message: sendErr.slice(0, 500),
      });
      failed++;
      // Do not advance — next cron retries.
      continue;
    }

    // Sent successfully — log + advance.
    await admin.from("rfp_email_log").insert({
      enrollment_id: row.id,
      step: row.current_step,
      status: "sent",
      resend_email_id: resendId,
    });

    const nextStepIdx = row.current_step + 1;
    const nextStep = seq.steps[nextStepIdx];
    if (!nextStep) {
      await admin
        .from("rfp_email_enrollments")
        .update({ completed_at: now, current_step: nextStepIdx })
        .eq("id", row.id);
      completed++;
    } else {
      const nextSendAt = new Date(
        Date.now() + nextStep.delay_days * 24 * 60 * 60 * 1000,
      ).toISOString();
      await admin
        .from("rfp_email_enrollments")
        .update({ current_step: nextStepIdx, next_send_at: nextSendAt })
        .eq("id", row.id);
    }
    sent++;
  }

  return NextResponse.json({
    processed: rows.length,
    sent,
    failed,
    completed,
    activation_enrolled,
  });
}
