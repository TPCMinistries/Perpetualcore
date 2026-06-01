import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgForUser } from "@/lib/rfp/orgs";
import {
  normalizeSavedSearchRow,
  SAVED_SEARCH_COLUMNS,
  SavedSearchPatchSchema,
} from "@/lib/rfp/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
function rfpHandle(supabase: SupabaseClient): { from: (table: string) => any } {
  return supabase as unknown as { from: (table: string) => any };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; searchId: string }> },
): Promise<NextResponse> {
  const { orgId, searchId } = await params;
  if (!isUuid(orgId) || !isUuid(searchId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const org = await getOrgForUser(orgId);
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = SavedSearchPatchSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await rfpHandle(supabase)
    .from("rfp_saved_searches")
    .update(parsed.data)
    .eq("id", searchId)
    .eq("org_id", orgId)
    .select(SAVED_SEARCH_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[/api/rfp/orgs/saved-searches PATCH] DB error", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ row: normalizeSavedSearchRow(data) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; searchId: string }> },
): Promise<NextResponse> {
  const { orgId, searchId } = await params;
  if (!isUuid(orgId) || !isUuid(searchId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const org = await getOrgForUser(orgId);
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await rfpHandle(supabase)
    .from("rfp_saved_searches")
    .delete()
    .eq("id", searchId)
    .eq("org_id", orgId);

  if (error) {
    console.error("[/api/rfp/orgs/saved-searches DELETE] DB error", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
