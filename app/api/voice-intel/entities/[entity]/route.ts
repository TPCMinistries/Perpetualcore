import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEntityDashboard } from "@/lib/voice-intel/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entity } = await params;
    const decodedEntity = decodeURIComponent(entity);

    const dashboard = await getEntityDashboard(user.id, decodedEntity);

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Entity dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entity dashboard" },
      { status: 500 }
    );
  }
}
