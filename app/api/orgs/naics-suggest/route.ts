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
 * Optional budget guard (Phase 17):
 *   If `org_id` is supplied AND the authenticated user is a confirmed member
 *   of that org, the call is routed through guardedLLMCall — budget checked
 *   before the model fires, one rfp_agent_sessions row recorded after.
 *
 *   If `org_id` is absent, OR the user is not a confirmed member (membership
 *   check treated as "not found"), the guard is skipped and the call proceeds
 *   ungated. This is acceptable for a ~$0.003 one-time onboarding call where
 *   the user may not have created their org yet. No session row is inserted
 *   in the unguarded path (no org to attribute to).
 *   NOTE: the unguarded path is a known cost gap; close it by always supplying
 *   org_id once the org exists (post-onboarding flow).
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
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

const RequestSchema = z.object({
  description: z.string().min(MIN_DESCRIPTION_CHARS).max(MAX_DESCRIPTION_CHARS),
  // Optional — when present and the user is a confirmed member of that org,
  // the LLM call is budget-gated and attributed to the org. When absent (or
  // membership unconfirmed), the call proceeds ungated (see header comment).
  org_id: z.string().uuid().optional(),
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

  // Determine whether to guard: org_id present + user is a confirmed member.
  let guardOrgId: string | null = null;
  if (body.org_id) {
    // RLS-scoped membership check. If the user is not a member the row won't
    // be visible (RLS), so we treat absence as "unguarded" — no 403 leak.
    const { data: membership } = await supabase
      .from("rfp_user_orgs")
      .select("role")
      .eq("org_id", body.org_id)
      .maybeSingle();
    if (membership) {
      guardOrgId = body.org_id;
    }
    // If !membership: ignore the org_id — treat as absent (unguarded).
    // This avoids leaking which org UUIDs exist while keeping the suggestion
    // call working during the onboarding form where the org may not be created.
  }

  if (guardOrgId) {
    // Guarded path: budget-checked, one session row recorded.
    try {
      const result = await guardedLLMCall(guardOrgId, async () => {
        const suggest = await suggestNaicsCodes(body.description);
        return {
          agent: "naics_suggest_v1",
          model: "gpt-4o",
          tokensIn: 0, // suggestNaicsCodes does not expose token counts externally
          tokensOut: 0,
          costUsd: suggest.cost_usd,
          _programs: suggest.programs,
        };
      });
      return NextResponse.json({ programs: result._programs });
    } catch (err) {
      if (err instanceof BudgetExceededError) return budgetExceededResponse(err);
      const detail = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: "suggest_failed", detail },
        { status: 500 },
      );
    }
  }

  // Unguarded path: org_id absent or membership not confirmed.
  // Acceptable for a ~$0.003 onboarding call; no session row inserted.
  // TODO: once orgs are always created before this call, require org_id.
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
