import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch documents linked to this entity project
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("entity_projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch documents linked to this entity project via document_projects junction
    const { data: documentLinks, error } = await supabase
      .from("document_projects")
      .select(`
        id,
        added_at,
        documents (
          id,
          title,
          file_type,
          file_url,
          file_size,
          status,
          summary,
          key_points,
          created_at
        )
      `)
      .eq("entity_project_id", projectId);

    if (error) {
      console.error("Error fetching project documents:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // Flatten the response
    const documents = (documentLinks || [])
      .filter((link: any) => link.documents)
      .map((link: any) => ({
        ...link.documents,
        added_at: link.added_at,
      }));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Entity project documents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a document to this entity project
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json({ error: "document_id is required" }, { status: 400 });
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("entity_projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Add document to entity project
    const { data, error } = await supabase
      .from("document_projects")
      .insert({
        document_id,
        entity_project_id: projectId,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Document already in project" }, { status: 400 });
      }
      console.error("Error adding document to project:", error);
      return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Add document to project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a document from this entity project
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("document_id");

    if (!documentId) {
      return NextResponse.json({ error: "document_id is required" }, { status: 400 });
    }

    // Remove document from entity project
    const { error } = await supabase
      .from("document_projects")
      .delete()
      .eq("document_id", documentId)
      .eq("entity_project_id", projectId);

    if (error) {
      console.error("Error removing document from project:", error);
      return NextResponse.json({ error: "Failed to remove document" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove document from project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
