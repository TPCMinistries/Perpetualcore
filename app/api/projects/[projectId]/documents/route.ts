import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch documents for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ documents: [] });
    }

    // Verify project belongs to user's organization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch documents linked to this project via junction table
    const { data: documentLinks, error: linksError } = await supabase
      .from("document_projects")
      .select(`
        document_id,
        added_at,
        added_by,
        documents (
          id,
          name,
          type,
          file_url,
          file_size,
          status,
          created_at,
          updated_at,
          user_id
        )
      `)
      .eq("project_id", projectId);

    if (linksError) {
      console.error("Error fetching project documents:", linksError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Transform and filter valid documents
    const documents = (documentLinks || [])
      .filter((link: any) => link.documents && link.documents.status === "completed")
      .map((link: any) => ({
        ...link.documents,
        added_at: link.added_at,
        added_by: link.added_by,
      }));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Project documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Link an existing document to this project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Add document to project
    const { data, error } = await supabase
      .from("document_projects")
      .insert({
        document_id,
        project_id: projectId,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Document is already in this project" },
          { status: 400 }
        );
      }
      console.error("Error adding document to project:", error);
      return NextResponse.json(
        { error: "Failed to add document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Add document to project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a document from this project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("document_id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Remove document from project (doesn't delete the document itself)
    const { error } = await supabase
      .from("document_projects")
      .delete()
      .eq("document_id", documentId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error removing document from project:", error);
      return NextResponse.json(
        { error: "Failed to remove document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove document from project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
