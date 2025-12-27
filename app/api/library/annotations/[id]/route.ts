import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.content !== undefined) updates.content = body.content;
    if (body.isResolved !== undefined) {
      updates.is_resolved = body.isResolved;
      if (body.isResolved) {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.id;
      } else {
        updates.resolved_at = null;
        updates.resolved_by = null;
      }
    }

    const { data: annotation, error } = await supabase
      .from("document_annotations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity if resolved
    if (body.isResolved !== undefined) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        await supabase.from("document_activity").insert({
          organization_id: profile.organization_id,
          document_id: annotation.document_id,
          user_id: user.id,
          activity_type: body.isResolved ? "resolve" : "update",
          metadata: { annotationId: id },
        });
      }
    }

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error("Annotation update error:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to delete their own annotations
    const { error } = await supabase
      .from("document_annotations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Annotation delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
