import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateContextRequest, ContextType, ContextImportance } from "@/types/executive-center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/organization/context - List organization context notes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const context_type = searchParams.get("context_type") as ContextType | null;
    const importance = searchParams.get("importance") as ContextImportance | null;
    const is_active = searchParams.get("is_active") !== "false";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("organization_context")
      .select(
        `
        *,
        creator:profiles!organization_context_created_by_fkey(full_name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("organization_id", profile.organization_id)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false });

    if (context_type) {
      query = query.eq("context_type", context_type);
    }
    if (importance) {
      query = query.eq("importance", importance);
    }
    if (is_active) {
      query = query.eq("is_active", true);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: contexts, error, count } = await query;

    if (error) {
      console.error("Error fetching organization context:", error);
      return NextResponse.json(
        { error: "Failed to fetch context" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contexts: contexts || [],
      count: count || 0,
      pagination: { limit, offset, total: count || 0 },
    });
  } catch (error) {
    console.error("Organization context API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/organization/context - Create new context note
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, user_role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check executive access
    const hasExecutiveAccess = ["admin", "manager", "super_admin", "owner", "business_owner"].includes(
      profile.user_role || ""
    );
    if (!hasExecutiveAccess) {
      return NextResponse.json({ error: "Executive access required" }, { status: 403 });
    }

    const body: CreateContextRequest = await request.json();

    if (!body.title || body.title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.content || body.content.trim() === "") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    if (!body.context_type) {
      return NextResponse.json({ error: "context_type is required" }, { status: 400 });
    }

    const validTypes: ContextType[] = [
      "vision",
      "mission",
      "values",
      "strategy",
      "decision_principle",
      "operational_preference",
      "key_relationship",
      "important_date",
      "lesson_learned",
      "competitive_insight",
      "market_intelligence",
    ];
    if (!validTypes.includes(body.context_type)) {
      return NextResponse.json({ error: "Invalid context_type" }, { status: 400 });
    }

    const { data: context, error } = await supabase
      .from("organization_context")
      .insert({
        organization_id: profile.organization_id,
        context_type: body.context_type,
        title: body.title.trim(),
        content: body.content.trim(),
        key_points: body.key_points || [],
        importance: body.importance || "normal",
        effective_from: body.effective_from || null,
        effective_until: body.effective_until || null,
        is_active: true,
        tags: body.tags || [],
        source: body.source || null,
        related_context_ids: [],
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating context:", error);
      return NextResponse.json(
        { error: "Failed to create context" },
        { status: 500 }
      );
    }

    return NextResponse.json({ context }, { status: 201 });
  } catch (error) {
    console.error("Create context error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
