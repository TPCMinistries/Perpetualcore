import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LibrarySuggestion {
  id: string;
  type: "explore" | "action" | "insight" | "connection";
  title: string;
  description: string;
  priority: number;
  metadata?: {
    documentIds?: string[];
    query?: string;
    action?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const suggestions: LibrarySuggestion[] = [];

    // 1. Check for documents without summaries
    const { data: docsWithoutSummary, count: unsummarizedCount } = await supabase
      .from("documents")
      .select("id, title", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed")
      .is("summary", null)
      .limit(5);

    if (unsummarizedCount && unsummarizedCount > 0) {
      suggestions.push({
        id: "generate-summaries",
        type: "action",
        title: `${unsummarizedCount} document${unsummarizedCount > 1 ? "s" : ""} need summaries`,
        description: "Generate AI summaries for faster searching and better organization",
        priority: 1,
        metadata: {
          documentIds: docsWithoutSummary?.map(d => d.id) || [],
          action: "generate_summaries",
        },
      });
    }

    // 2. Check for recent documents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentDocs, count: recentCount } = await supabase
      .from("documents")
      .select("id, title, document_type", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentCount && recentCount > 0) {
      suggestions.push({
        id: "review-recent",
        type: "explore",
        title: `${recentCount} new document${recentCount > 1 ? "s" : ""} this week`,
        description: "Review your recently added documents and their key insights",
        priority: 2,
        metadata: {
          documentIds: recentDocs?.map(d => d.id) || [],
          action: "view_recent",
        },
      });
    }

    // 3. Check document type distribution for topic exploration
    const { data: docTypes } = await supabase
      .from("documents")
      .select("document_type")
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed")
      .not("document_type", "is", null);

    if (docTypes && docTypes.length > 0) {
      const typeCounts: Record<string, number> = {};
      docTypes.forEach(d => {
        if (d.document_type) {
          typeCounts[d.document_type] = (typeCounts[d.document_type] || 0) + 1;
        }
      });

      const topTypes = Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      if (topTypes.length > 0) {
        suggestions.push({
          id: "explore-topics",
          type: "explore",
          title: "Explore by topic",
          description: `Your top topics: ${topTypes.map(([t, c]) => `${t} (${c})`).join(", ")}`,
          priority: 3,
          metadata: {
            query: `documents about ${topTypes[0][0]}`,
          },
        });
      }
    }

    // 4. Check for documents in projects
    const { data: projectDocs } = await supabase
      .from("document_projects")
      .select(`
        document_id,
        projects!inner(id, name)
      `)
      .limit(10);

    const projectsWithDocs = new Set(projectDocs?.map(d => (d.projects as any)?.name)).size;

    if (projectsWithDocs > 0) {
      suggestions.push({
        id: "project-insights",
        type: "insight",
        title: "Project knowledge overview",
        description: `You have documents across ${projectsWithDocs} project${projectsWithDocs > 1 ? "s" : ""}`,
        priority: 4,
        metadata: {
          action: "view_projects",
        },
      });
    }

    // 5. Quick discovery prompts
    suggestions.push({
      id: "discover-connections",
      type: "connection",
      title: "Find connections",
      description: "Ask me to find relationships between your documents",
      priority: 5,
      metadata: {
        query: "What themes or topics appear across multiple documents?",
      },
    });

    // 6. Get total document stats for context
    const { count: totalDocs } = await supabase
      .from("documents")
      .select("id", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed");

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      suggestions: suggestions.slice(0, 6), // Return top 6
      stats: {
        totalDocuments: totalDocs || 0,
        recentDocuments: recentCount || 0,
        documentsNeedingSummary: unsummarizedCount || 0,
      },
    });
  } catch (error) {
    console.error("Library suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
