/**
 * Twilio Voice Webhook
 * POST: Handles Twilio status callbacks and recording notifications.
 * Updates call records in the database based on Twilio events.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const transcriptionText = formData.get("TranscriptionText") as string;

    if (!callSid) {
      return NextResponse.json(
        { error: "CallSid is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Map Twilio status to our status
    const statusMap: Record<string, string> = {
      queued: "initiated",
      initiated: "initiated",
      ringing: "ringing",
      "in-progress": "in-progress",
      completed: "completed",
      failed: "failed",
      busy: "busy",
      "no-answer": "no-answer",
      canceled: "canceled",
    };

    const updates: Record<string, any> = {
      status: statusMap[callStatus] || callStatus,
    };

    // Set started_at on first answer
    if (callStatus === "in-progress") {
      updates.started_at = new Date().toISOString();
    }

    // Set ended_at and duration on completion
    if (
      callStatus === "completed" ||
      callStatus === "failed" ||
      callStatus === "busy" ||
      callStatus === "no-answer" ||
      callStatus === "canceled"
    ) {
      updates.ended_at = new Date().toISOString();
      if (callDuration) {
        updates.duration_seconds = parseInt(callDuration, 10);
        // Twilio charges ~$0.014/min for outbound US calls
        updates.cost_cents = Math.ceil(
          (parseInt(callDuration, 10) / 60) * 1.4
        );
      }
    }

    // Store recording URL if provided
    if (recordingUrl) {
      updates.recording_url = recordingUrl + ".mp3";
    }

    // Store transcription if provided
    if (transcriptionText) {
      updates.transcript = transcriptionText;
    }

    const { error } = await supabase
      .from("voice_calls")
      .update(updates)
      .eq("call_sid", callSid);

    if (error) {
      console.error("[Voice Webhook] DB update error:", error);
    }

    // Return 200 to acknowledge the webhook
    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[Voice Webhook] Error:", error);
    // Still return 200 to avoid Twilio retries
    return new NextResponse("OK", { status: 200 });
  }
}
