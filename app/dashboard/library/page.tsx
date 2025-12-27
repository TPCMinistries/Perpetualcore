"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Trash2, Upload, FolderIcon, FolderPlus, Sparkles,
  Search, Filter, X, MessageSquare, LayoutGrid, List,
  BookOpen, TrendingUp, BarChart3, Tag, Calendar, Building2,
  Briefcase, Brain, Loader2, Eye, Network, FolderOpen, Plus,
  Settings, RefreshCw
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentGridSkeleton } from "@/components/ui/skeletons";
import { FolderModal } from "@/components/documents/FolderModal";
import { DocumentChatModal } from "@/components/documents/DocumentChatModal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { CreateDocumentModal } from "@/components/documents/CreateDocumentModal";
import { LibraryModeSwitch, LibraryMode } from "@/components/library/LibraryModeSwitch";
import { LibraryAssistant } from "@/components/library/LibraryAssistant";
import { KnowledgeGraph, GraphNode, GraphLink } from "@/components/library/KnowledgeGraph";
import { Folder as FolderType, Tag as TagType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  status: "processing" | "completed" | "failed";
  error_message?: string;
  metadata: {
    wordCount: number;
    charCount: number;
    isRichText?: boolean;
  };
  summary?: string | null;
  key_points?: string[] | null;
  document_type?: string | null;
  summary_generated_at?: string | null;
  created_at: string;
  user: {
    full_name: string;
  };
  tags?: TagType[];
  projects?: Project[];
  folders?: FolderType[];
  knowledge_spaces?: Space[];
}

interface Space {
  id: string;
  name: string;
  emoji: string;
  color: string;
  space_type: string;
}

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface LibraryStats {
  total: number;
  byType: Record<string, number>;
  withSummaries: number;
  recentCount: number;
}

