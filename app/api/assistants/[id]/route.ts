import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assistantId } = await params;

    const { data: assistant, error } = await supabase
      .from("ai_assistants")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (error || !assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    return NextResponse.json({ assistant });
  } catch (error) {
    if (isDev) console.error("Get assistant API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assistantId } = await params;

    const { data: assistant } = await supabase
      .from("ai_assistants")
      .select("user_id")
      .eq("id", assistantId)
      .single();

    if (!assistant || assistant.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("ai_assistants")
      .delete()
      .eq("id", assistantId);

    if (deleteError) {
      if (isDev) console.error("Error deleting assistant:", deleteError);
      return NextResponse.json({ error: "Failed to delete assistant" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDev) console.error("Delete assistant API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
