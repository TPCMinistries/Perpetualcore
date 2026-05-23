/**
 * POST /api/orgs/naics-suggest — Suggest NAICS codes grouped by program from
 * a free-text org description.
 *
 * Powers the "Help me pick" assistant on /orgs/new (NaicsAssistantModal v2).
 * Auth-gated: only signed-in users can hit the model, which blocks anonymous
 * abuse and gives us clean attribution if cost auditing is ever needed. The
 * blanket /api/* rate limiter in middleware (200/min per IP) is sufficient
 * additional protection given typical use is a few calls during onboarding.
 *
 * Response shape: { programs: NaicsProgram[] } — see lib/rfp/naics/suggest.ts.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  suggestNaicsCodes,
  MIN_DESCRIPTION_CHARS,
  MAX_DESCRIPTION_CHARS,
} from "@/lib/rfp/naics/suggest";

const RequestSchema = z.object({
  description: z.string().min(MIN_DESCRIPTION_CHARS).max(MAX_DESCRIPTION_CHARS),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    const raw = await req.json();
    body = RequestSchema.parse(raw);
  } catch (e) {
    return NextResponse.json(
      { error: "invalid_body", detail: String(e) },
      { status: 400 },
    );
  }

  try {
    const result = await suggestNaicsCodes(body.description);
    return NextResponse.json({ programs: result.programs });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "suggest_failed", detail },
      { status: 500 },
    );
  }
}
