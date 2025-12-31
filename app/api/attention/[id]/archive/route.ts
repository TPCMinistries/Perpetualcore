import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Parse the attention item ID to get source type and source ID
    const [sourceType, sourceId] = id.split("-");

    // Archive based on source type
    switch (sourceType) {
      case "email":
        await supabase
          .from("emails")
          .update({ is_archived: true })
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      case "notification":
        await supabase
          .from("notifications")
          .update({ is_read: true }) // Notifications don't have archive, mark as read
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      default:
        // Update in attention_items cache
        await supabase
          .from("attention_items")
          .update({ is_archived: true })
          .eq("id", id)
          .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive attention item error:", error);
    return NextResponse.json(
      { error: "Failed to archive item" },
      { status: 500 }
    );
  }
}
