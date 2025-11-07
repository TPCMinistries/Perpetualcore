import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inbox/emails
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: emails, error: emailsError } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (emailsError) {
      console.error("Error fetching emails:", emailsError);
      return NextResponse.json(
        { error: "Failed to fetch emails" },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails: emails || [] });
  } catch (error) {
    console.error("Emails API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
