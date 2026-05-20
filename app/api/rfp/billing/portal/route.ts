/**
 * POST /api/rfp/billing/portal
 *
 * Returns a Stripe customer-portal URL so the caller can manage their
 * subscription. Owners only — same convention as /checkout.
 *
 * Body: { org_id: uuid }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createRfpPortalSession } from "@/lib/rfp/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ org_id: z.string().uuid() });

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

  try {
    const { url } = await createRfpPortalSession({ orgId: body.org_id });
    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "portal_failed", detail: msg.slice(0, 200) },
      { status: 502 },
    );
  }
}
