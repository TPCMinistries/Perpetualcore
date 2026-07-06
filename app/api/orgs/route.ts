/**
 * POST /api/orgs — Create a new org + assign calling user as owner.
 * GET  /api/orgs — List current user's orgs (RLS-filtered).
 *
 * CLAUDE.md rule applied: createAdminClient() is used inside createOrgWithOwner()
 * for the atomic bootstrap insert (org + owner membership in two tables).
 * This route uses createClient() only for auth verification — the privileged
 * insert is delegated to lib/rfp/orgs.ts.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createOrgWithOwner, listUserOrgs } from "@/lib/rfp/orgs";

const CreateOrgSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(["nonprofit", "forprofit", "dual"]),
  naics: z
    .array(z.string().regex(/^\d{2,6}$/, "NAICS code must be 2-6 digits"))
    .max(20)
    .default([]),
});

export async function POST(req: Request) {
  // Auth check — use anon-keyed client to verify session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse + validate request body
  let body: z.infer<typeof CreateOrgSchema>;
  try {
    const raw = await req.json();
    body = CreateOrgSchema.parse(raw);
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_body", detail: String(e) },
      { status: 400 }
    );
  }

  // Create org + owner membership atomically
  try {
    const org = await createOrgWithOwner(body, user.id);
    return NextResponse.json({ org }, { status: 201 });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "create_failed", detail },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgs = await listUserOrgs();
  return NextResponse.json({ orgs });
}
