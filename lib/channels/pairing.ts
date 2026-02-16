/**
 * DM Pairing Security System
 *
 * Unknown senders on any channel get a 6-digit pairing code before
 * the agent processes anything. The user must verify this code in
 * their Perpetual Core dashboard to link the channel.
 *
 * Flow:
 * 1. Unknown sender sends message on Telegram/Slack/WhatsApp/etc.
 * 2. System generates 6-digit code, stores in channel_pairing_codes (15-min expiry)
 * 3. System replies with pairing message containing the code
 * 4. User enters code in dashboard (POST /api/channels/pair)
 * 5. On verification, channel_user_id is linked to their profile
 * 6. Future messages from that channel_user_id route normally
 */

import { createAdminClient } from "@/lib/supabase/server";
import { ChannelType } from "./types";

/** Profile column names that store channel-specific user IDs */
const CHANNEL_LINK_COLUMNS: Record<ChannelType, string> = {
  telegram: "telegram_chat_id",
  slack: "slack_user_id",
  whatsapp: "whatsapp_number",
  discord: "discord_user_id",
  email: "email",
  teams: "teams_user_id",
};

/**
 * Generate a 6-digit pairing code for a channel sender.
 * Stores the code with a 15-minute expiry.
 *
 * @param userId - The Perpetual Core user to link (optional; for pre-initiated pairing)
 * @param channelType - Which channel the sender is on
 * @param channelUserId - The sender's ID on the channel
 * @returns The 6-digit pairing code
 */
export async function generatePairingCode(
  userId: string | null,
  channelType: ChannelType,
  channelUserId: string
): Promise<string> {
  const supabase = createAdminClient();

  // Generate a 6-digit numeric code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Set 15-minute expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  // Invalidate any existing unused codes for this channel_user_id
  await supabase
    .from("channel_pairing_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("channel_type", channelType)
    .eq("channel_user_id", channelUserId)
    .is("used_at", null);

  // Insert new pairing code
  const { error } = await supabase.from("channel_pairing_codes").insert({
    user_id: userId,
    channel_type: channelType,
    channel_user_id: channelUserId,
    code,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("[Pairing] Error generating code:", error);
    throw new Error(`Failed to generate pairing code: ${error.message}`);
  }

  return code;
}

/**
 * Verify a pairing code entered by the user in the dashboard.
 *
 * @param code - The 6-digit code
 * @param userId - The authenticated user ID (from dashboard session)
 * @returns Verification result with channel info if valid
 */
export async function verifyPairingCode(
  code: string,
  userId: string
): Promise<{
  valid: boolean;
  channelType?: ChannelType;
  channelUserId?: string;
  message: string;
}> {
  const supabase = createAdminClient();

  // Look up the code
  const { data: pairingRecord, error } = await supabase
    .from("channel_pairing_codes")
    .select("*")
    .eq("code", code)
    .is("used_at", null)
    .single();

  if (error || !pairingRecord) {
    return { valid: false, message: "Invalid or expired pairing code." };
  }

  // Check expiry
  if (new Date(pairingRecord.expires_at) < new Date()) {
    return { valid: false, message: "This pairing code has expired. Please request a new one." };
  }

  // Mark as used
  await supabase
    .from("channel_pairing_codes")
    .update({ used_at: new Date().toISOString(), user_id: userId })
    .eq("id", pairingRecord.id);

  // Link the channel to the user's profile
  const channelType = pairingRecord.channel_type as ChannelType;
  const channelUserId = pairingRecord.channel_user_id;
  const columnName = CHANNEL_LINK_COLUMNS[channelType];

  if (columnName) {
    const { error: linkError } = await supabase
      .from("profiles")
      .update({ [columnName]: channelUserId })
      .eq("id", userId);

    if (linkError) {
      console.error("[Pairing] Error linking channel:", linkError);
      return {
        valid: false,
        message: "Code verified but failed to link channel. Please try again.",
      };
    }
  }

  return {
    valid: true,
    channelType,
    channelUserId,
    message: `Successfully linked your ${channelType} account. Your AI assistant is now active on this channel.`,
  };
}

/**
 * Check if a channel sender is already linked to a user.
 *
 * @param channelType - Which channel to check
 * @param channelUserId - The sender's ID on the channel
 * @returns Whether the channel is linked, and to which user
 */
export async function isChannelLinked(
  channelType: ChannelType,
  channelUserId: string
): Promise<{ linked: boolean; userId?: string }> {
  const supabase = createAdminClient();

  const columnName = CHANNEL_LINK_COLUMNS[channelType];
  if (!columnName) {
    return { linked: false };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq(columnName, String(channelUserId))
    .single();

  if (error || !profile) {
    return { linked: false };
  }

  return { linked: true, userId: profile.id };
}

/**
 * Build a user-friendly pairing message to send back to an unknown sender.
 *
 * @param code - The 6-digit pairing code
 * @returns Formatted pairing instructions
 */
export function buildPairingMessage(code: string): string {
  return `I received your message, but I need to verify your identity first.

Please enter this code in your Perpetual Core dashboard:

${code}

Go to Settings > Channels > Pair Device and enter the code above.

This code expires in 15 minutes.`;
}
