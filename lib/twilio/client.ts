/**
 * Shared Twilio Client
 *
 * Singleton Twilio client used by both WhatsApp and Voice modules.
 * Lazy-initialized to avoid build-time errors when env vars aren't set.
 */

import twilio from "twilio";

let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Get the shared Twilio client instance.
 * Throws if credentials are not configured.
 */
export function getTwilioClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("Twilio credentials not configured");
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

/** Twilio phone number for voice calls */
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/** Twilio WhatsApp number */
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
