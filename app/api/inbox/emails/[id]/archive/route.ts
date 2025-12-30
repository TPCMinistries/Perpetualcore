import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/inbox/emails/[id]/archive
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

    const { id: emailId } = await params;

    // Verify ownership
    const { data: email } = await supabase
      .from("emails")
      .select("user_id")
      .eq("id", emailId)
      .single();

    if (!email || email.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("emails")
      .update({ is_archived: true })
      .eq("id", emailId);

    if (updateError) {
      console.error("Error archiving email:", updateError);
      return NextResponse.json(
        { error: "Failed to archive email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
