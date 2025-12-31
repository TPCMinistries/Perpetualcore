import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/content
 * Fetch all content for the authenticated user
 *
 * Query params:
 * - type: filter by content_type
 * - platform: filter by platform
 * - status: filter by status
 * - scheduled_from: ISO date
 * - scheduled_to: ISO date
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const scheduledFrom = searchParams.get("scheduled_from");
    const scheduledTo = searchParams.get("scheduled_to");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("content_queue")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("content_type", type);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (scheduledFrom) {
      query = query.gte("scheduled_for", scheduledFrom);
    }
    if (scheduledTo) {
      query = query.lte("scheduled_for", scheduledTo);
    }

    const { data: content, count, error } = await query;

    if (error) {
      console.error("Failed to fetch content:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get stats
    const { data: allContent } = await supabase
      .from("content_queue")
      .select("status, content_type, platform")
      .eq("user_id", user.id);

    const stats = {
      total: allContent?.length || 0,
      draft: allContent?.filter(c => c.status === "draft").length || 0,
      review: allContent?.filter(c => c.status === "review").length || 0,
      scheduled: allContent?.filter(c => c.status === "scheduled").length || 0,
      published: allContent?.filter(c => c.status === "published").length || 0,
      byPlatform: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    allContent?.forEach(c => {
      if (c.platform) {
        stats.byPlatform[c.platform] = (stats.byPlatform[c.platform] || 0) + 1;
      }
      if (c.content_type) {
        stats.byType[c.content_type] = (stats.byType[c.content_type] || 0) + 1;
      }
    });

    return Response.json({
      success: true,
      content,
      total: count,
      stats,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error("GET /api/content error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/content
 * Create new content (draft or send to AI for generation)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.content_type) {
      return Response.json({ error: "content_type is required" }, { status: 400 });
    }

    // Create content
    const { data: content, error } = await supabase
      .from("content_queue")
      .insert({
        user_id: user.id,
        title: body.title,
        content_type: body.content_type,
        platform: body.platform || null,
        draft_content: body.draft_content || null,
        hook: body.hook || null,
        call_to_action: body.call_to_action || null,
        hashtags: body.hashtags || [],
        mentions: body.mentions || [],
        ai_prompt: body.ai_prompt || null,
        status: body.status || "draft",
        scheduled_for: body.scheduled_for || null,
        research_id: body.research_id || null,
        meeting_id: body.meeting_id || null,
        media_urls: body.media_urls || [],
        thumbnail_url: body.thumbnail_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create content:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // If generate_now is true, send to n8n for AI generation
    if (body.generate_now && body.ai_prompt) {
      const n8nWebhookUrl = process.env.N8N_CONTENT_GENERATOR_WEBHOOK;

      if (n8nWebhookUrl) {
        // Update status
        await supabase
          .from("content_queue")
          .update({ status: "draft", ai_generated: false })
          .eq("id", content.id);

        const n8nPayload = {
          content_id: content.id,
          user_id: user.id,
          content_type: body.content_type,
          platform: body.platform,
          title: body.title,
          ai_prompt: body.ai_prompt,
          tone: body.tone || "professional",
          length: body.length || "medium",
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/content-generated`,
        };

        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify(n8nPayload),
        }).catch((err) => {
          console.error("Failed to send to n8n:", err);
        });

        return Response.json({
          success: true,
          content,
          message: "Content created and sent for AI generation",
        });
      }
    }

    return Response.json({
      success: true,
      content,
    });

  } catch (error: any) {
    console.error("POST /api/content error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
