/**
 * Voice Call Types
 *
 * Interfaces for the Twilio voice call system.
 */

export interface VoiceCall {
  id: string;
  userId: string;
  callSid: string | null;
  direction: "inbound" | "outbound";
  fromNumber: string;
  toNumber: string;
  status: CallStatus;
  durationSeconds: number | null;
  recordingUrl: string | null;
  transcript: string | null;
  aiScript: TwiMLScript;
  costCents: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export type CallStatus =
  | "initiated"
  | "ringing"
  | "in-progress"
  | "completed"
  | "failed"
  | "busy"
  | "no-answer"
  | "canceled";

export interface TwiMLScript {
  /** Opening greeting spoken when the call connects */
  greeting?: string;
  /** Instructions or message body spoken during the call */
  instructions?: string;
  /** Whether to gather DTMF or speech input from the caller */
  gatherInput?: boolean;
  /** Maximum call duration in seconds */
  maxDuration?: number;
  /** Whether to record the call */
  record?: boolean;
  /** URL to call back with status updates */
  callbackUrl?: string;
}
