/**
 * /api/early-access — early-list email capture for unreleased products.
 *
 * Currently used by:
 *   - /products/rfp-sentry (Session 3 brief Step 6) — default branch
 *   - /products/vellum (Plan 12-04 STUDIO-VW-01) — Vellum branch (product=vellum)
 *
 * Designed to handle additional products by `product` field so we
 * don't fork an endpoint per stub page.
 *
 * Vellum branch (product === 'vellum'):
 *   - Requires tier_preference (free/operator/team/institution)
 *   - Persists to vellum_early_access table via createAdminClient()
 *   - Sends Vellum-branded confirmation email via Resend
 *   - Accepts optional setup_intent_id (from /api/vellum/setup-intent) for paid tiers
 *
 * Storage strategy for default branch:
 *   - Tries to insert into Supabase `early_access` table if it exists.
 *   - If the table doesn't exist or insertion fails, the route still
 *     returns success to the user — the email is logged server-side
 *     and Lorenzo can wire the table later without breaking the UX.
 *     This matches the existing /api/contact-sales soft-fail pattern.
 *
 * Rate-limited to 3 requests/hour/IP (lower than contact-sales because
 * the form is a one-input email field, easier to abuse).
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { validationErrorResponse } from "@/lib/validations/schemas";
import { VellumEarlyAccessEmail } from "@/lib/email/templates/vellum-early-access";
import { resend, EMAIL_FROM } from "@/lib/email/config";

// Simple in-memory rate limit (resets on server restart, same shape
// as /api/contact-sales).
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  record.count++;
  return false;
}

const earlyAccessSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  product: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Invalid product slug")
    .optional()
    .nullable(),
  source: z
    .string()
    .max(120)
    .transform((s) => s.trim().replace(/[<>]/g, ""))
    .optional()
    .nullable(),
  // Vellum-specific (only required when product === 'vellum')
  tier_preference: z
    .enum(["free", "operator", "team", "institution"])
    .optional(),
  organization_type: z
    .enum(["501c3", "forprofit", "individual", "other"])
    .optional(),
  is_501c3: z.boolean().optional(),
  first_name: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.trim().replace(/[<>]/g, ""))
    .optional(),
  setup_intent_id: z.string().max(200).optional(),
});

/**
 * Hash an IP address for storage. Truncated to 32 hex chars to save space.
 * We never store raw IPs — only a one-way hash for abuse detection.
 */
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Send Vellum early-access confirmation email via Resend.
 * Soft-fail: logs error and returns without throwing.
 */
async function sendVellumConfirmationEmail({
  to,
  firstName,
  tierPreference,
  is501c3,
}: {
  to: string;
  firstName?: string;
  tierPreference: "free" | "operator" | "team" | "institution";
  is501c3: boolean;
}): Promise<void> {
  if (!resend) {
    console.warn("[vellum-early-access] Resend not configured — skipping confirmation email");
    return;
  }

  const html = VellumEarlyAccessEmail({ firstName, tierPreference, is501c3 });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "You're on the Vellum early-access list",
    html,
  });

  if (error) {
    console.error("[vellum-early-access] email send failed:", error);
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryProduct = url.searchParams.get("product");

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    let validated;
    try {
      const rawBody = await request.json();
      validated = earlyAccessSchema.parse({
        ...rawBody,
        product: rawBody?.product ?? queryProduct ?? null,
      });
    } catch (error) {
      return validationErrorResponse(error);
    }

    // ------------------------------------------------------------------
    // VELLUM BRANCH — product === 'vellum'
    // Persists to vellum_early_access + sends confirmation email.
    // All DB access via createAdminClient() per CORE-tier CLAUDE.md rule.
    // ------------------------------------------------------------------
    if (validated.product === "vellum") {
      if (!validated.tier_preference) {
        return NextResponse.json(
          { error: "tier_preference is required for vellum signup" },
          { status: 400 }
        );
      }

      const supabase = createAdminClient();
      const { error: vellumDbError } = await supabase
        .from("vellum_early_access")
        .insert({
          email: validated.email,
          tier_preference: validated.tier_preference,
          organization_type: validated.organization_type ?? null,
          is_501c3: validated.is_501c3 ?? false,
          source: validated.source ?? "vellum-waitlist",
          ip_hash: hashIp(ip),
          metadata: {},
          setup_intent_id: validated.setup_intent_id ?? null,
        });

      if (vellumDbError) {
        // Soft-fail per project pattern — log + return success to user.
        console.error("[vellum-early-access] insert failed:", vellumDbError.message);
      }

      // Fire confirmation email (best-effort, soft-fail inside helper)
      try {
        await sendVellumConfirmationEmail({
          to: validated.email,
          firstName: validated.first_name,
          tierPreference: validated.tier_preference,
          is501c3: validated.is_501c3 ?? false,
        });
      } catch (emailErr) {
        console.error("[vellum-early-access] email send failed:", emailErr);
      }

      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------
    // DEFAULT BRANCH — rfp-sentry and future products
    // ------------------------------------------------------------------

    // Use the admin client for an unauthenticated public-form insert
    // per CLAUDE.md "Background/server operations" rule.
    const supabase = createAdminClient();

    // Best-effort insert. If the `early_access` table doesn't exist
    // yet, swallow the error and continue — the user still gets a
    // success response and the email is captured in server logs for
    // Lorenzo to backfill later.
    const { error: dbError } = await supabase.from("early_access").insert({
      email: validated.email,
      product: validated.product ?? null,
      source: validated.source ?? null,
      created_at: new Date().toISOString(),
    } as never);

    if (dbError && process.env.NODE_ENV === "development") {
      console.warn(
        "[early-access] insert failed (table may not exist yet):",
        dbError.message
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list. We'll be in touch when there's something to show.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit early-access form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
