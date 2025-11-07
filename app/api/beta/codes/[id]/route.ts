import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/beta/codes/[id]
 * Delete a beta invite code
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here

    // Delete the code
    const { error } = await supabase
      .from("beta_invite_codes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting code:", error);
      return NextResponse.json(
        { error: "Failed to delete code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting code:", error);
    return NextResponse.json(
      { error: "Failed to delete code" },
      { status: 500 }
    );
  }
}
