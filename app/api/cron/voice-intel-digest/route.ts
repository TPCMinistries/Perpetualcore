import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { buildDailyDigest } from "@/lib/voice-intel/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/voice-intel-digest
 * Send daily voice intelligence digest emails to active users
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    // Get distinct users who had classifications in the last 24h
    const { data: recentUsers, error: usersError } = await supabase
      .from("voice_intel_classifications")
      .select("user_id")
      .gte("created_at", twentyFourHoursAgo);

    if (usersError) {
      console.error("[VoiceIntelDigest] Error fetching users:", usersError);
      return Response.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Deduplicate user IDs
    const userIds = [...new Set((recentUsers || []).map((r) => r.user_id))];

    console.log(
      `[VoiceIntelDigest] Processing ${userIds.length} users with recent activity`
    );

    let usersNotified = 0;

    for (const userId of userIds) {
      try {
        // Get user email
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.admin.getUserById(userId);

        if (userError || !user?.email) {
          console.warn(
            `[VoiceIntelDigest] Could not get email for user ${userId}:`,
            userError
          );
          continue;
        }

        // Build and send digest
        const { subject, html } = await buildDailyDigest(userId);
        const result = await sendEmail(user.email, subject, html);

        if (result.success) {
          usersNotified++;
          console.log(
            `[VoiceIntelDigest] Sent digest to ${user.email}`
          );
        } else {
          console.warn(
            `[VoiceIntelDigest] Failed to send to ${user.email}:`,
            result.error
          );
        }
      } catch (err) {
        console.error(
          `[VoiceIntelDigest] Error processing user ${userId}:`,
          err
        );
      }
    }

    return Response.json({
      success: true,
      usersNotified,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[VoiceIntelDigest] Cron job error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
