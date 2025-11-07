import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBetaFollowUpEmail } from "@/lib/email";

/**
 * POST /api/beta/follow-up
 * Send follow-up emails to inactive beta testers
 * This can be called manually or set up as a cron job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here

    // Get beta testers who haven't been active in the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: inactiveUsers, error } = await supabase
      .from("user_activity_stats")
      .select("*")
      .or(`last_active.is.null,last_active.lt.${threeDaysAgo.toISOString()}`);

    if (error) {
      console.error("Error fetching inactive users:", error);
      return NextResponse.json(
        { error: "Failed to fetch inactive users" },
        { status: 500 }
      );
    }

    // Send follow-up emails
    const emailResults = [];
    for (const betaTester of inactiveUsers || []) {
      const daysInactive = betaTester.last_active
        ? Math.floor(
            (Date.now() - new Date(betaTester.last_active).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      const result = await sendBetaFollowUpEmail(
        betaTester.email,
        daysInactive
      );

      emailResults.push({
        email: betaTester.email,
        success: result.success,
        error: result.error,
      });

      // Log the result
      if (result.success) {
        console.log(`Follow-up email sent to ${betaTester.email}`);
      } else {
        console.error(
          `Failed to send follow-up email to ${betaTester.email}:`,
          result.error
        );
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailResults.filter((r) => r.success).length,
      emailsFailed: emailResults.filter((r) => !r.success).length,
      results: emailResults,
    });
  } catch (error: any) {
    console.error("Error sending follow-up emails:", error);
    return NextResponse.json(
      { error: "Failed to send follow-up emails" },
      { status: 500 }
    );
  }
}
