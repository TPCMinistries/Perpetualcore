import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  defaultPursuitCommand,
  type PursuitDecisionAction,
} from "@/lib/rfp/pursuit-decision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  action: z.enum(["pursue", "watch", "archive"]),
  stage: z
    .enum(["evaluating", "drafting", "reviewing", "ready", "submitted", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

const ACTION_COPY: Record<
  PursuitDecisionAction,
  { eventType: string; title: string; fallbackNote: string }
> = {
  pursue: {
    eventType: "bid_decision",
    title: "Pursuit started",
    fallbackNote: "Marked for active pursuit from Discovery.",
  },
  watch: {
    eventType: "bid_decision",
    title: "Moved to watchlist",
    fallbackNote: "Added to watchlist from Discovery.",
  },
  archive: {
    eventType: "bid_decision",
    title: "Archived opportunity",
    fallbackNote: "Archived from Discovery.",
  },
};

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

  const { org_id, action } = parsed.data;
  const note = parsed.data.note?.trim() || ACTION_COPY[action].fallbackNote;
  const defaults = defaultPursuitCommand(action);
  const command = {
    ...defaults,
    stage: parsed.data.stage ?? defaults.stage,
    priority: parsed.data.priority ?? defaults.priority,
  };
  const patch = {
    triage_status: command.triageStatus,
    triage_note: note,
    triaged_at: new Date().toISOString(),
    triaged_by: user.id,
    pursuit_stage: command.stage,
    pursuit_priority: command.priority,
  };

  const { data, error } = await supabase
    .from("rfp_opp_matches")
    .update(patch)
    .eq("opp_id", id)
    .eq("org_id", org_id)
    .select(
      "opp_id, triage_status, triage_note, triaged_at, pursuit_stage, pursuit_priority",
    )
    .maybeSingle();

  if (error) {
    console.error("[/api/rfp/opps/[id]/decision PATCH] DB error", error);
    return NextResponse.json(
      { error: "decision_update_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const copy = ACTION_COPY[action];
  await supabase.from("rfp_pursuit_decision_logs").insert({
    org_id,
    opp_id: id,
    event_type: copy.eventType,
    title: copy.title,
    body: note,
    created_by: user.id,
  });

  return NextResponse.json({ ...data, action });
}
