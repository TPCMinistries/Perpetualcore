import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ContentStatus } from "@/types/entities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/content
 * Fetch content items with entity/brand context
 *
 * Query params:
 * - brand_id: filter by brand (new entity architecture)
 * - entity_id: filter by entity
 * - project_id: filter by project
 * - status: filter by content status
 * - content_type_id: filter by content type
 * - scheduled_from/to: date range for scheduled content
 * - limit, offset: pagination
 *
 * Legacy support:
 * - type, platform: for old content_queue table
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // New entity-based params
    const brandId = searchParams.get("brand_id");
    const entityId = searchParams.get("entity_id");
    const projectId = searchParams.get("project_id");
    const contentTypeId = searchParams.get("content_type_id");

    // Common params
    const status = searchParams.get("status") as ContentStatus | null;
    const scheduledFrom = searchParams.get("scheduled_from");
    const scheduledTo = searchParams.get("scheduled_to");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Legacy params for backwards compat
    const legacyType = searchParams.get("type");
    const legacyPlatform = searchParams.get("platform");

    // Determine which table to use based on params
    const useNewArchitecture = brandId || entityId || projectId || contentTypeId;

    if (useNewArchitecture) {
      // New entity-based content_items table
      let query = supabase
        .from("content_items")
        .select(`
          *,
          brand:brands!content_items_brand_id_fkey(id, name, entity_id, entity:entities(id, name)),
          content_type:lookup_content_types(id, name, icon),
          project:entity_projects(id, name)
        `, { count: "exact" })
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (brandId) {
        query = query.eq("brand_id", brandId);
      }

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (contentTypeId) {
        query = query.eq("content_type_id", contentTypeId);
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get stats by status
      const { data: allContent } = await supabase
        .from("content_items")
        .select("status, content_type_id")
        .eq("created_by", user.id);

      const stats = {
        total: allContent?.length || 0,
        draft: allContent?.filter(c => c.status === "draft").length || 0,
        pending_review: allContent?.filter(c => c.status === "pending_review").length || 0,
        approved: allContent?.filter(c => c.status === "approved").length || 0,
        scheduled: allContent?.filter(c => c.status === "scheduled").length || 0,
        published: allContent?.filter(c => c.status === "published").length || 0,
        changes_requested: allContent?.filter(c => c.status === "changes_requested").length || 0,
      };

      return NextResponse.json({
        success: true,
        content: content || [],
        total: count,
        stats,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      });
    } else {
      // Legacy content_queue table
      let query = supabase
        .from("content_queue")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (legacyType) {
        query = query.eq("content_type", legacyType);
      }
      if (legacyPlatform) {
        query = query.eq("platform", legacyPlatform);
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
        return NextResponse.json({ error: error.message }, { status: 500 });
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

      return NextResponse.json({
        success: true,
        content,
        total: count,
        stats,
        limit,
        offset,
      });
    }
  } catch (error: any) {
    console.error("GET /api/content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/content
 * Create new content (supports both new entity architecture and legacy)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Determine which architecture based on presence of brand_id
    if (body.brand_id) {
      // New entity-based content_items
      if (!body.body) {
        return NextResponse.json(
          { error: "Content body is required" },
          { status: 400 }
        );
      }

      // Verify user has access to this brand
      const { data: brand } = await supabase
        .from("brands")
        .select("id, entity_id, approval_required")
        .eq("id", body.brand_id)
        .eq("owner_id", user.id)
        .single();

      if (!brand) {
        return NextResponse.json(
          { error: "Brand not found or access denied" },
          { status: 404 }
        );
      }

      const { data: content, error } = await supabase
        .from("content_items")
        .insert({
          brand_id: body.brand_id,
          project_id: body.project_id || null,
          created_by: user.id,
          content_type_id: body.content_type_id || null,
          title: body.title || null,
          body: body.body,
          media_urls: body.media_urls || [],
          platform_versions: body.platform_versions || {},
          status: "draft",
          ai_generated: body.ai_generated || false,
          ai_model_used: body.ai_model_used || null,
          ai_prompt_used: body.ai_prompt_used || null,
          ai_confidence: body.ai_confidence || null,
          tags: body.tags || [],
          metadata: body.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating content:", error);
        return NextResponse.json(
          { error: "Failed to create content" },
          { status: 500 }
        );
      }

      return NextResponse.json({ content, success: true });
    } else {
      // Legacy content_queue
      if (!body.title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }
      if (!body.content_type) {
        return NextResponse.json({ error: "content_type is required" }, { status: 400 });
      }

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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If generate_now is true, generate content directly via AI engine
      if (body.generate_now && body.ai_prompt) {
        try {
          const { generateContent } = await import("@/lib/content/generator");

          const genResult = await generateContent({
            prompt: body.ai_prompt,
            contentType: body.content_type,
            platform: body.platform || undefined,
            brandId: body.brand_id || undefined,
            tone: body.tone || "professional",
            length: body.length || "medium",
            referenceContent: body.reference_content || undefined,
            variations: body.variations || 3,
            model: body.model || undefined,
          });

          // Update the content_queue record with the first variation
          if (genResult.variations.length > 0) {
            const firstVariation = genResult.variations[0];
            await supabase
              .from("content_queue")
              .update({
                draft_content: firstVariation.content,
                hook: firstVariation.hook || null,
                call_to_action: firstVariation.callToAction || null,
                hashtags: firstVariation.hashtags || [],
                ai_generated: true,
                status: "draft",
              })
              .eq("id", content.id);
          }

          return NextResponse.json({
            success: true,
            content,
            variations: genResult.variations,
            model: genResult.model,
            cost: genResult.cost,
            message: "Content created and generated",
          });
        } catch (genError: any) {
          console.error("AI generation failed:", genError);
          // Content was still created, just without AI generation
          return NextResponse.json({
            success: true,
            content,
            message: "Content created but AI generation failed. You can regenerate later.",
            generationError: genError.message,
          });
        }
      }

      return NextResponse.json({ success: true, content });
    }
  } catch (error: any) {
    console.error("POST /api/content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/content
 * Update content status (approval workflow for new architecture)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content_id, action, ...updateData } = body;

    if (!content_id) {
      return NextResponse.json(
        { error: "content_id is required" },
        { status: 400 }
      );
    }

    // Try new content_items first
    const { data: content } = await supabase
      .from("content_items")
      .select("*, brand:brands!content_items_brand_id_fkey(owner_id)")
      .eq("id", content_id)
      .single();

    if (content) {
      // New entity-based approval workflow
      const isOwner = content.created_by === user.id || content.brand?.owner_id === user.id;
      if (!isOwner) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      let updates: Record<string, any> = { updated_at: new Date().toISOString() };

      switch (action) {
        case "submit_for_review":
          if (content.status !== "draft" && content.status !== "changes_requested") {
            return NextResponse.json(
              { error: "Can only submit drafts or content with requested changes" },
              { status: 400 }
            );
          }
          updates.status = "pending_review";
          updates.submitted_at = new Date().toISOString();
          updates.submitted_by = user.id;
          break;

        case "approve":
          if (content.status !== "pending_review") {
            return NextResponse.json(
              { error: "Can only approve content pending review" },
              { status: 400 }
            );
          }
          updates.status = "approved";
          updates.reviewed_at = new Date().toISOString();
          updates.reviewed_by = user.id;
          updates.review_notes = updateData.review_notes || null;
          break;

        case "request_changes":
          if (content.status !== "pending_review") {
            return NextResponse.json(
              { error: "Can only request changes on content pending review" },
              { status: 400 }
            );
          }
          if (!updateData.review_notes) {
            return NextResponse.json(
              { error: "review_notes required when requesting changes" },
              { status: 400 }
            );
          }
          updates.status = "changes_requested";
          updates.reviewed_at = new Date().toISOString();
          updates.reviewed_by = user.id;
          updates.review_notes = updateData.review_notes;
          break;

        case "schedule":
          if (content.status !== "approved") {
            return NextResponse.json(
              { error: "Can only schedule approved content" },
              { status: 400 }
            );
          }
          if (!updateData.scheduled_for) {
            return NextResponse.json(
              { error: "scheduled_for is required" },
              { status: 400 }
            );
          }
          updates.status = "scheduled";
          updates.scheduled_for = updateData.scheduled_for;
          break;

        case "publish":
          if (content.status !== "approved" && content.status !== "scheduled") {
            return NextResponse.json(
              { error: "Can only publish approved or scheduled content" },
              { status: 400 }
            );
          }
          updates.status = "published";
          updates.published_at = new Date().toISOString();
          break;

        case "archive":
          updates.status = "archived";
          break;

        case "update_body":
          if (content.status !== "draft" && content.status !== "changes_requested") {
            return NextResponse.json(
              { error: "Can only edit drafts or content with requested changes" },
              { status: 400 }
            );
          }
          if (updateData.body) updates.body = updateData.body;
          if (updateData.title !== undefined) updates.title = updateData.title;
          if (updateData.media_urls) updates.media_urls = updateData.media_urls;
          if (updateData.platform_versions) updates.platform_versions = updateData.platform_versions;
          if (updateData.tags) updates.tags = updateData.tags;
          break;

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const { data: updated, error } = await supabase
        .from("content_items")
        .update(updates)
        .eq("id", content_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating content:", error);
        return NextResponse.json(
          { error: "Failed to update content" },
          { status: 500 }
        );
      }

      return NextResponse.json({ content: updated, success: true });
    } else {
      // Try legacy content_queue
      const { data: legacyContent } = await supabase
        .from("content_queue")
        .select("*")
        .eq("id", content_id)
        .eq("user_id", user.id)
        .single();

      if (!legacyContent) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      // Simple status update for legacy
      const { data: updated, error } = await supabase
        .from("content_queue")
        .update({
          status: updateData.status || legacyContent.status,
          scheduled_for: updateData.scheduled_for || legacyContent.scheduled_for,
          draft_content: updateData.draft_content || legacyContent.draft_content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", content_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ content: updated, success: true });
    }
  } catch (error: any) {
    console.error("PATCH /api/content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/content
 * Delete content (only drafts/archived for new architecture)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("id");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Try new content_items first (only drafts/archived)
    const { error: newError } = await supabase
      .from("content_items")
      .delete()
      .eq("id", contentId)
      .eq("created_by", user.id)
      .in("status", ["draft", "archived"]);

    if (!newError) {
      return NextResponse.json({ success: true });
    }

    // Try legacy content_queue
    const { error: legacyError } = await supabase
      .from("content_queue")
      .delete()
      .eq("id", contentId)
      .eq("user_id", user.id);

    if (legacyError) {
      console.error("Error deleting content:", legacyError);
      return NextResponse.json(
        { error: "Failed to delete content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
