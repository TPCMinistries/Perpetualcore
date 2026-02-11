import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getClipMarkersForMemo,
  autoGenerateClipMarkers,
} from "@/lib/voice-intel/audio-clipper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - List all clip markers for a specific voice memo
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clips = await getClipMarkersForMemo(memoId, user.id);

    return NextResponse.json({ clips, memoId });
  } catch (error) {
    console.error("Voice intel clips [memoId] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clip markers" },
      { status: 500 }
    );
  }
}

/**
 * POST - Auto-generate clip markers for a voice memo
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ memoId: string }> }
) {
  try {
    const { memoId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await autoGenerateClipMarkers(memoId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Voice intel clips [memoId] POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate clip markers" },
      { status: 500 }
    );
  }
}
