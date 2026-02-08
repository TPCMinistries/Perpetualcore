/**
 * Channel Hub - Main Entry Point
 *
 * Unified multi-channel message processing pipeline.
 * Normalizes messages from any supported channel, routes them through
 * the AI pipeline, formats the response, and sends it back.
 *
 * Usage:
 *   const response = await processChannelMessage("telegram", webhookPayload);
 */

import { ChannelType, ChannelAdapter, ChannelResponse } from "./types";
import { TelegramAdapter } from "./telegram-adapter";
import { SlackAdapter } from "./slack-adapter";
import { WhatsAppAdapter } from "./whatsapp-adapter";
import { routeMessage } from "./router";
import { formatResponseForChannel } from "./response-formatter";
import { trackActivity } from "@/lib/activity-feed/tracker";

/** Registry of channel adapters keyed by channel type */
const adapters: Record<ChannelType, ChannelAdapter> = {
  telegram: new TelegramAdapter(),
  slack: new SlackAdapter(),
  whatsapp: new WhatsAppAdapter(),
  // Discord and email adapters are placeholders -- implement when needed
  discord: new TelegramAdapter(), // Fallback; replace with DiscordAdapter
  email: new TelegramAdapter(), // Fallback; replace with EmailAdapter
};

/**
 * Process an incoming message from any supported channel.
 *
 * This is the main entry point for the channel hub. It:
 * 1. Gets the appropriate adapter for the channel type
 * 2. Normalizes the raw webhook payload into a unified format
 * 3. Routes the message through the AI pipeline
 * 4. Formats the response for the target channel
 * 5. Sends the response back via the channel
 * 6. Returns the response for the webhook handler
 *
 * @param channelType - Which channel the message came from
 * @param rawPayload - The raw webhook payload from the channel
 * @returns The formatted AI response
 */
export async function processChannelMessage(
  channelType: ChannelType,
  rawPayload: any
): Promise<ChannelResponse> {
  const startTime = Date.now();
  const adapter = getAdapter(channelType);

  try {
    // Step 1: Normalize the incoming message
    const message = adapter.normalizeMessage(rawPayload);

    // Step 2: Route through AI pipeline
    const response = await routeMessage(message, adapter);

    // Step 3: Format response for the channel
    const formattedResponse = formatResponseForChannel(response, channelType);

    // Step 4: Send the response back via the channel
    await adapter.sendResponse(
      message.channelUserId,
      formattedResponse.text,
      {
        replyToMessageId: message.channelMessageId,
      }
    );

    const processingTime = Date.now() - startTime;
    console.log(
      `[ChannelHub] Processed ${channelType} message in ${processingTime}ms`
    );

    return formattedResponse;
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(
      `[ChannelHub] Error processing ${channelType} message after ${processingTime}ms:`,
      error
    );

    // Try to send an error message back to the user
    try {
      const message = adapter.normalizeMessage(rawPayload);
      await adapter.sendResponse(
        message.channelUserId,
        "Sorry, I ran into an issue processing your message. Please try again in a moment."
      );
    } catch (sendError) {
      // If we can't even send the error message, just log it
      console.error("[ChannelHub] Failed to send error message:", sendError);
    }

    return {
      text: "Sorry, I ran into an issue processing your message. Please try again in a moment.",
    };
  }
}

/**
 * Get the adapter for a specific channel type.
 *
 * @param channelType - The channel to get an adapter for
 * @returns The ChannelAdapter instance
 */
export function getAdapter(channelType: ChannelType): ChannelAdapter {
  const adapter = adapters[channelType];
  if (!adapter) {
    throw new Error(`Unsupported channel type: ${channelType}`);
  }
  return adapter;
}
