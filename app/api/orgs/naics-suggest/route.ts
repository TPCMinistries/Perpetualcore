/**
 * POST /api/orgs/naics-suggest — Suggest NAICS codes from a free-text org description.
 *
 * Powers the "Help me pick" assistant on /orgs/new (NaicsAssistantModal).
 * Auth-gated: only logged-in users can hit the model, which both blocks
 * anonymous abuse and keeps cost attribution clean (we know whose run it was
 * if we ever need to audit). The model call is short (gpt-4o-mini, <$0.001
 * per call) so we do not add stricter rate limiting beyond what middleware
 * already applies to /api/*.
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
    return NextResponse.json({ suggestions: result.suggestions });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "suggest_failed", detail },
      { status: 500 },
    );
  }
}
