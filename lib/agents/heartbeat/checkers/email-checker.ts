/**
 * Email Checker
 *
 * Checks for recent unread emails and categorizes them by urgency.
 * Uses the existing Gmail integration to fetch emails.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { CheckResult, CheckItem } from "../types";

/**
 * Check recent emails for actionable items.
 *
 * Fetches unread emails since the last heartbeat check,
 * categorizes them by urgency, and returns a structured CheckResult.
 *
 * @param userId - The Perpetual Core user ID
 * @returns CheckResult with categorized email items
 */
export async function checkEmails(userId: string): Promise<CheckResult> {
  const supabase = createAdminClient();
  const items: CheckItem[] = [];

  try {
    // Check if user has Gmail credentials
    const { data: credentials } = await supabase
      .from("user_integrations")
      .select("access_token, refresh_token, metadata")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .eq("is_active", true)
      .single();

    if (!credentials) {
      return {
        type: "email",
        items: [],
        summary: "Gmail not connected. Connect Gmail in Settings > Integrations to enable email monitoring.",
        urgency: "low",
      };
    }

    // Get the last heartbeat check time for emails
    const { data: lastRun } = await supabase
      .from("heartbeat_runs")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    const since = lastRun?.completed_at
      ? new Date(lastRun.completed_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    // Fetch unread emails via Gmail API
    const emails = await fetchRecentEmails(credentials.access_token, since);

    if (emails.length === 0) {
      return {
        type: "email",
        items: [],
        summary: "No new unread emails since last check.",
        urgency: "low",
      };
    }

    // Categorize each email
    for (const email of emails) {
      const urgency = categorizeEmailUrgency(email);
      const category = urgency === "high" || urgency === "critical"
        ? "urgent_email"
        : "unread_email";

      items.push({
        title: `From ${email.from}: ${email.subject}`,
        description: email.snippet || email.subject,
        urgency,
        category,
        metadata: {
          emailId: email.id,
          threadId: email.threadId,
          from: email.from,
          subject: email.subject,
          receivedAt: email.receivedAt,
        },
      });
    }

    // Determine overall urgency
    const hasUrgent = items.some(
      (i) => i.urgency === "high" || i.urgency === "critical"
    );
    const overallUrgency = hasUrgent ? "high" : items.length > 5 ? "medium" : "low";

    const urgentCount = items.filter(
      (i) => i.urgency === "high" || i.urgency === "critical"
    ).length;

    const summary = urgentCount > 0
      ? `${items.length} unread email(s), ${urgentCount} flagged as urgent.`
      : `${items.length} unread email(s) since last check.`;

    return {
      type: "email",
      items,
      summary,
      urgency: overallUrgency,
    };
  } catch (error: any) {
    console.error("[EmailChecker] Error checking emails:", error);
    return {
      type: "email",
      items: [],
      summary: `Error checking emails: ${error.message}`,
      urgency: "low",
    };
  }
}

/**
 * Fetch recent unread emails from Gmail API.
 * Uses a simplified Gmail API call with the user's access token.
 */
async function fetchRecentEmails(
  accessToken: string,
  since: Date
): Promise<
  Array<{
    id: string;
    threadId: string;
    from: string;
    subject: string;
    snippet: string;
    receivedAt: string;
    labels: string[];
  }>
> {
  try {
    const sinceEpoch = Math.floor(since.getTime() / 1000);
    const query = `is:unread after:${sinceEpoch}`;

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      console.error("[EmailChecker] Gmail API list error:", listResponse.status);
      return [];
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    if (messageIds.length === 0) return [];

    // Fetch details for each message (batch in parallel, max 10)
    const emailPromises = messageIds.slice(0, 10).map(async (msg: any) => {
      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!detailResponse.ok) return null;
      const detail = await detailResponse.json();

      const headers = detail.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name === "From");
      const subjectHeader = headers.find((h: any) => h.name === "Subject");

      return {
        id: detail.id,
        threadId: detail.threadId,
        from: fromHeader?.value || "Unknown",
        subject: subjectHeader?.value || "(No Subject)",
        snippet: detail.snippet || "",
        receivedAt: new Date(parseInt(detail.internalDate)).toISOString(),
        labels: detail.labelIds || [],
      };
    });

    const emails = await Promise.all(emailPromises);
    return emails.filter(Boolean) as any[];
  } catch (error) {
    console.error("[EmailChecker] Error fetching emails:", error);
    return [];
  }
}

/**
 * Categorize email urgency based on sender, subject, and labels.
 */
function categorizeEmailUrgency(email: {
  from: string;
  subject: string;
  snippet: string;
  labels: string[];
}): "low" | "medium" | "high" | "critical" {
  const combined = `${email.subject} ${email.snippet}`.toLowerCase();

  // Critical indicators
  const criticalKeywords = ["emergency", "critical", "down", "outage", "security breach"];
  if (criticalKeywords.some((k) => combined.includes(k))) return "critical";

  // High urgency indicators
  const urgentKeywords = [
    "urgent", "asap", "immediately", "deadline today",
    "time sensitive", "action required", "respond by",
  ];
  if (urgentKeywords.some((k) => combined.includes(k))) return "high";

  // Check Gmail labels
  if (email.labels.includes("IMPORTANT")) return "medium";

  // Medium for specific patterns
  const mediumKeywords = [
    "please respond", "follow up", "can you", "need your",
    "review", "approve", "confirm",
  ];
  if (mediumKeywords.some((k) => combined.includes(k))) return "medium";

  return "low";
}
