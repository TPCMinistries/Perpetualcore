import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import {
  exportAsJSON,
} from "@/lib/import-export/export";
import { gateFeature } from "@/lib/features/gate";

/**
 * POST /api/data-export
 *
 * GDPR data export endpoint.
 * For now, generates an immediate JSON export of all user data.
 * In the future, large exports could be queued as background jobs.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.export);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // Feature gate: API access (data export is a premium feature)
    const gate = await gateFeature("api_access", profile.organization_id);
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, code: "FEATURE_GATED", upgrade: gate.upgrade },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { format = "json" } = body;

    // Generate the full export
    const exportData = await exportAsJSON(user.id, profile.organization_id);

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="perpetual-core-export-${new Date().toISOString().split("T")[0]}.${format}"`,
      },
    });
  } catch (error) {
    console.error("[DataExport] Error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
