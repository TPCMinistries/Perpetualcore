import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify the webhook belongs to the user
    const { data: webhook, error: fetchError } = await supabase
      .from("webhooks")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    if (webhook.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this webhook" },
        { status: 403 }
      );
    }

    // Delete the webhook
    const { error: deleteError } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting webhook:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
