import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/presence?entityType=document&entityId=xxx
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Get active users (within last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: presence, error: presenceError } = await supabase
      .from("realtime_presence")
      .select(`
        user_id,
        status,
        last_active_at,
        user:profiles!user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .gte("last_active_at", twoMinutesAgo)
      .neq("status", "idle");

    if (presenceError) {
      console.error("Error fetching presence:", presenceError);
      return NextResponse.json(
        { error: "Failed to fetch presence" },
        { status: 500 }
      );
    }

    // Transform data
    const activeUsers = (presence || []).map((p: any) => ({
      id: p.user_id,
      full_name: p.user?.full_name || "Unknown User",
      avatar_url: p.user?.avatar_url,
      status: p.status,
      last_active_at: p.last_active_at,
    }));

    return NextResponse.json({ presence: activeUsers });
  } catch (error) {
    console.error("Presence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/presence - Track user presence
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { entityType, entityId, status = "viewing" } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Upsert presence (insert or update if exists)
    const { data: presenceData, error: presenceError } = await supabase
      .from("realtime_presence")
      .upsert(
        {
          organization_id: profile.organization_id,
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          status,
          last_active_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,entity_type,entity_id",
        }
      )
      .select()
      .single();

    if (presenceError) {
      console.error("Error tracking presence:", presenceError);
      return NextResponse.json(
        { error: "Failed to track presence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ presence: presenceData }, { status: 201 });
  } catch (error) {
    console.error("Track presence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/presence - Update last_active_at timestamp
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Update last_active_at
    const { error: updateError } = await supabase
      .from("realtime_presence")
      .update({ last_active_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (updateError) {
      console.error("Error updating presence:", updateError);
      return NextResponse.json(
        { error: "Failed to update presence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update presence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/presence - Remove user presence
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    // Delete presence
    const { error: deleteError } = await supabase
      .from("realtime_presence")
      .delete()
      .eq("user_id", user.id)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (deleteError) {
      console.error("Error removing presence:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove presence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove presence API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
