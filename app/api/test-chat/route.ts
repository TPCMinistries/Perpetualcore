import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Simple test endpoint to diagnose chat issues
 *
 * DEVELOPMENT ONLY - Returns 404 in production
 */
export async function POST(req: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const supabase = await createClient();

    // Test 1: Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return Response.json({ error: "Auth failed", details: authError.message }, { status: 401 });
    }
    if (!user) {
      return Response.json({ error: "No user" }, { status: 401 });
    }

    // Test 2: Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return Response.json({ error: "Profile query failed", details: profileError.message }, { status: 500 });
    }

    // Test 3: Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e: any) {
      return Response.json({ error: "JSON parse failed", details: e.message }, { status: 400 });
    }

    // Test 4: Check messages format
    const { messages } = body;
    if (!Array.isArray(messages)) {
      return Response.json({ error: "Messages not array", messagesType: typeof messages }, { status: 400 });
    }

    // Test 5: Try to create a test conversation
    const { data: testConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        title: "Test conversation",
        model: "gpt-4o-mini",
      })
      .select()
      .single();

    if (convError) {
      return Response.json({ error: "Conversation insert failed", details: convError.message }, { status: 500 });
    }

    // Test 6: Try to insert a test message
    const { data: testMsg, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: testConv.id,
        role: "user",
        content: "Test message",
      })
      .select()
      .single();

    if (msgError) {
      return Response.json({ error: "Message insert failed", details: msgError.message }, { status: 500 });
    }

    // Test 7: Clean up
    await supabase.from("messages").delete().eq("id", testMsg.id);
    await supabase.from("conversations").delete().eq("id", testConv.id);

    return Response.json({
      success: true,
      tests: {
        auth: "passed",
        profile: "passed",
        jsonParse: "passed",
        messagesArray: "passed",
        conversationInsert: "passed",
        messageInsert: "passed",
      },
    });
  } catch (error: any) {
    return Response.json({
      error: "Unexpected error",
      details: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
