/**
 * PATCH /api/rfp/orgs/[orgId]
 *
 * Owner-only edit for the four owner-controlled rfp_orgs fields:
 *   - name
 *   - type ('nonprofit' | 'forprofit' | 'dual')
 *   - naics (string[])
 *   - capacity_summary (string | null)
 *
 * voice_fingerprint + onboarding_state are managed by their own routes
 * (settings/voice trainer + auto-derive). This route does NOT touch them.
 *
 * Auth:
 *   - createClient for the caller + membership read
 *   - Owner role required; writers/reviewers/viewers get 403
 *   - Admin client for the update because the schema column-set has changed
 *     between migrations and we don't want a half-typed Database<> chain
 *     to TS2589 the build.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["nonprofit", "forprofit", "dual"]),
  naics: z.array(z.string().max(32)).max(20),
  capacity_summary: z.string().max(4000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await context.params;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "schema";
    return NextResponse.json({ error: "invalid_body", detail }, { status: 400 });
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
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role ?? null;
  if (!role) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const payload = {
    name: body.name.trim(),
    type: body.type,
    naics: body.naics,
    capacity_summary: body.capacity_summary?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await admin
    .from("rfp_orgs")
    .update(payload as never)
    .eq("id", orgId);
  if (updateErr) {
    return NextResponse.json(
      { error: "update_failed", detail: updateErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
