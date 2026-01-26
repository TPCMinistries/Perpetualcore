/**
 * Proactive Nudges Cron Job
 * Runs every 15 minutes to check for and send proactive nudges
 *
 * This cron job:
 * 1. Fetches users who have proactive nudges enabled
 * 2. Generates personalized nudges based on their data
 * 3. Sends via their preferred channel (Telegram, WhatsApp, in-app)
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  runProactiveNudger,
  getUserNudgeConfig,
  NudgeConfig
} from "@/lib/ai/proactive-nudger";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Also check for Vercel cron header
    const vercelCron = req.headers.get("x-vercel-cron");
    if (!vercelCron) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const results: {
    processed: number;
    nudgesSent: number;
    errors: string[];
  } = {
    processed: 0,
    nudgesSent: 0,
    errors: [],
  };

  try {
    // Get users with proactive nudges enabled
    // For now, get users who have either telegram_chat_id or whatsapp_number set
    const { data: eligibleUsers, error: userError } = await supabase
      .from("profiles")
      .select("id, organization_id, telegram_chat_id, whatsapp_number, notification_preferences")
      .or("telegram_chat_id.not.is.null,whatsapp_number.not.is.null")
      .not("notification_preferences->proactive_nudges_enabled", "eq", false)
      .limit(50); // Process max 50 users per run

    if (userError) {
      console.error("Error fetching eligible users:", userError);
      return Response.json(
        { error: "Failed to fetch users", details: userError.message },
        { status: 500 }
      );
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return Response.json({
        message: "No users eligible for proactive nudges",
        results,
      });
    }

    console.log(`Processing proactive nudges for ${eligibleUsers.length} users`);

    // Process each user
    for (const user of eligibleUsers) {
      try {
        const config = await getUserNudgeConfig(user.id);

        if (!config) {
          console.log(`Skipping user ${user.id} - no config`);
          continue;
        }

        // Check if user has a valid channel configured
        if (config.preferredChannel === "telegram" && !config.telegramChatId) {
          console.log(`Skipping user ${user.id} - telegram preferred but no chat ID`);
          continue;
        }
        if (config.preferredChannel === "whatsapp" && !config.whatsappNumber) {
          console.log(`Skipping user ${user.id} - whatsapp preferred but no number`);
          continue;
        }

        // Run the nudger
        const sentNudges = await runProactiveNudger(config);

        results.processed++;
        results.nudgesSent += sentNudges.length;

        if (sentNudges.length > 0) {
          console.log(`Sent ${sentNudges.length} nudges to user ${user.id}`);
        }
      } catch (userError: any) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.errors.push(`User ${user.id}: ${userError.message}`);
      }
    }

    // Log cron execution
    await supabase.from("cron_executions").insert({
      cron_name: "proactive-nudges",
      executed_at: new Date().toISOString(),
      users_processed: results.processed,
      nudges_sent: results.nudgesSent,
      errors: results.errors,
      status: results.errors.length > 0 ? "partial_success" : "success",
    });

    return Response.json({
      message: "Proactive nudges cron completed",
      results,
    });
  } catch (error: any) {
    console.error("Proactive nudges cron error:", error);

    // Log failed execution
    await supabase.from("cron_executions").insert({
      cron_name: "proactive-nudges",
      executed_at: new Date().toISOString(),
      users_processed: results.processed,
      nudges_sent: results.nudgesSent,
      errors: [error.message],
      status: "failed",
    });

    return Response.json(
      { error: "Cron job failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for manually triggering nudges for a specific user
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, force } = await req.json();

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const config = await getUserNudgeConfig(userId);

    if (!config) {
      return Response.json(
        { error: "User not found or not configured for nudges" },
        { status: 404 }
      );
    }

    // If force=true, ignore quiet hours and recent nudge checks
    const sentNudges = await runProactiveNudger(config);

    return Response.json({
      message: sentNudges.length > 0 ? "Nudges sent" : "No nudges to send",
      nudgesSent: sentNudges.length,
      nudges: sentNudges,
    });
  } catch (error: any) {
    console.error("Manual nudge trigger error:", error);
    return Response.json(
      { error: "Failed to send nudges", details: error.message },
      { status: 500 }
    );
  }
}
