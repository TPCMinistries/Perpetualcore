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
import { Badge } from "@/components/ui/badge";
import {
  FileText, Trash2, Upload, FolderIcon, FolderPlus, Sparkles,
  Search, Filter, X, MessageSquare, LayoutGrid, List,
  BookOpen, TrendingUp, BarChart3, Tag, Calendar, Building2,
  Briefcase, Brain, Loader2, Eye, Network, FolderOpen, Plus,
  Settings, RefreshCw, ChevronRight, MoreHorizontal, Clock,
  Layers, Zap, ArrowRight, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentGridSkeleton } from "@/components/ui/skeletons";
import { FolderModal } from "@/components/documents/FolderModal";
import { DocumentChatModal } from "@/components/documents/DocumentChatModal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { CreateDocumentModal } from "@/components/documents/CreateDocumentModal";
import { LibraryAssistant } from "@/components/library/LibraryAssistant";
import { KnowledgeGraph, GraphNode, GraphLink } from "@/components/library/KnowledgeGraph";
import { Folder as FolderType, Tag as TagType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { glassClasses, glowClasses, motionVariants, staggerContainer, staggerItem } from "@/lib/design/library-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Collection {
  id: string;
  name: string;
  documentIds: string[];
  confidence?: number;
  keywords?: string[];
  is_pinned?: boolean;
}

interface LibraryStats {
  total: number;
  byType: Record<string, number>;
  withSummaries: number;
  recentCount: number;
}

type ViewMode = "files" | "graph";

