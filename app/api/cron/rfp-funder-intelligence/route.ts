import { NextRequest, NextResponse } from "next/server";
import { runIrsBmfFunderProfileIngest } from "@/lib/rfp/funders/irs-bmf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && authHeader === `Bearer ${expected}`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIrsBmfFunderProfileIngest();
    return NextResponse.json({
      ok: result.errors.length === 0,
      result,
      warning:
        result.errors.length === 0
          ? null
          : "Funder ingest completed with warnings. See result.errors and cron logs.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[rfp-funder-intelligence] fatal:", err);
    return NextResponse.json(
      { ok: false, error: "funder_ingest_failed", message },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
