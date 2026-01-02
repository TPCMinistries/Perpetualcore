import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/reminders
 * Fetch reminders for the authenticated user
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
    const priority = searchParams.get("priority");
    const upcoming = searchParams.get("upcoming"); // Get reminders due in next X hours
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("reminders")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("remind_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    } else {
      // By default, exclude completed and cancelled
      query = query.in("status", ["pending", "snoozed"]);
    }

    if (priority && priority !== "all") {
      query = query.eq("priority", priority);
    }

    if (upcoming) {
      const hours = parseInt(upcoming);
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + hours);
      query = query
        .gte("remind_at", new Date().toISOString())
        .lte("remind_at", futureTime.toISOString());
    }

    const { data: reminders, error, count } = await query;

    if (error) {
      console.error("Error fetching reminders:", error);
      return Response.json({ error: "Failed to fetch reminders" }, { status: 500 });
    }

    // Get stats
    const { data: allReminders } = await supabase
      .from("reminders")
      .select("status, priority, remind_at")
      .eq("user_id", user.id);

    const now = new Date();
    const stats = {
      pending: 0,
      snoozed: 0,
      completed: 0,
      overdue: 0,
      todayCount: 0,
    };

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    (allReminders || []).forEach((reminder) => {
      const remindAt = new Date(reminder.remind_at);

      // Status counts
      if (reminder.status === "pending") stats.pending++;
      if (reminder.status === "snoozed") stats.snoozed++;
      if (reminder.status === "completed") stats.completed++;

      // Overdue (pending and past due)
      if (reminder.status === "pending" && remindAt < now) {
        stats.overdue++;
      }

      // Today's reminders
      if (remindAt >= todayStart && remindAt < todayEnd && reminder.status !== "completed") {
        stats.todayCount++;
      }
    });

    return Response.json({
      reminders: reminders || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error("Reminders GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/reminders
 * Create a new reminder
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
      remind_at,
      reminder_type = "once",
      priority = "medium",
      notification_channels = ["telegram"],
      source = "manual",
      source_message_id,
      linked_task_id,
      linked_event_id,
    } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    if (!remind_at) {
      return Response.json({ error: "Reminder time is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        title,
        description,
        remind_at,
        reminder_type,
        priority,
        notification_channels,
        source,
        source_message_id,
        linked_task_id,
        linked_event_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      return Response.json({ error: "Failed to create reminder" }, { status: 500 });
    }

    return Response.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error("Reminders POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/reminders
 * Update a reminder (status, snooze, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return Response.json({ error: "Reminder ID is required" }, { status: 400 });
    }

    // Handle special actions
    if (action === "snooze") {
      const snoozeMinutes = updates.snooze_minutes || 30;
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeMinutes);

      const { data: reminder, error } = await supabase
        .from("reminders")
        .update({
          status: "snoozed",
          snoozed_until: snoozeUntil.toISOString(),
          remind_at: snoozeUntil.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error snoozing reminder:", error);
        return Response.json({ error: "Failed to snooze reminder" }, { status: 500 });
      }

      return Response.json({ reminder });
    }

    if (action === "complete") {
      const { data: reminder, error } = await supabase
        .from("reminders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error completing reminder:", error);
        return Response.json({ error: "Failed to complete reminder" }, { status: 500 });
      }

      return Response.json({ reminder });
    }

    // Regular update
    const { data: reminder, error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating reminder:", error);
      return Response.json({ error: "Failed to update reminder" }, { status: 500 });
    }

    return Response.json({ reminder });
  } catch (error) {
    console.error("Reminders PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/reminders
 * Delete a reminder
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Reminder ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting reminder:", error);
      return Response.json({ error: "Failed to delete reminder" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reminders DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
