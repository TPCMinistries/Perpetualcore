import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectPatterns } from "@/lib/voice-intel/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patterns = await detectPatterns(user.id);

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error("Patterns error:", error);
    return NextResponse.json(
      { error: "Failed to detect patterns" },
      { status: 500 }
    );
  }
}
