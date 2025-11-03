"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUpload, UploadedFile } from "@/components/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Trash2, Calendar, Upload, Edit3, FolderIcon, FolderPlus, Sparkles,
  ChevronDown, ChevronUp, Search, Filter, X, MessageSquare, LayoutGrid, List,
  FileType, File, Sheet, AlertCircle, Eye, Clock, Zap, ChevronLeft, ChevronRight,
  PanelLeftClose, PanelLeft
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentCardSkeleton } from "@/components/ui/skeletons";
import { FolderModal } from "@/components/documents/FolderModal";
import { DocumentChatModal } from "@/components/documents/DocumentChatModal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { CreateDocumentModal } from "@/components/documents/CreateDocumentModal";
import { Folder as FolderType, Tag } from "@/types";

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
  summary_tokens_used?: number | null;
  summary_cost_usd?: string | null;
  created_at: string;
  user: {
    full_name: string;
  };
  folder?: FolderType | null;
  tags?: Tag[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatDocument, setChatDocument] = useState<{ id: string; title: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFailedDocs, setShowFailedDocs] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, [selectedFolderId]);

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

  async function fetchDocuments() {
    try {
      let url = "/api/documents";
      if (selectedFolderId !== null) {
        url += `?folder_id=${selectedFolderId}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
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
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  }

  async function handleMoveToFolder(documentId: string, folderId: string | null) {
    try {
      const response = await fetch(`/api/documents/${documentId}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });

      if (!response.ok) throw new Error("Failed to move document");

      const folderName = folderId
        ? folders.find(f => f.id === folderId)?.name || "folder"
        : "root";

      toast.success(`Moved to ${folderName}`);
      fetchDocuments(); // Reload documents to reflect changes
    } catch (error) {
      console.error("Error moving document:", error);
      toast.error("Failed to move document");
    }
  }

  function handleDragStart(docId: string) {
    setDraggedDocId(docId);
  }

  function handleDragEnd() {
    setDraggedDocId(null);
    setDragOverFolderId(null);
  }

  function handleDragOver(e: React.DragEvent, folderId: string | null) {
    e.preventDefault();
    setDragOverFolderId(folderId);
  }

  function handleDragLeave() {
    setDragOverFolderId(null);
  }

  async function handleDrop(e: React.DragEvent, folderId: string | null) {
    e.preventDefault();
    if (!draggedDocId) return;

    await handleMoveToFolder(draggedDocId, folderId);
    setDraggedDocId(null);
    setDragOverFolderId(null);
  }

  function handleUploadComplete(files: UploadedFile[]) {
    toast.success(`${files.length} file(s) uploaded!`);
    fetchDocuments();
  }

  function handleCreateFolder() {
    setEditingFolder(null);
    setFolderModalOpen(true);
  }

  function handleEditFolder(folder: FolderType) {
    setEditingFolder(folder);
    setFolderModalOpen(true);
  }

  function handleFolderModalSuccess() {
    fetchDocuments();
    fetchFolders();
    setFolderRefreshKey(prev => prev + 1);
    setFolderModalOpen(false);
    setEditingFolder(null);
  }

  async function handleGenerateSummary(documentId: string) {
    setGeneratingSummary(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}/summary`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate summary");
      }

      const data = await response.json();

      if (data.cached) {
        toast.info("Summary already exists");
      } else {
        toast.success(`Summary generated! Cost: $${data.summary.cost_usd}`);
      }

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                summary: data.summary.summary,
                key_points: data.summary.key_points,
                document_type: data.summary.document_type,
                summary_generated_at: data.summary.generated_at,
                summary_tokens_used: data.summary.tokens_used,
                summary_cost_usd: data.summary.cost_usd,
              }
            : doc
        )
      );
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

  function handleSelectDocument(docId: string) {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }

  function handleSelectAll(selected: boolean) {
    if (selected) {
      setSelectedDocuments(successfulDocs.map((doc) => doc.id));
    } else {
      setSelectedDocuments([]);
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

    return true;
  });

  const successfulDocs = filteredDocuments.filter((doc) => doc.status !== "failed");
  const failedDocs = filteredDocuments.filter((doc) => doc.status === "failed");

  const documentTypes = Array.from(
    new Set(documents.map((doc) => doc.document_type).filter(Boolean))
  ).sort();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Enterprise Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Folders
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Folders List */}
        <div className="flex-1 overflow-auto py-2 px-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFolderId === null
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : dragOverFolderId === null && draggedDocId
                ? 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="All Documents"
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">All Documents</span>}
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-1 ${
                selectedFolderId === folder.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : dragOverFolderId === folder.id
                  ? 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={folder.name}
            >
              <FolderIcon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{folder.name}</span>}
            </button>
          ))}

          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              className="w-full justify-start gap-3 px-3 py-2 mt-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="font-medium">New Folder</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedFolderId
                  ? folders.find((f) => f.id === selectedFolderId)?.name || "Documents"
                  : "All Documents"}
              </h1>
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <span className="text-slate-500 dark:text-slate-400">
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                </span>
                {documents.filter(d => d.status === "processing").length > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                      {documents.filter(d => d.status === "processing").length} processing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-7 w-7 p-0 ${
                  viewMode === "grid"
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 w-7 p-0 ${
                  viewMode === "list"
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="font-medium">Filter</span>
              {filterType && (
                <span className="ml-2 px-1.5 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded font-medium">
                  1
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search & Upload Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select
              value={uploadFolderId || "root"}
              onValueChange={(value) => setUploadFolderId(value === "root" ? null : value)}
            >
              <SelectTrigger className="w-48 h-9 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Upload to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No folder)</SelectItem>
                {folders.filter(f => f.id && f.id.trim().length > 0).map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setCreateDocModalOpen(true)}
              className="h-9 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              New Document
            </Button>

            <div className="flex-1">
              <FileUpload onUploadComplete={handleUploadComplete} folderId={uploadFolderId} />
            </div>
          </div>
        </div>

        {/* Filters (Collapsible) */}
        {showFilters && (
          <div className="border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block uppercase tracking-wide">
                  Document Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType(null)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filterType === null
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
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
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {(searchQuery || filterType) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {filteredDocuments.length} of {documents.length} documents
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType(null);
                    }}
                    className="text-xs h-7 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Area */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto p-6">
            {isLoading ? (
              <DocumentCardSkeleton />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={selectedFolderId ? FolderIcon : Upload}
                title={selectedFolderId ? "No documents in this folder" : "No documents yet"}
                description={
                  selectedFolderId
                    ? "This folder is empty. Upload documents to get started."
                    : "Start building your knowledge base by uploading your first document."
                }
              />
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No documents found"
                description="No documents match your search or filter criteria."
                action={{
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setFilterType(null);
                  },
                }}
              />
            ) : (
              <>
                {selectedDocuments.length > 0 && (
                  <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {selectedDocuments.length} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 h-7"
                      onClick={() => {
                        if (confirm(`Delete ${selectedDocuments.length} documents?`)) {
                          selectedDocuments.forEach((id) => handleDelete(id));
                          setSelectedDocuments([]);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDocuments([])}
                      className="h-7 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {successfulDocs.length > 0 && (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                        {successfulDocs.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            doc={doc}
                            onDelete={handleDelete}
                            onGenerateSummary={handleGenerateSummary}
                            onOpenChat={handleOpenChat}
                            onOpenPreview={handleOpenPreview}
                            onTagsChange={fetchDocuments}
                            generatingSummary={generatingSummary}
                          />
                        ))}
                      </div>
                    ) : (
                      <DocumentTable
                        documents={successfulDocs}
                        folders={folders}
                        onDelete={handleDelete}
                        onGenerateSummary={handleGenerateSummary}
                        onOpenChat={handleOpenChat}
                        onOpenPreview={handleOpenPreview}
                        onTagsChange={fetchDocuments}
                        onMoveToFolder={handleMoveToFolder}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        generatingSummary={generatingSummary}
                        selectedDocuments={selectedDocuments}
                        onSelectDocument={handleSelectDocument}
                        onSelectAll={handleSelectAll}
                      />
                    )}
                  </>
                )}

                {failedDocs.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowFailedDocs(!showFailedDocs)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {failedDocs.length} failed upload{failedDocs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {showFailedDocs ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {showFailedDocs && (
                      <div className="mt-2 space-y-2">
                        {failedDocs.map((doc) => (
                          <div key={doc.id} className="px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {doc.title}
                                </h4>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  {doc.error_message || "Failed to process"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 ml-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSuccess={handleFolderModalSuccess}
        folder={editingFolder}
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
        onSuccess={fetchDocuments}
      />
    </div>
  );
}
