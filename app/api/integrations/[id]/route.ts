import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/integrations/[id]
// Disconnect an integration
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

    const integrationId = params.id;

    // Verify integration exists and user owns it
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("user_id", user.id)
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete integration
    const { error: deleteError } = await supabase
      .from("integrations")
      .delete()
      .eq("id", integrationId);

    if (deleteError) {
      console.error("Error deleting integration:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete integration" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete integration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
