import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/mentions/[id]/read - Mark a mention as read
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: mentionId } = await params;

    // Verify ownership
    const { data: mention } = await supabase
      .from("mentions")
      .select("mentioned_user_id")
      .eq("id", mentionId)
      .single();

    if (!mention) {
      return NextResponse.json(
        { error: "Mention not found" },
        { status: 404 }
      );
    }

    if (mention.mentioned_user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Mark as read
    const { data: updatedMention, error: updateError } = await supabase
      .from("mentions")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", mentionId)
      .select(`
        *,
        mentioning_user:profiles!mentioning_user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error("Error marking mention as read:", updateError);
      return NextResponse.json(
        { error: "Failed to mark mention as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mention: updatedMention });
  } catch (error) {
    console.error("Mark mention as read API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
