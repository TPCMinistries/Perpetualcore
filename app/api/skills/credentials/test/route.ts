import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCredential } from "@/lib/skills/credentials";

/**
 * POST /api/skills/credentials/test
 * Test an API key without saving it
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    const result = await validateCredential(provider, apiKey);

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error("Error testing credential:", error);
    return NextResponse.json(
      { valid: false, error: error.message || "Connection test failed" },
      { status: 500 }
    );
  }
}
