import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  event_type: z
    .enum([
      "note",
      "bid_decision",
      "risk",
      "owner_change",
      "stage_change",
      "submission_update",
    ])
    .default("note"),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().max(2000).optional().default(""),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
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

  const { data: match } = await supabase
    .from("rfp_opp_matches")
    .select("opp_id")
    .eq("opp_id", id)
    .eq("org_id", parsed.data.org_id)
    .maybeSingle<{ opp_id: string }>();
  if (!match) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("rfp_pursuit_decision_logs")
    .insert({
      org_id: parsed.data.org_id,
      opp_id: id,
      event_type: parsed.data.event_type,
      title: parsed.data.title,
      body: parsed.data.body,
      created_by: user.id,
    })
    .select("id, org_id, opp_id, event_type, title, body, created_by, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "decision_log_create_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ log: data });
}
