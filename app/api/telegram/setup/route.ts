/**
 * Telegram Bot Setup Endpoint
 * Manage webhook configuration and bot settings
 */

import { NextRequest } from "next/server";
import {
  setTelegramWebhook,
  getTelegramWebhookInfo,
  deleteTelegramWebhook,
} from "@/lib/integrations/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/telegram/setup
 * Get current webhook status
 */
export async function GET(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return Response.json(
      {
        error: "TELEGRAM_BOT_TOKEN not configured",
        instructions:
          "Add TELEGRAM_BOT_TOKEN to your Vercel environment variables. Get it from @BotFather on Telegram.",
      },
      { status: 500 }
    );
  }

  const webhookInfo = await getTelegramWebhookInfo();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";

  return Response.json({
    configured: true,
    webhookInfo: webhookInfo?.result || null,
    expectedWebhookUrl: `${appUrl}/api/telegram/webhook`,
    instructions: {
      setWebhook: `POST /api/telegram/setup with body: { "action": "set_webhook" }`,
      deleteWebhook: `POST /api/telegram/setup with body: { "action": "delete_webhook" }`,
      testBot: "Send a message to your bot on Telegram",
    },
  });
}

/**
 * POST /api/telegram/setup
 * Configure webhook
 */
export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { action, webhookUrl } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
    const defaultWebhookUrl = `${appUrl}/api/telegram/webhook`;

    switch (action) {
      case "set_webhook": {
        const url = webhookUrl || defaultWebhookUrl;
        const success = await setTelegramWebhook(url);

        if (success) {
          return Response.json({
            success: true,
            message: "Webhook set successfully!",
            webhookUrl: url,
            nextSteps: [
              "1. Send /start to your bot on Telegram",
              "2. Link your account with /link your@email.com",
              "3. Start chatting!",
            ],
          });
        } else {
          return Response.json(
            { success: false, error: "Failed to set webhook" },
            { status: 500 }
          );
        }
      }

      case "delete_webhook": {
        const success = await deleteTelegramWebhook();
        return Response.json({
          success,
          message: success
            ? "Webhook deleted successfully"
            : "Failed to delete webhook",
        });
      }

      case "get_info": {
        const info = await getTelegramWebhookInfo();
        return Response.json(info);
      }

      default:
        return Response.json(
          {
            error: "Invalid action",
            validActions: ["set_webhook", "delete_webhook", "get_info"],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Telegram setup error:", error);
    return Response.json(
      { error: "Setup failed", details: error.message },
      { status: 500 }
    );
  }
}
