import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inbox/emails/[id]/attachments - Get attachments for an email
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachments for this email
    const { data: attachments, error } = await supabase
      .from("email_attachments")
      .select("*")
      .eq("email_id", id)
      .eq("user_id", user.id)
      .order("filename");

    if (error) {
      console.error("Error fetching attachments:", error);
      return NextResponse.json(
        { error: "Failed to fetch attachments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachments: attachments || [] });
  } catch (error) {
    console.error("Get attachments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
