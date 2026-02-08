/**
 * Heartbeat Agent - Main Orchestrator
 *
 * Runs the autonomous heartbeat check for a user:
 * 1. Load user's heartbeat config
 * 2. Run all enabled checkers in parallel
 * 3. Pass results to the AI reasoner
 * 4. Save the heartbeat run to DB
 * 5. Notify user via preferred channel
 * 6. Track in activity feed
 */

import { createAdminClient } from "@/lib/supabase/server";
import { trackActivity } from "@/lib/activity-feed/tracker";
import {
  HeartbeatConfig,
  HeartbeatRun,
  CheckResult,
  DEFAULT_HEARTBEAT_CONFIG,
} from "./types";
import { checkEmails } from "./checkers/email-checker";
import { checkCalendar } from "./checkers/calendar-checker";
import { checkTasks } from "./checkers/task-checker";
import { checkContacts } from "./checkers/contact-checker";
import { analyzeCheckResults } from "./reasoner";
import { notifyUser } from "./notifier";

/**
 * Run the heartbeat agent for a single user.
 *
 * This is the main entry point for the heartbeat system.
 * Can be called manually via API or automatically via cron.
 *
 * @param userId - The Perpetual Core user ID
 * @param configOverride - Optional partial config to override defaults
 * @returns The complete HeartbeatRun record
 */
export async function runHeartbeat(
  userId: string,
  configOverride?: Partial<HeartbeatConfig>
): Promise<HeartbeatRun> {
  const supabase = createAdminClient();
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Create the run record
  await supabase.from("heartbeat_runs").insert({
    id: runId,
    user_id: userId,
    status: "running",
    checks_run: [],
    check_results: {},
    insights: [],
    started_at: startedAt,
  });

  try {
    // Load user's heartbeat config
    const config = await loadHeartbeatConfig(userId, configOverride);

    // Run enabled checkers in parallel
    const checkPromises: Promise<CheckResult>[] = [];
    const checksRun: string[] = [];

    if (config.checks.email) {
      checkPromises.push(checkEmails(userId));
      checksRun.push("email");
    }

    if (config.checks.calendar) {
      checkPromises.push(checkCalendar(userId));
      checksRun.push("calendar");
    }

    if (config.checks.tasks) {
      checkPromises.push(checkTasks(userId));
      checksRun.push("tasks");
    }

    if (config.checks.contacts) {
      checkPromises.push(checkContacts(userId));
      checksRun.push("contacts");
    }

    console.log(
      `[Heartbeat] Running checks for user ${userId}: ${checksRun.join(", ")}`
    );

    const checkResults = await Promise.all(checkPromises);

    // Pass results to the AI reasoner
    const insights = await analyzeCheckResults(userId, checkResults);

    const completedAt = new Date().toISOString();

    // Update the run record with results
    await supabase
      .from("heartbeat_runs")
      .update({
        status: "completed",
        checks_run: checksRun,
        check_results: Object.fromEntries(
          checkResults.map((r) => [r.type, r])
        ),
        insights,
        completed_at: completedAt,
      })
      .eq("id", runId);

    // Notify user via preferred channel
    let notificationSent = false;
    let notificationChannel = "";

    // Only notify if there are actionable insights
    const hasActionableInsights = insights.some(
      (i) => i.urgency !== "low" || i.category !== "summary"
    );

    if (hasActionableInsights) {
      const notifyResult = await notifyUser(userId, insights, runId);
      notificationSent = notifyResult.sent;
      notificationChannel = notifyResult.channel;

      // Update notification status
      await supabase
        .from("heartbeat_runs")
        .update({
          notification_sent: notificationSent,
          notification_channel: notificationChannel,
        })
        .eq("id", runId);
    }

    // Track in activity feed (fire-and-forget)
    const totalItems = checkResults.reduce((sum, r) => sum + r.items.length, 0);
    const urgentItems = checkResults.reduce(
      (sum, r) =>
        sum +
        r.items.filter(
          (i) => i.urgency === "high" || i.urgency === "critical"
        ).length,
      0
    );

    trackActivity({
      userId,
      eventType: "heartbeat_completed",
      title: "Heartbeat check completed",
      description: `Checked ${checksRun.join(", ")}. Found ${totalItems} item(s), ${urgentItems} urgent. Generated ${insights.length} insight(s).`,
      metadata: {
        heartbeatRunId: runId,
        checksRun,
        totalItems,
        urgentItems,
        insightCount: insights.length,
        notificationSent,
        notificationChannel,
      },
    }).catch(() => {});

    console.log(
      `[Heartbeat] Completed for user ${userId}: ${totalItems} items, ${insights.length} insights`
    );

    return {
      id: runId,
      userId,
      startedAt,
      completedAt,
      checkResults,
      insights,
      status: "completed",
    };
  } catch (error: any) {
    console.error(`[Heartbeat] Failed for user ${userId}:`, error);

    // Update the run record with failure
    await supabase
      .from("heartbeat_runs")
      .update({
        status: "failed",
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      id: runId,
      userId,
      startedAt,
      completedAt: new Date().toISOString(),
      checkResults: [],
      insights: [],
      status: "failed",
      errorMessage: error.message,
    };
  }
}

/**
 * Load the user's heartbeat configuration.
 * Falls back to defaults if no saved config exists.
 */
async function loadHeartbeatConfig(
  userId: string,
  override?: Partial<HeartbeatConfig>
): Promise<HeartbeatConfig> {
  const supabase = createAdminClient();

  // Check for saved config in user profile or preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .single();

  const savedConfig = profile?.notification_preferences?.heartbeat || {};

  const config: HeartbeatConfig = {
    ...DEFAULT_HEARTBEAT_CONFIG,
    userId,
    ...savedConfig,
    ...override,
    checks: {
      ...DEFAULT_HEARTBEAT_CONFIG.checks,
      ...(savedConfig.checks || {}),
      ...(override?.checks || {}),
    },
  };

  return config;
}
