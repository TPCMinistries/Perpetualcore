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
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Library
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Your unified knowledge hub - {stats.total} documents across all spaces
              </p>
            </div>
          </div>
          <Link href="/dashboard/chat">
            <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Library
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
            <div className="p-8 space-y-6">
              {/* Stats Cards */}
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

              {/* Document Types Distribution */}
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
            </div>
          </TabsContent>

          {/* All Documents Tab */}
          <TabsContent value="all" className="mt-0">
            <div className="p-8">
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
            </div>
          </TabsContent>

          {/* By Space Tab */}
          <TabsContent value="spaces" className="mt-0">
            <div className="p-8">
              <div className="mb-6">
                <Select
                  value={selectedSpaceId || "all"}
                  onValueChange={(value) => setSelectedSpaceId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Spaces</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        <div className="flex items-center gap-2">
                          <span>{space.emoji}</span>
                          <span>{space.name}</span>
                          <span className="text-xs text-slate-500">({space.space_type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No documents in this space"
                  description="Documents added to this space will appear here."
                />
              ) : (
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
              )}
            </div>
          </TabsContent>

          {/* By Project Tab */}
          <TabsContent value="projects" className="mt-0">
            <div className="p-8">
              <div className="mb-6">
                <Select
                  value={selectedProjectId || "all"}
                  onValueChange={(value) => setSelectedProjectId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span>{project.icon}</span>
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No documents in this project"
                  description="Documents added to this project will appear here."
                />
              ) : (
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
