import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - Browse marketplace bots
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("bot_marketplace")
      .select(
        `
        id,
        name,
        description,
        short_description,
        category,
        tags,
        icon,
        price,
        is_free,
        install_count,
        rating,
        rating_count,
        author_name,
        author_verified,
        preview_image_url,
        version,
        created_at
      `,
        { count: "exact" }
      )
      .eq("is_approved", true)
      .eq("is_active", true)
      .order("install_count", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: bots, error, count } = await query;

    if (error) {
      if (isDev) console.error("Marketplace fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch marketplace" }, { status: 500 });
    }

    // Get categories with counts
    const { data: categories } = await supabase
      .from("bot_marketplace")
      .select("category")
      .eq("is_approved", true)
      .eq("is_active", true);

    const categoryCounts = new Map<string, number>();
    (categories || []).forEach((c: any) => {
      categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
    });

    return NextResponse.json({
      bots: bots || [],
      total: count || 0,
      categories: Array.from(categoryCounts.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      pagination: {
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    if (isDev) console.error("Marketplace error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Install a bot from marketplace
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const body = await req.json();
    const { marketplace_id } = body;

    if (!marketplace_id) {
      return NextResponse.json({ error: "marketplace_id is required" }, { status: 400 });
    }

    // Check if already installed
    const { data: existing } = await supabase
      .from("bot_installations")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("marketplace_id", marketplace_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Bot already installed" }, { status: 400 });
    }

    // Install bot using database function
    const { data: installationId, error } = await supabase.rpc(
      "install_marketplace_bot",
      {
        p_marketplace_id: marketplace_id,
        p_org_id: profile.organization_id,
        p_user_id: user.id,
      }
    );

    if (error) {
      if (isDev) console.error("Install error:", error);
      return NextResponse.json({ error: error.message || "Installation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      installation_id: installationId,
      message: "Bot installed successfully",
    });
  } catch (error: any) {
    if (isDev) console.error("Marketplace install error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Uninstall a bot
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const installationId = searchParams.get("installation_id");

    if (!installationId) {
      return NextResponse.json({ error: "installation_id is required" }, { status: 400 });
    }

    // Get installation and delete associated agent
    const { data: installation } = await supabase
      .from("bot_installations")
      .select("installed_agent_id")
      .eq("id", installationId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (installation?.installed_agent_id) {
      await supabase
        .from("ai_agents")
        .delete()
        .eq("id", installation.installed_agent_id);
    }

    // Delete installation
    const { error } = await supabase
      .from("bot_installations")
      .delete()
      .eq("id", installationId)
      .eq("organization_id", profile.organization_id);

    if (error) {
      if (isDev) console.error("Uninstall error:", error);
      return NextResponse.json({ error: "Failed to uninstall" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Bot uninstalled successfully",
    });
  } catch (error: any) {
    if (isDev) console.error("Marketplace uninstall error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
