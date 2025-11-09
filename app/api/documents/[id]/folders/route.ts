import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { folder_id } = await req.json();
    const documentId = params.id;

    if (!folder_id) {
      return new Response("Folder ID is required", { status: 400 });
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

    // Add document to folder via junction table
    const { data, error } = await supabase
      .from("document_folders")
      .insert({
        document_id: documentId,
        folder_id,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return Response.json(
          { error: "Document is already in this folder" },
          { status: 400 }
        );
      }
      console.error("Error adding document to folder:", error);
      throw new Error("Failed to add document to folder");
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Add to folder error:", error);
    return new Response(
      error.message || "Internal server error",
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { folder_id } = await req.json();
    const documentId = params.id;

    if (!folder_id) {
      return new Response("Folder ID is required", { status: 400 });
    }

    // Remove document from folder
    const { error } = await supabase
      .from("document_folders")
      .delete()
      .eq("document_id", documentId)
      .eq("folder_id", folder_id);

    if (error) {
      console.error("Error removing document from folder:", error);
      throw new Error("Failed to remove document from folder");
    }

    return Response.json({
      success: true,
      message: "Document removed from folder",
    });
  } catch (error: any) {
    console.error("Remove from folder error:", error);
    return new Response(
      error.message || "Internal server error",
      { status: 500 }
    );
  }
}
