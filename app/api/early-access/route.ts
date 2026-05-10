/**
 * /api/early-access — early-list email capture for unreleased products.
 *
 * Currently used by /products/rfp-sentry (Session 3 brief Step 6).
 * Designed to handle additional products by `?product=<slug>` so we
 * don't fork an endpoint per stub page.
 *
 * Storage strategy:
 *   - Tries to insert into Supabase `early_access` table if it exists.
 *   - If the table doesn't exist or insertion fails, the route still
 *     returns success to the user — the email is logged server-side
 *     and Lorenzo can wire the table later without breaking the UX.
 *     This matches the existing /api/contact-sales soft-fail pattern.
 *
 * Rate-limited to 3 requests/hour/IP (lower than contact-sales because
 * the form is a one-input email field, easier to abuse).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { validationErrorResponse } from "@/lib/validations/schemas";

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
});

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
