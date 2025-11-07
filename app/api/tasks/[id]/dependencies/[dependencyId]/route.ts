import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/tasks/[id]/dependencies/[dependencyId]
// Remove a dependency from a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; dependencyId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dependencyId = params.dependencyId;

    // Delete dependency
    const { error: deleteError } = await supabase
      .from("task_dependencies")
      .delete()
      .eq("id", dependencyId);

    if (deleteError) {
      console.error("Error deleting dependency:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete dependency" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete dependency API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
