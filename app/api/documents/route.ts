import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { rateLimiters } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.organization_id) {
      console.log("No organization found for user");
      return Response.json({
        success: true,
        documents: [],
      });
    }

    // Check for folder_id filter in query params
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folder_id");

    // Build query with left joins to fetch many-to-many relationships
    // Note: Using left joins so documents without projects/folders/spaces are still returned
    let query = supabase
      .from("documents")
      .select(`
        *,
        document_projects (
          projects (
            id,
            name,
            icon,
            color
          )
        ),
        document_folders (
          folders (
            id,
            name,
            color
          )
        ),
        document_knowledge_spaces (
          knowledge_spaces (
            id,
            name,
            emoji,
            color
          )
        )
      `)
      .eq("organization_id", profile.organization_id)
      .in("status", ["completed", "processing"]); // Show completed and processing documents

    // Apply folder filter if provided (check if document is in the folder via junction table)
    if (folderId && folderId !== "null") {
      // We need to filter documents that have this folder_id in the junction table
      query = query.eq("document_folders.folder_id", folderId);
    }

    // Execute query
    const { data: rawDocuments, error } = await query.order("created_at", { ascending: false });

    // Log any errors for debugging
    if (error) {
      console.error("Database query error:", error);
      return Response.json({
        success: false,
        error: "Failed to fetch documents",
        documents: [],
      });
    }

    // Return empty array if no documents (don't fall back to mock)
    if (!rawDocuments || rawDocuments.length === 0) {
      console.log("No documents found in database");
      return Response.json({
        success: true,
        documents: [],
      });
    }

    // Transform the data to flatten junction tables
    const documents = rawDocuments.map((doc: any) => {
      // Extract projects from junction table
      const projects = (doc.document_projects || [])
        .map((link: any) => link.projects)
        .filter(Boolean);

      // Extract folders from junction table
      const folders = (doc.document_folders || [])
        .map((link: any) => link.folders)
        .filter(Boolean);

      // Extract knowledge spaces from junction table
      const knowledge_spaces = (doc.document_knowledge_spaces || [])
        .map((link: any) => link.knowledge_spaces)
        .filter(Boolean);

      // Remove the junction table data and add flattened arrays
      const {
        document_projects,
        document_folders,
        document_knowledge_spaces,
        ...docData
      } = doc;

      return {
        ...docData,
        projects,
        folders,
        knowledge_spaces,
      };
    });

    return Response.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Documents API error:", error);
    return Response.json({
      success: false,
      error: "Internal server error",
      documents: [],
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return new Response("Document ID required", { status: 400 });
    }

    // Delete document (chunks will be deleted via cascade)
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id); // Ensure user owns the document

    if (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
    }

    return Response.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Document delete error:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
