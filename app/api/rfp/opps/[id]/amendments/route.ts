import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  org_id: z.string().uuid(),
});

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    org_id: new URL(req.url).searchParams.get("org_id") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
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
    .from("rfp_solicitation_amendments")
    .select(
      "id, org_id, opp_id, proposal_id, material, material_reasons, diff_json, status, created_at, acknowledged_at",
    )
    .eq("org_id", parsed.data.org_id)
    .eq("opp_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: "amendments_load_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ amendments: data ?? [] });
}
