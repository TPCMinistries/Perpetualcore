import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requireWorkerAuthorization } from "@/lib/press/auth";
import { pressErrorResponse } from "@/lib/press/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireWorkerAuthorization(request.headers.get("authorization"));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !publishableKey) throw new PressHttpError(503, "Worker wake-up is not configured");
    return NextResponse.json({ url, publishableKey });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
