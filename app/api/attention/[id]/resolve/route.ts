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

    // Update based on source type
    switch (sourceType) {
      case "task":
        await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      case "email":
        await supabase
          .from("emails")
          .update({ is_read: true })
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      case "notification":
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      case "mention":
        await supabase
          .from("mentions")
          .update({ is_read: true })
          .eq("id", sourceId)
          .eq("user_id", user.id);
        break;

      default:
        // Update in attention_items cache if exists
        await supabase
          .from("attention_items")
          .update({ is_resolved: true })
          .eq("id", id)
          .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resolve attention item error:", error);
    return NextResponse.json(
      { error: "Failed to resolve item" },
      { status: 500 }
    );
  }
}
