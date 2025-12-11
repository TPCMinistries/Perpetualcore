import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processFeedback } from "@/lib/intelligence/feedback-learner";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, helpful, reason } = body;

    if (!messageId || typeof helpful !== "boolean") {
      return NextResponse.json(
        { error: "messageId and helpful (boolean) are required" },
        { status: 400 }
      );
    }

    // Verify message belongs to user
    const { data: message } = await supabase
      .from("messages")
      .select("id, conversation_id, role")
      .eq("id", messageId)
      .single();

    if (!message || message.role !== "assistant") {
      return NextResponse.json(
        { error: "Message not found or not an AI response" },
        { status: 404 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from("conversations")
      .select("user_id, organization_id")
      .eq("id", message.conversation_id)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update message with feedback
    await supabase
      .from("messages")
      .update({
        metadata: {
          feedback: {
            helpful,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      })
      .eq("id", messageId);

    // Process feedback for learning
    await processFeedback(
      conversation.organization_id,
      user.id,
      helpful ? "response_helpful" : "response_not_helpful",
      { messageId, reason }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
