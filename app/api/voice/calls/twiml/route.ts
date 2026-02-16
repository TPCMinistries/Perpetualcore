/**
 * TwiML Endpoint
 * POST: Returns TwiML XML for Twilio to execute during a call.
 * Called by Twilio when a call connects.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTwiML } from "@/lib/voice/calls";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      // Default TwiML for unidentified calls
      const twiml = generateTwiML({
        greeting: "Hello. This call was initiated by Perpetual Core.",
      });
      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const supabase = createAdminClient();

    const { data: call } = await supabase
      .from("voice_calls")
      .select("ai_script")
      .eq("id", callId)
      .single();

    const script = call?.ai_script || {
      greeting: "Hello. This call was initiated by Perpetual Core.",
    };

    const twiml = generateTwiML(script);

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("[TwiML] Error:", error);

    // Return a basic TwiML response so the call doesn't hang
    const fallback = generateTwiML({
      greeting: "We're sorry, an error occurred. Please try again later.",
    });
    return new NextResponse(fallback, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
