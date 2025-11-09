import { SupabaseClient } from "@supabase/supabase-js";

export interface DocumentWithRelationships {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  status: string;
  metadata: any;
  summary?: string | null;
  key_points?: string[] | null;
  document_type?: string | null;
  created_at: string;
  projects?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  folders?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  knowledge_spaces?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
}

export async function fetchDocumentsWithRelationships(
  supabase: SupabaseClient,
  documentIds: string[]
): Promise<Map<string, DocumentWithRelationships>> {
  const enrichedDocs = new Map<string, DocumentWithRelationships>();

  if (documentIds.length === 0) return enrichedDocs;

  try {
    // Fetch projects for these documents
    const { data: projectLinks } = await supabase
      .from("document_projects")
      .select(`
        document_id,
        projects (
          id,
          name,
          icon,
          color
        )
      `)
      .in("document_id", documentIds);

    // Fetch folders for these documents
    const { data: folderLinks } = await supabase
      .from("document_folders")
      .select(`
        document_id,
        folders (
          id,
          name,
          color
        )
      `)
      .in("document_id", documentIds);

    // Fetch knowledge spaces for these documents
    const { data: spaceLinks } = await supabase
      .from("document_knowledge_spaces")
      .select(`
        document_id,
        knowledge_spaces (
          id,
          name,
          emoji,
          color
        )
      `)
      .in("document_id", documentIds);

    // Group by document ID
    const projectsByDoc = new Map<string, any[]>();
    const foldersByDoc = new Map<string, any[]>();
    const spacesByDoc = new Map<string, any[]>();

    projectLinks?.forEach((link: any) => {
      if (!link.projects) return;
      const docId = link.document_id;
      if (!projectsByDoc.has(docId)) projectsByDoc.set(docId, []);
      projectsByDoc.get(docId)!.push(link.projects);
    });

    folderLinks?.forEach((link: any) => {
      if (!link.folders) return;
      const docId = link.document_id;
      if (!foldersByDoc.has(docId)) foldersByDoc.set(docId, []);
      foldersByDoc.get(docId)!.push(link.folders);
    });

    spaceLinks?.forEach((link: any) => {
      if (!link.knowledge_spaces) return;
      const docId = link.document_id;
      if (!spacesByDoc.has(docId)) spacesByDoc.set(docId, []);
      spacesByDoc.get(docId)!.push(link.knowledge_spaces);
    });

    // Return maps for enrichment
    return {
      projectsByDoc,
      foldersByDoc,
      spacesByDoc,
    } as any;
  } catch (error) {
    console.error("Error fetching document relationships:", error);
    return enrichedDocs;
  }
}

export function enrichDocumentsWithRelationships(
  documents: any[],
  relationships: {
    projectsByDoc: Map<string, any[]>;
    foldersByDoc: Map<string, any[]>;
    spacesByDoc: Map<string, any[]>;
  }
): DocumentWithRelationships[] {
  const { projectsByDoc, foldersByDoc, spacesByDoc } = relationships;

  return documents.map((doc) => ({
    ...doc,
    projects: projectsByDoc.get(doc.id) || [],
    folders: foldersByDoc.get(doc.id) || [],
    knowledge_spaces: spacesByDoc.get(doc.id) || [],
  }));
}
