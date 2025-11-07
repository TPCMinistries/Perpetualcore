import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  snoozeNotification,
} from "@/lib/notifications/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch notifications
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const countOnly = searchParams.get("count") === "true";
    const status = searchParams.get("status") || "unread";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (countOnly) {
      const count = await getUnreadCount(user.id);
      return NextResponse.json({ count });
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST - Mark notification as read
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId, duration } = body;

    if (action === "mark_read" && notificationId) {
      const result = await markAsRead(notificationId, user.id);
      return NextResponse.json(result);
    }

    if (action === "mark_all_read") {
      const result = await markAllAsRead(user.id);
      return NextResponse.json(result);
    }

    if (action === "snooze" && notificationId && duration) {
      const result = await snoozeNotification(notificationId, user.id, duration);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { error: "Failed to process notification action" },
      { status: 500 }
    );
  }
}
