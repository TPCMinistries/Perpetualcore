/**
 * Response Formatter
 *
 * Formats AI responses for each channel's specific requirements.
 * Handles markdown conversion, length limits, code blocks, and rich content.
 */

import { ChannelType, ChannelResponse } from "./types";

/**
 * Format an AI response for a specific channel.
 *
 * @param response - The raw AI response
 * @param channelType - The target channel
 * @returns The formatted ChannelResponse
 */
export function formatResponseForChannel(
  response: ChannelResponse,
  channelType: ChannelType
): ChannelResponse {
  switch (channelType) {
    case "telegram":
      return formatForTelegram(response);
    case "slack":
      return formatForSlack(response);
    case "whatsapp":
      return formatForWhatsApp(response);
    case "discord":
      return formatForDiscord(response);
    case "email":
      return formatForEmail(response);
    default:
      return response;
  }
}

/**
 * Format response for Telegram.
 * - Supports Markdown (bold, italic, code, links)
 * - Max 4096 chars per message
 * - Code blocks preserved
 */
function formatForTelegram(response: ChannelResponse): ChannelResponse {
  let text = response.text;

  // Convert standard markdown headers to bold text (Telegram doesn't support headers)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // Ensure code blocks use Telegram-friendly format
  // Telegram uses ``` for code blocks and ` for inline code (same as standard markdown)

  // Convert horizontal rules to dashes
  text = text.replace(/^---+$/gm, "---");

  // Trim to max length (the adapter handles splitting, but trim excessive responses)
  if (text.length > 4096 * 5) {
    text = text.substring(0, 4096 * 5 - 100) + "\n\n... (response truncated)";
  }

  return {
    ...response,
    text,
  };
}

/**
 * Format response for Slack.
 * - Uses Slack mrkdwn (not standard Markdown)
 * - Bold: *text*, Italic: _text_, Code: `code`, Links: <url|text>
 * - Code blocks: ``` code ```
 */
function formatForSlack(response: ChannelResponse): ChannelResponse {
  let text = response.text;

  // Convert standard markdown bold (**text**) to Slack bold (*text*)
  text = text.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Convert standard markdown headers to bold with newlines
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // Convert standard markdown links [text](url) to Slack links <url|text>
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, "<$2|$1>");

  // Convert standard markdown italic to Slack italic
  // Only handle single underscores/asterisks (double already converted above)
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "_$1_");

  // Preserve code blocks (same syntax in Slack)

  return {
    ...response,
    text,
  };
}

/**
 * Format response for WhatsApp.
 * - Plain text with minimal formatting
 * - Bold: *text*, Italic: _text_
 * - Max 1600 chars recommended per message
 * - No code blocks (use plain text)
 */
function formatForWhatsApp(response: ChannelResponse): ChannelResponse {
  let text = response.text;

  // Convert markdown headers to bold
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // Convert markdown bold
  text = text.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Convert code blocks to plain text with indentation
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_match, code) => {
    return code
      .split("\n")
      .map((line: string) => `  ${line}`)
      .join("\n");
  });

  // Convert inline code to plain text
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove markdown links, keep the text
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");

  // Trim to a reasonable length
  if (text.length > 1600 * 5) {
    text = text.substring(0, 1600 * 5 - 80) + "\n\n... (response truncated)";
  }

  return {
    ...response,
    text,
  };
}

/**
 * Format response for Discord.
 * - Standard Markdown (bold, italic, code, headers)
 * - Max 2000 chars per message
 * - Supports code blocks with syntax highlighting
 */
function formatForDiscord(response: ChannelResponse): ChannelResponse {
  let text = response.text;

  // Discord supports standard markdown natively, minimal transformation needed

  // Trim to Discord limit
  if (text.length > 2000 * 5) {
    text = text.substring(0, 2000 * 5 - 80) + "\n\n... (response truncated)";
  }

  return {
    ...response,
    text,
  };
}

/**
 * Format response for Email.
 * - Full HTML support
 * - Convert Markdown to basic HTML for email clients
 */
function formatForEmail(response: ChannelResponse): ChannelResponse {
  let text = response.text;

  // Convert markdown headers to HTML
  text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Convert bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Convert italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Convert code blocks
  text = text.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre style="background:#f4f4f4;padding:12px;border-radius:4px;overflow-x:auto;"><code>$2</code></pre>'
  );

  // Convert inline code
  text = text.replace(
    /`([^`]+)`/g,
    '<code style="background:#f4f4f4;padding:2px 6px;border-radius:3px;">$1</code>'
  );

  // Convert links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Convert line breaks to <br> for email
  text = text.replace(/\n/g, "<br>");

  return {
    ...response,
    text,
  };
}
