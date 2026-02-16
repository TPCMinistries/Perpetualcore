/**
 * Voice Call Detail API
 * GET: Get a specific call
 * DELETE: Cancel/end a call
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCallById, endCall } from "@/lib/voice/calls";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const call = await getCallById(id, user.id);

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json({ call });
  } catch (error: any) {
    console.error("[Voice Calls] Error getting call:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get call" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const call = await getCallById(id, user.id);

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!call.callSid) {
      return NextResponse.json(
        { error: "Call has no active session" },
        { status: 400 }
      );
    }

    // Only end calls that are still active
    const activeStatuses = ["initiated", "ringing", "in-progress"];
    if (!activeStatuses.includes(call.status)) {
      return NextResponse.json(
        { error: "Call is not active" },
        { status: 400 }
      );
    }

    await endCall(call.callSid);

    return NextResponse.json({ success: true, message: "Call ended" });
  } catch (error: any) {
    console.error("[Voice Calls] Error ending call:", error);
    return NextResponse.json(
      { error: error.message || "Failed to end call" },
      { status: 500 }
    );
  }
}
