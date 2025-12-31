import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, action } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Group items by source type
    const grouped: Record<string, string[]> = {};
    for (const id of ids) {
      const [sourceType, sourceId] = id.split("-");
      if (!grouped[sourceType]) {
        grouped[sourceType] = [];
      }
      grouped[sourceType].push(sourceId);
    }

    // Process each group
    const promises: Promise<any>[] = [];

    for (const [sourceType, sourceIds] of Object.entries(grouped)) {
      switch (action) {
        case "resolve":
          if (sourceType === "task") {
            promises.push(
              supabase
                .from("tasks")
                .update({ status: "completed" })
                .in("id", sourceIds)
                .eq("user_id", user.id)
            );
          } else if (sourceType === "email" || sourceType === "notification" || sourceType === "mention") {
            const table = sourceType === "email" ? "emails" : sourceType === "notification" ? "notifications" : "mentions";
            promises.push(
              supabase
                .from(table)
                .update({ is_read: true })
                .in("id", sourceIds)
                .eq("user_id", user.id)
            );
          }
          break;

        case "archive":
          if (sourceType === "email") {
            promises.push(
              supabase
                .from("emails")
                .update({ is_archived: true })
                .in("id", sourceIds)
                .eq("user_id", user.id)
            );
          }
          break;

        case "star":
          if (sourceType === "email") {
            promises.push(
              supabase
                .from("emails")
                .update({ is_starred: true })
                .in("id", sourceIds)
                .eq("user_id", user.id)
            );
          }
          break;

        case "snooze":
          // Snooze by 24 hours
          const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          promises.push(
            supabase
              .from("attention_items")
              .upsert(
                sourceIds.map((sourceId) => ({
                  user_id: user.id,
                  source_type: sourceType,
                  source_id: sourceId,
                  is_resolved: false,
                  metadata: { snoozed_until: snoozeUntil },
                })),
                { onConflict: "user_id,source_type,source_id" }
              )
          );
          break;

        case "delete":
          if (sourceType === "notification") {
            promises.push(
              supabase
                .from("notifications")
                .delete()
                .in("id", sourceIds)
                .eq("user_id", user.id)
            );
          }
          break;
      }
    }

    await Promise.all(promises);

    return NextResponse.json({ success: true, processed: ids.length });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
