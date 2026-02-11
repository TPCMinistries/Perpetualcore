import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPersonBrief } from "@/lib/voice-intel/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const brief = await getPersonBrief(user.id, decodedName);

    return NextResponse.json(brief);
  } catch (error) {
    console.error("Person brief error:", error);
    return NextResponse.json(
      { error: "Failed to fetch person brief" },
      { status: 500 }
    );
  }
}
