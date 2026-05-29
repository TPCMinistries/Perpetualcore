/**
 * PATCH /api/rfp/opps/[id]/triage
 *
 * Sets the org-specific triage state for an opportunity match:
 *   untriaged | watch | pursuing | passed
 *
 * Uses the request-scoped Supabase client so rfp_opp_matches RLS enforces:
 *   - caller must belong to org_id
 *   - caller must be owner/writer to update
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  status: z.enum(["untriaged", "watch", "pursuing", "passed"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const note = parsed.data.note?.trim() || null;
  const patch =
    parsed.data.status === "untriaged"
      ? {
          triage_status: "untriaged",
          triage_note: null,
          triaged_at: null,
          triaged_by: null,
        }
      : {
          triage_status: parsed.data.status,
          triage_note: note,
          triaged_at: new Date().toISOString(),
          triaged_by: user.id,
        };

  const { data, error } = await supabase
    .from("rfp_opp_matches")
    .update(patch)
    .eq("opp_id", id)
    .eq("org_id", parsed.data.org_id)
    .select("opp_id, triage_status, triage_note, triaged_at")
    .maybeSingle();

  if (error) {
    console.error("[/api/rfp/opps/[id]/triage PATCH] DB error", error);
    return NextResponse.json({ error: "triage_update_failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
