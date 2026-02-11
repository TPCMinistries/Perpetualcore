import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import type { ActionTier, ActionStatus } from "@/lib/voice-intel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_TIERS: ActionTier[] = ["red", "yellow", "green"];
const VALID_STATUSES: ActionStatus[] = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "auto_completed",
];

/**
 * GET - List voice intel actions with filters
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.api);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tier = searchParams.get("tier") as ActionTier | null;
    const status = searchParams.get("status") as ActionStatus | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("voice_intel_actions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tier && VALID_TIERS.includes(tier)) {
      query = query.eq("tier", tier);
    }

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    const { data: actions, error, count } = await query;

    if (error) {
      console.error("Voice intel actions fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      actions: actions || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Voice intel actions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}
