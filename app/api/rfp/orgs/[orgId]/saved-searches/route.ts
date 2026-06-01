import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import {
  normalizeSavedSearchRow,
  SAVED_SEARCH_COLUMNS,
  SavedSearchBodySchema,
} from "@/lib/rfp/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
function rfpHandle(supabase: SupabaseClient): { from: (table: string) => any } {
  return supabase as unknown as { from: (table: string) => any };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: "invalid_orgId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const org = await getOrgForUser(orgId);
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await rfpHandle(supabase)
    .from("rfp_saved_searches")
    .select(SAVED_SEARCH_COLUMNS)
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[/api/rfp/orgs/saved-searches GET] DB error", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }

  return NextResponse.json({
    rows: ((data ?? []) as unknown[]).map(normalizeSavedSearchRow),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: "invalid_orgId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const org = await getOrgForUser(orgId);
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = SavedSearchBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const row = {
    org_id: orgId,
    created_by: user.id,
    name: parsed.data.name,
    filters: parsed.data.filters,
    mode: parsed.data.mode,
    is_shared: parsed.data.is_shared,
    alert_enabled: parsed.data.alert_enabled,
    alert_frequency: parsed.data.alert_frequency,
    min_fit_score: parsed.data.min_fit_score,
  };

  const { data, error } = await rfpHandle(supabase)
    .from("rfp_saved_searches")
    .insert(row)
    .select(SAVED_SEARCH_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[/api/rfp/orgs/saved-searches POST] DB error", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { row: normalizeSavedSearchRow(data) },
    { status: 201 },
  );
}
