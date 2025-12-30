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

    const { data: conversations, error } = await supabase
      .from("assistant_conversations")
      .select("*")
      .eq("assistant_id", assistantId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("last_message_at", { ascending: false });

    if (error) {
      if (isDev) console.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    if (isDev) console.error("Conversations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { id: assistantId } = await params;
    const { title } = await request.json();

    const { data: conversation, error: createError } = await supabase
      .from("assistant_conversations")
      .insert({
        assistant_id: assistantId,
        organization_id: profile.organization_id,
        user_id: user.id,
        title: title || "New conversation",
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      if (isDev) console.error("Error creating conversation:", createError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (isDev) console.error("Create conversation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
