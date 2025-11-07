import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/inbox/emails/[id]/star
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { starred } = await request.json();
    const emailId = params.id;

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
      .update({ is_starred: starred })
      .eq("id", emailId);

    if (updateError) {
      console.error("Error updating email:", updateError);
      return NextResponse.json(
        { error: "Failed to update email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Star email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
