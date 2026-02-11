import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { detectPatterns } from "@/lib/voice-intel/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/voice-intel-patterns
 * Detect patterns for all active users and store in context
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get distinct users who have classifications
    const { data: allUsers, error: usersError } = await supabase
      .from("voice_intel_classifications")
      .select("user_id");

    if (usersError) {
      console.error("[VoiceIntelPatterns] Error fetching users:", usersError);
      return Response.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const userIds = [...new Set((allUsers || []).map((r) => r.user_id))];

    console.log(
      `[VoiceIntelPatterns] Processing ${userIds.length} users`
    );

    let usersProcessed = 0;

    for (const userId of userIds) {
      try {
        const patterns = await detectPatterns(userId);

        if (patterns.length === 0) continue;

        // Store each pattern as a keyword-type context entry
        const contextInserts = patterns.map((p) => ({
          user_id: userId,
          context_type: "keyword" as const,
          name: `pattern:${p.type}:${p.title.slice(0, 80)}`,
          aliases: [],
          metadata: {
            pattern_type: p.type,
            title: p.title,
            description: p.description,
            data: p.data,
            generated_at: new Date().toISOString(),
            source: "cron_pattern_detection",
          },
          is_active: true,
        }));

        // Upsert to avoid duplicates
        const { error: upsertError } = await supabase
          .from("voice_intel_context")
          .upsert(contextInserts, {
            onConflict: "user_id,context_type,name",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(
            `[VoiceIntelPatterns] Upsert error for user ${userId}:`,
            upsertError
          );
        } else {
          usersProcessed++;
        }
      } catch (err) {
        console.error(
          `[VoiceIntelPatterns] Error processing user ${userId}:`,
          err
        );
      }
    }

    return Response.json({
      success: true,
      usersProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[VoiceIntelPatterns] Cron job error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
