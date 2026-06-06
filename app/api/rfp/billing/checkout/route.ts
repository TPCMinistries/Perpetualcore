/**
 * POST /api/rfp/billing/checkout
 *
 * Creates a Stripe Checkout session for the calling user's org, for the
 * tier they request. Returns the session URL the client redirects to.
 *
 * Body: { org_id: uuid, tier: 'pro' | 'agency' }
 *
 * Auth:
 *   - createClient() to authenticate the caller
 *   - Membership check via rfp_user_orgs (RLS-scoped)
 *   - Only org owners can initiate checkout (billing is owner-only by
 *     convention; writers/reviewers can still see the billing page but
 *     can't subscribe on the org's behalf)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRfpCheckoutSession, type RfpTier } from "@/lib/rfp/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  tier: z.enum(["pro", "agency"]),
});

export async function POST(req: Request): Promise<NextResponse> {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "no_email_on_account" }, { status: 400 });
  }

  // Membership + role check.
  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", body.org_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role ?? null;
  if (!role) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Pull org name for the Stripe customer record. RLS already vouched
  // membership above so this read is safe.
  const { data: org } = await supabase
    .from("rfp_orgs")
    .select("id, name")
    .eq("id", body.org_id)
    .maybeSingle<{ id: string; name: string }>();
  if (!org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  try {
    const { url, session_id } = await createRfpCheckoutSession({
      orgId: body.org_id,
      orgName: org.name,
      email: user.email,
      userId: user.id,
      tier: body.tier as RfpTier,
    });
    return NextResponse.json({ url, session_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "checkout_failed", detail: msg.slice(0, 200) },
      { status: 502 },
    );
  }
}
