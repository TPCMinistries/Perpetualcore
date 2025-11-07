import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = params.id;
    const { rating } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const { data: updatedMessage, error: updateError } = await supabase
      .from("assistant_messages")
      .update({ rating })
      .eq("id", messageId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message rating:", updateError);
      return NextResponse.json({ error: "Failed to update rating" }, { status: 500 });
    }

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error("Rate message API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
