import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { project_id } = await req.json();
    const { id: documentId } = await params;

    if (!project_id) {
      return new Response("Project ID is required", { status: 400 });
    }

    // Verify document belongs to user or their organization
    const { data: document } = await supabase
      .from("documents")
      .select("user_id, organization_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return new Response("Document not found", { status: 404 });
    }

    // Add document to project via junction table
    const { data, error } = await supabase
      .from("document_projects")
      .insert({
        document_id: documentId,
        project_id,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return Response.json(
          { error: "Document is already in this project" },
          { status: 400 }
        );
      }
      console.error("Error adding document to project:", error);
      throw new Error("Failed to add document to project");
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Add to project error:", error);
    return new Response(
      error.message || "Internal server error",
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { project_id } = await req.json();
    const { id: documentId } = await params;

    if (!project_id) {
      return new Response("Project ID is required", { status: 400 });
    }

    // Remove document from project
    const { error } = await supabase
      .from("document_projects")
      .delete()
      .eq("document_id", documentId)
      .eq("project_id", project_id);

    if (error) {
      console.error("Error removing document from project:", error);
      throw new Error("Failed to remove document from project");
    }

    return Response.json({
      success: true,
      message: "Document removed from project",
    });
  } catch (error: any) {
    console.error("Remove from project error:", error);
    return new Response(
      error.message || "Internal server error",
      { status: 500 }
    );
  }
}
