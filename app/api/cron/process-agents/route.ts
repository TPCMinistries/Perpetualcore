import { NextResponse } from "next/server";
import { processAllEmailMonitorAgents } from "@/lib/agents/email-monitor";

/**
 * Cron endpoint to process all email monitor agents
 * 
 * This endpoint is triggered by Vercel Cron (configured in vercel.json)
 * to run all enabled email monitor agents periodically.
 * 
 * Runs every hour to check for new emails and create tasks.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Processing email monitor agents...");

    const result = await processAllEmailMonitorAgents();

    console.log(
      `[Cron] Email monitor processing complete: ${result.totalAgents} agents, ${result.totalProcessed} emails processed, ${result.totalCreated} tasks created`
    );

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error processing email monitor agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
