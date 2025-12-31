import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ideas
 * Fetch all ideas for the authenticated user
 *
 * Query params:
 * - status: filter by status (captured, developing, ready, implemented, archived)
 * - category: filter by category
 * - priority: filter by priority
 * - search: full-text search
 * - linked_to: filter by linked entity (project:id, decision:id, opportunity:id)
 * - sort: field to sort by (default: created_at)
 * - order: asc or desc (default: desc)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const linkedTo = searchParams.get("linked_to");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("ideas")
      .select(`
        *,
        linked_project:projects(id, name, status),
        linked_decision:decisions(id, title, status),
        linked_opportunity:opportunities(id, name, status)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (search) {
      query = query.textSearch("search_vector", search, {
        type: "websearch",
        config: "english",
      });
    }

    if (linkedTo) {
      const [type, id] = linkedTo.split(":");
      if (type === "project") {
        query = query.eq("linked_project_id", id);
      } else if (type === "decision") {
        query = query.eq("linked_decision_id", id);
      } else if (type === "opportunity") {
        query = query.eq("linked_opportunity_id", id);
      }
    }

    const { data: ideas, error, count } = await query;

    if (error) {
      console.error("Error fetching ideas:", error);
      return Response.json({ error: "Failed to fetch ideas" }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase
      .from("ideas")
      .select("status, category, priority")
      .eq("user_id", user.id);

    const statusCounts = (stats || []).reduce((acc: Record<string, number>, idea) => {
      acc[idea.status] = (acc[idea.status] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = (stats || []).reduce((acc: Record<string, number>, idea) => {
      if (idea.category) {
        acc[idea.category] = (acc[idea.category] || 0) + 1;
      }
      return acc;
    }, {});

    return Response.json({
      ideas: ideas || [],
      total: count || 0,
      limit,
      offset,
      stats: {
        byStatus: statusCounts,
        byCategory: categoryCounts,
      },
    });
  } catch (error) {
    console.error("Ideas GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ideas
 * Create a new idea (quick capture)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      raw_input,
      category,
      tags,
      priority,
      source_type = "manual",
      source_reference,
      linked_project_id,
      linked_decision_id,
      linked_opportunity_id,
    } = body;

    // Quick capture: if only raw_input provided, use it as title
    const finalTitle = title || raw_input?.substring(0, 100) || "Untitled Idea";

    if (!finalTitle.trim()) {
      return Response.json({ error: "Title or raw_input is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: idea, error } = await supabase
      .from("ideas")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        title: finalTitle,
        description,
        raw_input: raw_input || title,
        category,
        tags,
        priority,
        source_type,
        source_reference,
        linked_project_id,
        linked_decision_id,
        linked_opportunity_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating idea:", error);
      return Response.json({ error: "Failed to create idea" }, { status: 500 });
    }

    return Response.json({ idea }, { status: 201 });
  } catch (error) {
    console.error("Ideas POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
