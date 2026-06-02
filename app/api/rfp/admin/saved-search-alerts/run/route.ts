import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRfpPlatformAdmin } from "@/lib/rfp/admin";
import { runSavedSearchAlerts } from "@/lib/rfp/saved-search-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RunBodySchema = z
  .object({
    dry_run: z.boolean().default(true),
    force: z.boolean().default(false),
    limit: z.number().int().min(1).max(500).default(100),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin = await getRfpPlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RunBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await runSavedSearchAlerts({
      dryRun: parsed.data.dry_run,
      force: parsed.data.force,
      limit: parsed.data.limit,
    });
    return NextResponse.json({
      ...result,
      operator_user_id: admin.user_id,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "saved_search_alerts_failed", detail: detail.slice(0, 200) },
      { status: 500 },
    );
  }
}
