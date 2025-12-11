import { createClient } from "@/lib/supabase/server";
import { processConversationForIntelligence } from "@/lib/intelligence";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Process a conversation to extract insights, preferences, and build knowledge
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const organizationId = profile.organization_id as string;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Process conversation for intelligence
    await processConversationForIntelligence(
      conversationId,
      organizationId,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Conversation processed for intelligence",
    });
  } catch (error: any) {
    console.error("Error processing conversation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

