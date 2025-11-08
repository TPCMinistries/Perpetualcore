"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Trash2, Upload, FolderIcon, FolderPlus, Sparkles,
  Search, Filter, X, MessageSquare, LayoutGrid, List,
  BookOpen, TrendingUp, BarChart3, Tag, Calendar, Building2,
  Briefcase, Brain, Loader2, Eye
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentCardSkeleton } from "@/components/ui/skeletons";
import { FolderModal } from "@/components/documents/FolderModal";
import { DocumentChatModal } from "@/components/documents/DocumentChatModal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { CreateDocumentModal } from "@/components/documents/CreateDocumentModal";
import { Folder as FolderType, Tag as TagType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  status: "processing" | "completed" | "failed";
  error_message?: string;
  folder_id?: string | null;
  knowledge_space_id?: string | null;
  project_id?: string | null;
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
  folder?: FolderType | null;
  tags?: TagType[];
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
  const [activeTab, setActiveTab] = useState("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
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
  const [stats, setStats] = useState<LibraryStats>({
    total: 0,
    byType: {},
    withSummaries: 0,
    recentCount: 0,
  });

  useEffect(() => {
    fetchAll();
  }, [selectedFolderId, selectedSpaceId, selectedProjectId]);

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
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center shadow-lg">
              <BookOpen className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Library
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
                Your organization's centralized knowledge base. {stats.total} documents organized across {spaces.length} spaces, searchable and AI-enhanced.
              </p>
            </div>
          </div>
          <Link href="/dashboard/chat">
            <Button size="lg" className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg">
              <Brain className="h-5 w-5 mr-2" />
              Ask AI Anything
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-8">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-slate-100 rounded-none px-4 py-3"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-slate-100 rounded-none px-4 py-3"
              >
                <FileText className="h-4 w-4 mr-2" />
                All Documents
              </TabsTrigger>
              <TabsTrigger
                value="spaces"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-slate-100 rounded-none px-4 py-3"
              >
                <Building2 className="h-4 w-4 mr-2" />
                By Space
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-slate-100 rounded-none px-4 py-3"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                By Project
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="p-8 space-y-8">
              {/* Intro Card */}
              <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Your AI-Enhanced Knowledge Base
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Welcome to your Library - the central hub for all organizational knowledge. Every document is automatically processed,
                      summarized, and made searchable by AI. Organize using <strong>Spaces</strong> (team-specific knowledge) or <strong>Projects</strong> (cross-functional work),
                      then chat with any document or your entire library instantly.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Stats Cards */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Documents</p>
                      <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {stats.total}
                      </h3>
                    </div>
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">AI Summaries</p>
                      <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {stats.withSummaries}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {stats.total > 0
                          ? `${Math.round((stats.withSummaries / stats.total) * 100)}% coverage`
                          : "0%"}
                      </p>
                    </div>
                    <Sparkles className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Knowledge Spaces</p>
                      <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {spaces.length}
                      </h3>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Recent Activity</p>
                      <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {stats.recentCount}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Documents - Takes 2 columns */}
                <div className="lg:col-span-2">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Recent Documents
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("all")}>
                        View All →
                      </Button>
                    </div>
                    {documents.length === 0 ? (
                      <div className="text-center py-12">
                        <Upload className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-4">No documents yet</p>
                        <FileUpload onUploadComplete={handleUploadComplete} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.slice(0, 5).map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                            onClick={() => handleOpenPreview(doc)}
                          >
                            <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {doc.title}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(doc.created_at).toLocaleDateString()} • {(doc.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            {doc.document_type && (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-600 dark:text-slate-400">
                                {doc.document_type}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(doc);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* Quick Actions - Takes 1 column */}
                <div>
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Quick Actions
                    </h2>
                    <div className="space-y-3">
                      <FileUpload onUploadComplete={handleUploadComplete} />
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setCreateDocModalOpen(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Document
                      </Button>
                      <Link href="/dashboard/chat" className="block">
                        <Button variant="outline" className="w-full justify-start">
                          <Brain className="h-4 w-4 mr-2" />
                          Chat with Library
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab("spaces")}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Browse by Space
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab("projects")}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Browse by Project
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Document Types Distribution */}
              {Object.keys(stats.byType).length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Document Types Distribution
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(stats.byType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const percentage = (count / stats.total) * 100;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-900 dark:text-slate-100 font-medium">{type}</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* All Documents Tab */}
          <TabsContent value="all" className="mt-0">
            <div className="p-8">
              {/* Upload Area - Prominent when no documents */}
              {documents.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-12 text-center mb-8">
                  <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Your Knowledge Base Awaits
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Upload documents, PDFs, or create new docs to build your AI-powered knowledge library.
                    Every document is automatically processed, summarized, and made searchable.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <FileUpload onUploadComplete={handleUploadComplete} />
                    <Button onClick={() => setCreateDocModalOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Document
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Explanation */}
                  <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">All Documents</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Browse, search, and manage every document in your knowledge base. Use filters to find specific types, or search across titles, summaries, and content.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Search & Actions Bar */}
                  <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search your entire library..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
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
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={() => setCreateDocModalOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    New Document
                  </Button>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </div>

                {/* Quick Filters */}
                {documentTypes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <button
                      onClick={() => setFilterType(null)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        filterType === null
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      All Types
                    </button>
                    {documentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          filterType === type
                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Grid/List */}
              {isLoading ? (
                <DocumentCardSkeleton />
              ) : filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={Upload}
                  title="No documents yet"
                  description="Start building your knowledge base by uploading your first document."
                />
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
                </>
              )}
            </div>
          </TabsContent>

          {/* By Space Tab */}
          <TabsContent value="spaces" className="mt-0">
            <div className="p-8">
              {/* Explanation */}
              <div className="mb-8">
                <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Knowledge Spaces
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>Spaces</strong> are team-specific knowledge containers. Think of them as dedicated libraries for different departments (Engineering, Sales, Marketing) or teams.
                        Documents in a Space are only accessible to that team and can be used in team conversations with scoped AI context.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {spaces.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No Knowledge Spaces yet"
                  description="Create your first Space to organize documents by team or department."
                />
              ) : (
                <div className="space-y-6">
                  {spaces.map((space) => {
                    const spaceDocuments = documents.filter(
                      (doc) => doc.knowledge_space_id === space.id && doc.status === "completed"
                    );
                    return (
                      <Card key={space.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg ${space.color || 'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center text-2xl`}>
                              {space.emoji}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{space.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {space.space_type} • {spaceDocuments.length} document{spaceDocuments.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSpaceId(space.id)}
                          >
                            View All
                          </Button>
                        </div>

                        {spaceDocuments.length === 0 ? (
                          <div className="text-center py-8 text-sm text-slate-500">
                            No documents in this space yet
                          </div>
                        ) : (
                          <div className="grid gap-4 lg:grid-cols-3">
                            {spaceDocuments.slice(0, 3).map((doc) => (
                              <div
                                key={doc.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                                onClick={() => handleOpenPreview(doc)}
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                      {doc.title}
                                    </h4>
                                    {doc.document_type && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-600 dark:text-slate-400">
                                        {doc.document_type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* By Project Tab */}
          <TabsContent value="projects" className="mt-0">
            <div className="p-8">
              {/* Explanation */}
              <div className="mb-8">
                <Card className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Project-Based Organization
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>Projects</strong> are cross-functional workspaces that bring together documents from different teams.
                        Perfect for initiatives, campaigns, or deliverables that span multiple departments. Documents can belong to multiple projects simultaneously.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {projects.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No Projects yet"
                  description="Create your first Project to organize cross-functional work and deliverables."
                />
              ) : (
                <div className="space-y-6">
                  {projects.map((project) => {
                    const projectDocuments = documents.filter(
                      (doc) => doc.project_id === project.id && doc.status === "completed"
                    );
                    return (
                      <Card key={project.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg ${project.color || 'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center text-2xl`}>
                              {project.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {projectDocuments.length} document{projectDocuments.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProjectId(project.id)}
                          >
                            View All
                          </Button>
                        </div>

                        {projectDocuments.length === 0 ? (
                          <div className="text-center py-8 text-sm text-slate-500">
                            No documents in this project yet
                          </div>
                        ) : (
                          <div className="grid gap-4 lg:grid-cols-3">
                            {projectDocuments.slice(0, 3).map((doc) => (
                              <div
                                key={doc.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
                                onClick={() => handleOpenPreview(doc)}
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                      {doc.title}
                                    </h4>
                                    {doc.document_type && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-600 dark:text-slate-400">
                                        {doc.document_type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
