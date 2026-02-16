/**
 * Voice Calls API
 * POST: Initiate an outbound call
 * GET: List user's call history
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCall, getUserCalls } from "@/lib/voice/calls";
import { TwiMLScript } from "@/lib/voice/call-types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, script } = body as { to: string; script?: TwiMLScript };

    if (!to) {
      return NextResponse.json(
        { error: "Phone number (to) is required" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic E.164 check)
    if (!/^\+[1-9]\d{1,14}$/.test(to)) {
      return NextResponse.json(
        { error: "Phone number must be in E.164 format (e.g., +1234567890)" },
        { status: 400 }
      );
    }

    const result = await initiateCall(user.id, to, script || {});

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[Voice Calls] Error initiating call:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate call" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const calls = await getUserCalls(user.id, limit);

    return NextResponse.json({ calls });
  } catch (error: any) {
    console.error("[Voice Calls] Error listing calls:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list calls" },
      { status: 500 }
    );
  }
}
