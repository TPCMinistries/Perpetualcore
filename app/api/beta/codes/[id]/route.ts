import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * DELETE /api/beta/codes/[id]
 * Delete a beta invite code
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Require admin authorization
    await requireAdmin();

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
    const status = error.message === "Unauthorized" ? 401 : error.message.includes("Forbidden") ? 403 : 500;
    const message = status === 500 ? "Failed to delete code" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