export default function LibraryPage() {
  const router = useRouter();

  // Mode state
  const [mode, setMode] = useState<LibraryMode>("files");
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false);

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatDocument, setChatDocument] = useState<{ id: string; title: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);

  // Graph state
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  const [stats, setStats] = useState<LibraryStats>({
    total: 0,
    byType: {},
    withSummaries: 0,
    recentCount: 0,
  });

  useEffect(() => {
    fetchAll();
  }, [selectedFolderId, selectedSpaceId, selectedProjectId]);

  useEffect(() => {
    if (mode === "graph") {
      buildGraphData();
    }
  }, [mode, documents, spaces, projects]);

  async function fetchAll() {
    setIsLoading(true);
    await Promise.all([
      fetchDocuments(),
      fetchFolders(),
      fetchSpaces(),
      fetchProjects(),
      fetchStats(),
    ]);
    setIsLoading(false);
  }

  async function fetchDocuments() {
    try {
      let url = "/api/documents";
      const params = new URLSearchParams();
      if (selectedFolderId) params.append("folder_id", selectedFolderId);
      if (selectedSpaceId) params.append("space_id", selectedSpaceId);
      if (selectedProjectId) params.append("project_id", selectedProjectId);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    }
  }

  async function fetchFolders() {
    try {
      const response = await fetch("/api/documents/folders");
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function fetchSpaces() {
    try {
      const response = await fetch("/api/spaces");
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  async function fetchStats() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data: docs } = await supabase
        .from("documents")
        .select("id, document_type, summary, created_at")
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed");

      const byType: Record<string, number> = {};
      let withSummaries = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      docs?.forEach((doc) => {
        const type = doc.document_type || "Uncategorized";
        byType[type] = (byType[type] || 0) + 1;
        if (doc.summary) withSummaries++;
      });

      const recentCount = docs?.filter(
        (doc) => new Date(doc.created_at) >= thirtyDaysAgo
      ).length || 0;

      setStats({
        total: docs?.length || 0,
        byType,
        withSummaries,
        recentCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  function buildGraphData() {
    setIsGraphLoading(true);

    // Build nodes from documents, projects, spaces
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add document nodes
    documents.filter(d => d.status === "completed").forEach(doc => {
      nodes.push({
        id: `doc-${doc.id}`,
        type: "document",
        label: doc.title.length > 25 ? doc.title.slice(0, 25) + "..." : doc.title,
        size: 15 + (doc.metadata?.wordCount || 0) / 500,
        metadata: { documentId: doc.id, fullTitle: doc.title }
      });

      // Link to projects
      doc.projects?.forEach(project => {
        links.push({
          source: `doc-${doc.id}`,
          target: `project-${project.id}`,
          type: "belongs_to",
          strength: 0.8
        });
      });

      // Link to spaces
      doc.knowledge_spaces?.forEach(space => {
        links.push({
          source: `doc-${doc.id}`,
          target: `space-${space.id}`,
          type: "belongs_to",
          strength: 0.7
        });
      });
    });

    // Add project nodes
    projects.forEach(project => {
      nodes.push({
        id: `project-${project.id}`,
        type: "project",
        label: project.name,
        size: 22,
        metadata: { projectId: project.id }
      });
    });

    // Add space nodes
    spaces.forEach(space => {
      nodes.push({
        id: `space-${space.id}`,
        type: "space",
        label: space.name,
        size: 20,
        metadata: { spaceId: space.id }
      });
    });

    // Add concept nodes from document types
    const conceptCounts: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.document_type) {
        conceptCounts[doc.document_type] = (conceptCounts[doc.document_type] || 0) + 1;
      }
    });

    Object.entries(conceptCounts).forEach(([type, count]) => {
      nodes.push({
        id: `concept-${type}`,
        type: "concept",
        label: type,
        size: 12 + count * 3
      });

      // Link documents to their type concepts
      documents.filter(d => d.document_type === type).forEach(doc => {
        links.push({
          source: `doc-${doc.id}`,
          target: `concept-${type}`,
          type: "references",
          strength: 0.5
        });
      });
    });

    setGraphNodes(nodes);
    setGraphLinks(links);
    setIsGraphLoading(false);
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete document");

      toast.success("Document deleted");
      fetchAll();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  }

  async function handleGenerateSummary(documentId: string) {
    setGeneratingSummary(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}/summary`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      toast.success(`Summary generated! Cost: $${data.summary.cost_usd}`);
      fetchAll();
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setGeneratingSummary(null);
    }
  }

  function handleOpenChat(doc: Document) {
    setChatDocument({ id: doc.id, title: doc.title });
    setChatModalOpen(true);
  }

  function handleOpenPreview(doc: Document) {
    setPreviewDocument(doc);
    setPreviewModalOpen(true);
  }

  function handleUploadComplete(files: UploadedFile[]) {
    toast.success(`${files.length} file(s) uploaded!`);
    fetchAll();
  }

  function handleGraphNodeClick(node: GraphNode) {
    console.log("Node clicked:", node);
  }

  function handleGraphNodeDoubleClick(node: GraphNode) {
    if (node.type === "document" && node.metadata?.documentId) {
      const doc = documents.find(d => d.id === node.metadata?.documentId);
      if (doc) handleOpenPreview(doc);
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = doc.title.toLowerCase().includes(query);
      const matchesSummary = doc.summary?.toLowerCase().includes(query);
      const matchesType = doc.document_type?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesSummary && !matchesType) {
        return false;
      }
    }

    if (filterType && doc.document_type !== filterType) {
      return false;
    }

    return doc.status === "completed";
  });

  const documentTypes = Array.from(
    new Set(documents.map((doc) => doc.document_type).filter(Boolean))
  ).sort();

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Library
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {stats.total} documents • {spaces.length} spaces • {projects.length} projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LibraryModeSwitch mode={mode} onModeChange={setMode} />

            <div className="h-8 w-px bg-white/10" />

            <FileUpload onUploadComplete={handleUploadComplete} />

            <Button
              onClick={() => setCreateDocModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Doc
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Assistant Panel */}
        <LibraryAssistant
          isCollapsed={isAssistantCollapsed}
          onToggleCollapse={() => setIsAssistantCollapsed(!isAssistantCollapsed)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* AI Assistant Mode */}
            {mode === "assistant" && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center p-8"
              >
                <div className="text-center max-w-md">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    AI-Powered Discovery
                  </h2>
                  <p className="text-slate-400 mb-6">
                    Use the assistant panel on the left to ask questions, search your documents,
                    or let AI help you discover relevant content you didn't know you needed.
                  </p>
                  <Button
                    onClick={() => setIsAssistantCollapsed(false)}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    Open Assistant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Knowledge Graph Mode */}
            {mode === "graph" && (
              <motion.div
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <KnowledgeGraph
                  nodes={graphNodes}
                  links={graphLinks}
                  onNodeClick={handleGraphNodeClick}
                  onNodeDoubleClick={handleGraphNodeDoubleClick}
                  isLoading={isGraphLoading}
                />
              </motion.div>
            )}

            {/* Files Mode */}
            {mode === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto"
              >
                <div className="p-6 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Total Documents</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
                        </div>
                        <FileText className="h-8 w-8 text-blue-400" />
                      </div>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">AI Summaries</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.withSummaries}</h3>
                        </div>
                        <Sparkles className="h-8 w-8 text-purple-400" />
                      </div>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Spaces</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{spaces.length}</h3>
                        </div>
                        <Building2 className="h-8 w-8 text-teal-400" />
                      </div>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Recent (30d)</p>
                          <h3 className="text-2xl font-bold text-white mt-1">{stats.recentCount}</h3>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-400" />
                      </div>
                    </Card>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search your entire library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-purple-500/50 focus:ring-purple-500/20"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={viewMode === "grid" ? "bg-white/10" : "text-slate-400 hover:text-white"}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={viewMode === "list" ? "bg-white/10" : "text-slate-400 hover:text-white"}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Type Filters */}
                  {documentTypes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <button
                        onClick={() => setFilterType(null)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          filterType === null
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        )}
                      >
                        All Types
                      </button>
                      {documentTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            filterType === type
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Documents */}
                  {isLoading ? (
                    <DocumentGridSkeleton />
                  ) : filteredDocuments.length === 0 ? (
                    <Card className="bg-white/5 border-white/10 border-2 border-dashed p-12 text-center">
                      <Upload className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Your Knowledge Base Awaits
                      </h2>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Upload documents, PDFs, or create new docs to build your AI-powered knowledge library.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <FileUpload onUploadComplete={handleUploadComplete} />
                        <Button onClick={() => setCreateDocModalOpen(true)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <FileText className="h-4 w-4 mr-2" />
                          Create Document
                        </Button>
                      </div>
                    </Card>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                      {filteredDocuments.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          onDelete={handleDelete}
                          onGenerateSummary={handleGenerateSummary}
                          onOpenChat={handleOpenChat}
                          onOpenPreview={handleOpenPreview}
                          onTagsChange={fetchAll}
                          generatingSummary={generatingSummary}
                        />
                      ))}
                    </div>
                  ) : (
                    <DocumentTable
                      documents={filteredDocuments}
                      folders={folders}
                      onDelete={handleDelete}
                      onGenerateSummary={handleGenerateSummary}
                      onOpenChat={handleOpenChat}
                      onOpenPreview={handleOpenPreview}
                      onTagsChange={fetchAll}
                      onMoveToFolder={() => {}}
                      onDragStart={() => {}}
                      onDragEnd={() => {}}
                      generatingSummary={generatingSummary}
                      selectedDocuments={[]}
                      onSelectDocument={() => {}}
                      onSelectAll={() => {}}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSuccess={fetchAll}
        folder={null}
      />

      {chatDocument && (
        <DocumentChatModal
          open={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          documentId={chatDocument.id}
          documentTitle={chatDocument.title}
        />
      )}

      <DocumentPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        document={previewDocument}
      />

      <CreateDocumentModal
        open={createDocModalOpen}
        onOpenChange={setCreateDocModalOpen}
        onSuccess={fetchAll}
      />
    </div>
  );
}
