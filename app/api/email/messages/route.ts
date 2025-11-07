import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch user's emails
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category"); // 'urgent', 'important', etc.
    const isRead = searchParams.get("isRead");
    const requiresResponse = searchParams.get("requiresResponse");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("ai_category", category);
    }

    if (isRead !== null) {
      query = query.eq("is_read", isRead === "true");
    }

    if (requiresResponse === "true") {
      query = query.eq("requires_response", true);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error("Emails fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch emails" },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails: emails || [], count: emails?.length || 0 });
  } catch (error) {
    console.error("Emails GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update email (mark as read, star, etc.)
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Email ID required" },
        { status: 400 }
      );
    }

    const { data: email, error } = await supabase
      .from("emails")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Email update error:", error);
      return NextResponse.json(
        { error: "Failed to update email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Emails PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete email
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Email ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Email delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Emails DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
