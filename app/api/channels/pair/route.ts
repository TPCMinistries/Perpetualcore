/**
 * Channel Pairing API Route
 *
 * POST /api/channels/pair
 * Verifies a 6-digit pairing code entered by an authenticated user.
 * On success, links the channel to the user's profile so future
 * messages from that sender are processed by the AI agent.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyPairingCode } from "@/lib/channels/pairing";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'code' field" },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      return NextResponse.json(
        { error: "Pairing code must be exactly 6 digits" },
        { status: 400 }
      );
    }

    // Verify the code
    const result = await verifyPairingCode(trimmedCode, user.id);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      channel_type: result.channelType,
      channel_user_id: result.channelUserId,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Channel Pair API] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify pairing code", details: error.message },
      { status: 500 }
    );
  }
}
