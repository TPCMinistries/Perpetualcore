import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  owner_label: z.string().trim().min(1).max(80),
  stage: z.enum([
    "evaluating",
    "drafting",
    "reviewing",
    "ready",
    "submitted",
    "closed",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export async function PATCH(
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

  const { org_id, owner_label, stage, priority } = parsed.data;
  const { data: current } = await supabase
    .from("rfp_opp_matches")
    .select("pursuit_owner_label, pursuit_stage, pursuit_priority")
    .eq("opp_id", id)
    .eq("org_id", org_id)
    .maybeSingle<{
      pursuit_owner_label: string;
      pursuit_stage: string;
      pursuit_priority: string;
    }>();

  const { data, error } = await supabase
    .from("rfp_opp_matches")
    .update({
      pursuit_owner_label: owner_label,
      pursuit_stage: stage,
      pursuit_priority: priority,
    })
    .eq("opp_id", id)
    .eq("org_id", org_id)
    .select("opp_id, pursuit_owner_label, pursuit_stage, pursuit_priority")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "pursuit_update_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const logRows: Array<{
    org_id: string;
    opp_id: string;
    event_type: string;
    title: string;
    body: string;
    created_by: string;
  }> = [];

  if (!current || current.pursuit_owner_label !== owner_label) {
    logRows.push({
      org_id,
      opp_id: id,
      event_type: "owner_change",
      title: "Owner updated",
      body: `Owner changed to ${owner_label}.`,
      created_by: user.id,
    });
  }
  if (!current || current.pursuit_stage !== stage) {
    logRows.push({
      org_id,
      opp_id: id,
      event_type: "stage_change",
      title: "Stage updated",
      body: `Stage changed to ${stage}.`,
      created_by: user.id,
    });
  }

  if (logRows.length > 0) {
    await supabase.from("rfp_pursuit_decision_logs").insert(logRows);
  }

  return NextResponse.json(data);
}
