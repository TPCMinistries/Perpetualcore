/**
 * Voice Call Service
 *
 * Core functions for initiating, managing, and tracking voice calls via Twilio.
 * Uses createAdminClient() for all server-side DB operations.
 */

import { getTwilioClient, TWILIO_PHONE_NUMBER } from "@/lib/twilio/client";
import { createAdminClient } from "@/lib/supabase/server";
import { VoiceCall, CallStatus, TwiMLScript } from "./call-types";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

/**
 * Initiate an outbound voice call.
 */
export async function initiateCall(
  userId: string,
  to: string,
  script: TwiMLScript
): Promise<{ callId: string; callSid: string }> {
  const client = getTwilioClient();
  const supabase = createAdminClient();

  if (!TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER not configured");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    throw new Error("App URL not configured for TwiML callback");
  }

  const twimlUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/voice/calls/twiml`;
  const statusCallback = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/voice/calls/webhook`;

  // Create DB record first
  const { data: callRecord, error: dbError } = await supabase
    .from("voice_calls")
    .insert({
      user_id: userId,
      direction: "outbound",
      from_number: TWILIO_PHONE_NUMBER,
      to_number: to,
      status: "initiated",
      ai_script: script,
    })
    .select("id")
    .single();

  if (dbError || !callRecord) {
    throw new Error(`Failed to create call record: ${dbError?.message}`);
  }

  // Initiate Twilio call
  const call = await client.calls.create({
    to,
    from: TWILIO_PHONE_NUMBER,
    url: `${twimlUrl}?callId=${callRecord.id}`,
    statusCallback,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
    record: script.record ?? false,
    timeout: 30,
    ...(script.maxDuration ? { timeLimit: script.maxDuration } : {}),
  });

  // Update with callSid
  await supabase
    .from("voice_calls")
    .update({ call_sid: call.sid })
    .eq("id", callRecord.id);

  return { callId: callRecord.id, callSid: call.sid };
}

/**
 * Handle an incoming call by looking up user config and returning TwiML.
 */
export async function handleIncomingCall(
  callSid: string,
  from: string
): Promise<string> {
  const supabase = createAdminClient();

  // Log the incoming call
  await supabase.from("voice_calls").insert({
    call_sid: callSid,
    direction: "inbound",
    from_number: from,
    to_number: TWILIO_PHONE_NUMBER || "",
    status: "ringing",
    ai_script: {},
  });

  // Default greeting for incoming calls
  return generateTwiML({
    greeting:
      "Hello, you've reached Perpetual Core. Please leave a message after the tone.",
    record: true,
  });
}

/**
 * Generate TwiML XML from a script configuration.
 */
export function generateTwiML(script: TwiMLScript): string {
  const response = new VoiceResponse();

  if (script.greeting) {
    response.say({ voice: "Polly.Matthew" }, script.greeting);
  }

  if (script.instructions) {
    response.say({ voice: "Polly.Matthew" }, script.instructions);
  }

  if (script.gatherInput) {
    const gather = response.gather({
      input: ["speech", "dtmf"],
      timeout: 5,
      numDigits: 1,
    });
    gather.say(
      { voice: "Polly.Matthew" },
      "Please press a key or speak your response."
    );
  }

  if (script.record) {
    response.record({
      maxLength: script.maxDuration || 120,
      transcribe: true,
      playBeep: true,
    });
  }

  return response.toString();
}

/**
 * Get the current status of a call from Twilio.
 */
export async function getCallStatus(callSid: string): Promise<CallStatus> {
  const client = getTwilioClient();
  const call = await client.calls(callSid).fetch();

  const statusMap: Record<string, CallStatus> = {
    queued: "initiated",
    ringing: "ringing",
    "in-progress": "in-progress",
    completed: "completed",
    failed: "failed",
    busy: "busy",
    "no-answer": "no-answer",
    canceled: "canceled",
  };

  return statusMap[call.status] || "failed";
}

/**
 * End an active call.
 */
export async function endCall(callSid: string): Promise<void> {
  const client = getTwilioClient();
  await client.calls(callSid).update({ status: "completed" });
}

/**
 * Get a user's call history.
 */
export async function getUserCalls(
  userId: string,
  limit: number = 20
): Promise<VoiceCall[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("voice_calls")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(mapCallRow);
}

/**
 * Get a single call by ID.
 */
export async function getCallById(
  callId: string,
  userId: string
): Promise<VoiceCall | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("voice_calls")
    .select("*")
    .eq("id", callId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapCallRow(data);
}

function mapCallRow(row: any): VoiceCall {
  return {
    id: row.id,
    userId: row.user_id,
    callSid: row.call_sid,
    direction: row.direction,
    fromNumber: row.from_number,
    toNumber: row.to_number,
    status: row.status,
    durationSeconds: row.duration_seconds,
    recordingUrl: row.recording_url,
    transcript: row.transcript,
    aiScript: row.ai_script || {},
    costCents: row.cost_cents || 0,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}