export default function LibraryPage() {
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("files");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("list");
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionDocIds, setCollectionDocIds] = useState<string[] | null>(null);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
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
    if (viewMode === "graph") {
      buildGraphData();
    }
  }, [viewMode, documents, spaces, projects]);

  useEffect(() => {
    fetchCollections();
  }, []);

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
      const params = new URLSearchParams();
      if (selectedFolderId) params.set("folder_id", selectedFolderId);
      if (selectedSpaceId) params.set("space_id", selectedSpaceId);
      if (selectedProjectId) params.set("project_id", selectedProjectId);

      const response = await fetch(`/api/documents?${params}`);
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
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function fetchSpaces() {
    try {
      const response = await fetch("/api/spaces");
      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.projects) {
        const projectsList = Array.isArray(data.projects)
          ? data.projects
          : Object.values(data.projects).flat();
        setProjects(projectsList as Project[]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }

  async function fetchStats() {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return;

      const { data: docs } = await supabase
        .from("documents")
        .select("id, document_type, summary, created_at")
        .eq("user_id", profile.user.id)
        .eq("status", "completed");

      if (docs) {
        const byType: Record<string, number> = {};
        let withSummaries = 0;
        let recentCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        docs.forEach((doc) => {
          if (doc.document_type) {
            byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
          }
          if (doc.summary) withSummaries++;
          if (new Date(doc.created_at) > thirtyDaysAgo) recentCount++;
        });

        setStats({
          total: docs.length,
          byType,
          withSummaries,
          recentCount,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchCollections() {
    setIsLoadingCollections(true);
    try {
      const response = await fetch("/api/library/collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  }

  async function generateCollections() {
    setIsLoadingCollections(true);
    try {
      const response = await fetch("/api/library/collections/generate", {
        method: "POST",
      });
      if (response.ok) {
        await fetchCollections();
        toast.success("Smart collections generated!");
      }
    } catch (error) {
      toast.error("Failed to generate collections");
    } finally {
      setIsLoadingCollections(false);
    }
  }

  function buildGraphData() {
    setIsGraphLoading(true);
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    documents.forEach((doc) => {
      nodes.push({
        id: doc.id,
        label: doc.title,
        type: "document",
        color: "#3b82f6",
        metadata: { documentId: doc.id },
      });
    });

    spaces.forEach((space) => {
      nodes.push({
        id: `space-${space.id}`,
        label: space.name,
        type: "space",
        color: space.color || "#8b5cf6",
      });
    });

    projects.forEach((project) => {
      nodes.push({
        id: `project-${project.id}`,
        label: project.name,
        type: "project",
        color: project.color || "#10b981",
      });
    });

    documents.forEach((doc) => {
      doc.knowledge_spaces?.forEach((space) => {
        links.push({
          source: doc.id,
          target: `space-${space.id}`,
          type: "belongs_to",
          strength: 0.8,
        });
      });
      doc.projects?.forEach((project) => {
        links.push({
          source: doc.id,
          target: `project-${project.id}`,
          type: "belongs_to",
          strength: 0.7,
        });
      });
    });

    setGraphNodes(nodes);
    setGraphLinks(links);
    setIsGraphLoading(false);
  }

  function handleUploadComplete(files: UploadedFile[]) {
    fetchAll();
    toast.success(`Uploaded ${files.length} file(s) successfully`);
  }

  async function handleDelete(documentId: string) {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      toast.error("Failed to delete document");
    }
  }

  async function handleGenerateSummary(documentId: string) {
    setGeneratingSummary(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}/summary`, {
        method: "POST",
      });
      if (response.ok) {
        await fetchDocuments();
        toast.success("Summary generated");
      } else {
        toast.error("Failed to generate summary");
      }
    } catch (error) {
      toast.error("Failed to generate summary");
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

  function handleGraphNodeClick(node: GraphNode) {
    // Navigate based on node type
    if (node.type === "document" && node.metadata?.documentId) {
      const doc = documents.find(d => d.id === node.metadata?.documentId);
      if (doc) handleOpenPreview(doc);
    } else if (node.type === "project") {
      const projectId = node.id.replace("project-", "");
      router.push(`/dashboard/projects/${projectId}`);
    } else if (node.type === "space") {
      const spaceId = node.id.replace("space-", "");
      router.push(`/dashboard/spaces/${spaceId}`);
    }
  }

  function handleGraphNodeDoubleClick(node: GraphNode) {
    if (node.type === "document" && node.metadata?.documentId) {
      const doc = documents.find(d => d.id === node.metadata?.documentId);
      if (doc) handleOpenPreview(doc);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const filteredDocuments = documents.filter((doc) => {
    if (collectionDocIds && collectionDocIds.length > 0) {
      if (!collectionDocIds.includes(doc.id)) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = doc.title.toLowerCase().includes(query);
      const matchesSummary = doc.summary?.toLowerCase().includes(query);
      const matchesType = doc.document_type?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesSummary && !matchesType) return false;
    }
    if (filterType && doc.document_type !== filterType) return false;
    // Show both completed and processing documents
    return doc.status === "completed" || doc.status === "processing";
  });

  const documentTypes = Array.from(
    new Set(documents.map((doc) => doc.document_type).filter(Boolean))
  ).sort();

  const pendingSummaries = stats.total - stats.withSummaries;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Header */}
      <div className={cn("border-b border-white/20 dark:border-white/10 relative z-10", glassClasses.panel)}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30"
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <BookOpen className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Library
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                  {stats.total} documents • {collections.length} collections • {spaces.length} spaces
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className={cn("flex items-center gap-1 p-1 rounded-xl", glassClasses.subtle)}>
                <button
                  onClick={() => setViewMode("files")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    viewMode === "files"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-violet-500/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Files
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    viewMode === "graph"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md shadow-violet-500/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <Network className="h-4 w-4 inline mr-2" />
                  Graph
                </button>
              </div>

              {/* AI Assistant Toggle */}
              <Button
                variant="outline"
                onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                className={cn(
                  "gap-2 border-2 transition-all",
                  isAiPanelOpen
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
                {isAiPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

              <FileUpload onUploadComplete={handleUploadComplete} variant="button" />

              <Button
                onClick={() => setCreateDocModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Doc
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Optional AI Panel */}
      <div className="flex">
        {/* Main Content Area */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          isAiPanelOpen ? "mr-[400px]" : ""
        )}>
          <AnimatePresence mode="wait">
            {/* Graph View */}
            {viewMode === "graph" && (
              <motion.div
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-180px)]"
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

            {/* Files View */}
            {viewMode === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto px-8 py-8 space-y-8"
              >
                {/* Stats Cards */}
                <motion.div
                  className="grid grid-cols-3 gap-6"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={staggerItem}>
                    <Card className={cn(
                      "p-6 cursor-pointer group transition-all duration-300",
                      glassClasses.card,
                      "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-300 dark:hover:border-blue-700"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Documents</p>
                          <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</h3>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            +{stats.recentCount} this month
                          </p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
                          <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card className={cn(
                      "p-6 cursor-pointer group transition-all duration-300",
                      glassClasses.card,
                      "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-300 dark:hover:border-purple-700"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI Summaries</p>
                          <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.withSummaries}</h3>
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" />
                            {pendingSummaries} pending
                          </p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                          <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Card className={cn(
                      "p-6 cursor-pointer group transition-all duration-300",
                      glassClasses.card,
                      "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-violet-300 dark:hover:border-violet-700"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collections</p>
                          <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{collections.length}</h3>
                          <p className="text-sm text-violet-600 dark:text-violet-400 mt-1 flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            Auto-organized
                          </p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
                          <FolderOpen className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search your library..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <button
                      onClick={() => setDisplayMode("list")}
                      className={cn(
                        "p-2.5 rounded-lg transition-all",
                        displayMode === "list"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <List className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDisplayMode("grid")}
                      className={cn(
                        "p-2.5 rounded-lg transition-all",
                        displayMode === "grid"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <LayoutGrid className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Collection Pills */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">Collections:</span>
                  <button
                    onClick={() => {
                      setSelectedCollectionId(null);
                      setCollectionDocIds(null);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0",
                      selectedCollectionId === null
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    All Documents
                  </button>
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        if (selectedCollectionId === collection.id) {
                          setSelectedCollectionId(null);
                          setCollectionDocIds(null);
                        } else {
                          setSelectedCollectionId(collection.id);
                          setCollectionDocIds(collection.documentIds);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 flex items-center gap-2",
                        selectedCollectionId === collection.id
                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      {collection.name}
                      <Badge variant="secondary" className="text-xs">
                        {collection.documentIds.length}
                      </Badge>
                    </button>
                  ))}
                  {collections.length === 0 && (
                    <button
                      onClick={generateCollections}
                      disabled={isLoadingCollections}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center gap-2 hover:shadow-lg hover:shadow-violet-500/25 transition-all flex-shrink-0"
                    >
                      {isLoadingCollections ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate Smart Collections
                    </button>
                  )}
                </div>

                {/* Type Filters */}
                {documentTypes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <button
                      onClick={() => setFilterType(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        filterType === null
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      All Types
                    </button>
                    {documentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type === filterType ? null : type)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          filterType === type
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                  <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 p-16 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                        <Upload className="h-10 w-10 text-slate-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        Your Knowledge Base Awaits
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Upload documents, PDFs, or create new docs to build your AI-powered knowledge library.
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <FileUpload onUploadComplete={handleUploadComplete} />
                        <Button onClick={() => setCreateDocModalOpen(true)} variant="outline" size="lg">
                          <FileText className="h-5 w-5 mr-2" />
                          Create Document
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <motion.div
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredDocuments.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        variants={staggerItem}
                        whileHover={{ scale: 1.01, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Card
                          className={cn(
                            "p-6 group cursor-pointer transition-all duration-300",
                            glassClasses.card,
                            "hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] hover:border-violet-300 dark:hover:border-violet-700"
                          )}
                          onClick={() => handleOpenPreview(doc)}
                        >
                        <div className="flex items-start gap-5">
                          {/* Icon */}
                          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                            <FileText className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                                  {doc.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDate(doc.created_at)}
                                  </span>
                                  <span>{formatFileSize(doc.file_size)}</span>
                                  <span>{doc.metadata?.wordCount?.toLocaleString() || 0} words</span>
                                  {doc.document_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {doc.document_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenChat(doc);
                                  }}
                                  className="text-slate-500 hover:text-violet-600 dark:hover:text-violet-400"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenPreview(doc)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateSummary(doc.id)}>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Generate Summary
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(doc.id)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Summary Preview */}
                            {doc.summary && (
                              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                {doc.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating AI Assistant Panel */}
        <AnimatePresence>
          {isAiPanelOpen && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed right-0 top-0 h-screen w-[400px] z-40",
                "border-l border-white/20 dark:border-white/10",
                "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl",
                "shadow-[-20px_0_60px_rgba(139,92,246,0.1)]"
              )}
            >
              <LibraryAssistant
                isCollapsed={false}
                onToggleCollapse={() => setIsAiPanelOpen(false)}
                onDocumentClick={(docId) => {
                  const doc = documents.find(d => d.id === docId);
                  if (doc) handleOpenPreview(doc);
                }}
                onDocumentChat={(docId) => {
                  const doc = documents.find(d => d.id === docId);
                  if (doc) handleOpenChat(doc);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
        onChat={(doc) => {
          setChatDocument({ id: doc.id, title: doc.title });
          setChatModalOpen(true);
        }}
      />

      <CreateDocumentModal
        open={createDocModalOpen}
        onOpenChange={setCreateDocModalOpen}
        onSuccess={() => {
          setCreateDocModalOpen(false);
          fetchAll();
        }}
      />
    </div>
  );
}
