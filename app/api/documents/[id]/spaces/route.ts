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

    const { space_id } = await req.json();
    const documentId = params.id;

    if (!space_id) {
      return new Response("Space ID is required", { status: 400 });
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

    // Add document to knowledge space via junction table
    const { data, error } = await supabase
      .from("document_knowledge_spaces")
      .insert({
        document_id: documentId,
        knowledge_space_id: space_id,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return Response.json(
          { error: "Document is already in this knowledge space" },
          { status: 400 }
        );
      }
      console.error("Error adding document to knowledge space:", error);
      throw new Error("Failed to add document to knowledge space");
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Add to space error:", error);
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

    const { space_id } = await req.json();
    const documentId = params.id;

    if (!space_id) {
      return new Response("Space ID is required", { status: 400 });
    }

    // Remove document from knowledge space
    const { error } = await supabase
      .from("document_knowledge_spaces")
      .delete()
      .eq("document_id", documentId)
      .eq("knowledge_space_id", space_id);

    if (error) {
      console.error("Error removing document from knowledge space:", error);
      throw new Error("Failed to remove document from knowledge space");
    }

    return Response.json({
      success: true,
      message: "Document removed from knowledge space",
    });
  } catch (error: any) {
    console.error("Remove from space error:", error);
    return new Response(
      error.message || "Internal server error",
      { status: 500 }
    );
  }
}
