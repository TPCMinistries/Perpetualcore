import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mock documents as fallback
const MOCK_DOCUMENTS = [
  {
    id: "mock-1",
    title: "Getting Started with Perpetual Core.pdf",
    file_type: "application/pdf",
    file_size: 245670,
    file_url: null,
    status: "completed",
    folder_id: null,
    metadata: {
      wordCount: 1523,
      charCount: 9847,
      isRichText: false,
    },
    summary: "This document provides a comprehensive introduction to Perpetual Core, covering the main features including AI Chat, document management, workflow automation, and integrations. It explains how to get started with the platform and maximize productivity.",
    key_points: [
      "Perpetual Core combines multiple productivity tools into one intelligent platform",
      "Document uploads are automatically processed and made searchable",
      "Workflows can automate repetitive tasks across integrated services",
      "Natural language AI chat helps with brainstorming and task completion"
    ],
    document_type: "Guide",
    summary_generated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    summary_tokens_used: 2847,
    summary_cost_usd: "0.0142",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      full_name: "Demo User",
    },
    folder: null,
    tags: [
      { tag: { id: "tag-1", name: "onboarding", color: "#3b82f6" } }
    ],
  },
  {
    id: "mock-2",
    title: "Project Requirements Document.docx",
    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    file_size: 189340,
    file_url: null,
    status: "completed",
    folder_id: null,
    metadata: {
      wordCount: 3245,
      charCount: 19234,
      isRichText: false,
    },
    summary: "Detailed requirements document outlining the scope, objectives, and technical specifications for the upcoming platform redesign project. Includes timeline, resource allocation, and success metrics.",
    key_points: [
      "Project aims to modernize the user interface and improve performance",
      "Timeline set for 6-month completion with 3 major milestones",
      "Budget allocated for additional development resources",
      "Success metrics include 40% reduction in page load times"
    ],
    document_type: "Requirements",
    summary_generated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    summary_tokens_used: 4521,
    summary_cost_usd: "0.0226",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      full_name: "Demo User",
    },
    folder: null,
    tags: [
      { tag: { id: "tag-2", name: "project", color: "#8b5cf6" } },
      { tag: { id: "tag-3", name: "important", color: "#ef4444" } }
    ],
  },
  {
    id: "mock-3",
    title: "Meeting Notes - Q4 Planning.txt",
    file_type: "text/plain",
    file_size: 12450,
    file_url: null,
    status: "completed",
    folder_id: null,
    metadata: {
      wordCount: 856,
      charCount: 5234,
      isRichText: false,
    },
    summary: "Notes from the Q4 planning meeting discussing goals, resource allocation, and strategic priorities for the final quarter. Team decided to focus on customer retention and product improvements.",
    key_points: [
      "Top priority: Improve customer retention by 15%",
      "Launch two new features based on customer feedback",
      "Increase marketing budget for holiday campaigns",
      "Schedule monthly check-ins to track progress"
    ],
    document_type: "Meeting Notes",
    summary_generated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    summary_tokens_used: 1234,
    summary_cost_usd: "0.0062",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      full_name: "Demo User",
    },
    folder: null,
    tags: [
      { tag: { id: "tag-4", name: "meeting", color: "#10b981" } }
    ],
  },
  {
    id: "mock-4",
    title: "API Integration Guide.md",
    file_type: "text/markdown",
    file_size: 34120,
    file_url: null,
    status: "completed",
    folder_id: null,
    metadata: {
      wordCount: 2134,
      charCount: 13567,
      isRichText: false,
    },
    summary: null,
    key_points: null,
    document_type: null,
    summary_generated_at: null,
    summary_tokens_used: null,
    summary_cost_usd: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      full_name: "Demo User",
    },
    folder: null,
    tags: [
      { tag: { id: "tag-5", name: "technical", color: "#f59e0b" } },
      { tag: { id: "tag-6", name: "documentation", color: "#6366f1" } }
    ],
  },
  {
    id: "mock-5",
    title: "Financial Report 2024.csv",
    file_type: "text/csv",
    file_size: 45230,
    file_url: null,
    status: "processing",
    folder_id: null,
    metadata: {
      wordCount: 0,
      charCount: 0,
      isRichText: false,
    },
    summary: null,
    key_points: null,
    document_type: null,
    summary_generated_at: null,
    summary_tokens_used: null,
    summary_cost_usd: null,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: {
      full_name: "Demo User",
    },
    folder: null,
    tags: [],
  },
];

export async function GET(req: NextRequest) {
  try {
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
      console.log("Using mock documents (no organization found)");
      return Response.json({
        success: true,
        documents: MOCK_DOCUMENTS,
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
      .eq("status", "completed"); // Only show successfully uploaded documents

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
        success: true,
        documents: MOCK_DOCUMENTS,
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
    console.error("Documents API error, returning mock data:", error);
    return Response.json({
      success: true,
      documents: MOCK_DOCUMENTS,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
