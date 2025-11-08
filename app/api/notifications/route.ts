import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("notifications")
      .select(`
        *,
        triggered_by_profile:triggered_by (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return Response.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error: any) {
    console.error("Error in GET /api/notifications:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { notificationIds, is_read } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return Response.json({ error: "notificationIds array required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: is_read ?? true })
      .in("id", notificationIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating notifications:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in PATCH /api/notifications:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
