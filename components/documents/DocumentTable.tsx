"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Trash2,
  Calendar,
  Edit3,
  FolderIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Eye,
  FileType,
  File,
  Sheet,
  Tag as TagIcon,
  X,
  Check,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { TagSelector } from "./TagSelector";
import { toast } from "sonner";

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
  folder?: any | null;
  tags?: any[];
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface DocumentTableProps {
  documents: Document[];
  folders?: Folder[];
  onDelete: (id: string) => void;
  onGenerateSummary: (id: string) => void;
  onOpenChat: (doc: Document) => void;
  onOpenPreview: (doc: Document) => void;
  onTagsChange: () => void;
  onMoveToFolder?: (documentId: string, folderId: string | null) => void;
  onDragStart?: (docId: string) => void;
  onDragEnd?: () => void;
  generatingSummary: string | null;
  selectedDocuments?: string[];
  onSelectDocument?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
}

const getTagColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
    red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800",
    purple: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
    pink: "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800",
    orange: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
    gray: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-800",
  };
  return colors[color] || colors.gray;
};

export function DocumentTable({
  documents,
  folders = [],
  onDelete,
  onGenerateSummary,
  onOpenChat,
  onOpenPreview,
  onTagsChange,
  onMoveToFolder,
  onDragStart,
  onDragEnd,
  generatingSummary,
  selectedDocuments = [],
  onSelectDocument,
  onSelectAll,
}: DocumentTableProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [suggestedTags, setSuggestedTags] = useState<Record<string, string[]>>({});
  const [loadingAutoTags, setLoadingAutoTags] = useState<string | null>(null);

  function getFileTypeIcon(fileType: string) {
    const iconProps = "h-5 w-5";
    if (fileType.includes("pdf"))
      return <FileType className={`${iconProps} text-red-500`} strokeWidth={1.5} />;
    if (fileType.includes("word"))
      return <FileText className={`${iconProps} text-blue-500`} strokeWidth={1.5} />;
    if (fileType.includes("text") || fileType.includes("plain"))
      return <File className={`${iconProps} text-gray-500`} strokeWidth={1.5} />;
    if (fileType.includes("csv") || fileType.includes("sheet"))
      return <Sheet className={`${iconProps} text-green-500`} strokeWidth={1.5} />;
    if (fileType.includes("markdown"))
      return <FileText className={`${iconProps} text-purple-500`} strokeWidth={1.5} />;
    return <File className={`${iconProps} text-gray-400`} strokeWidth={1.5} />;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${Math.floor(diffInHours)}h ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  function toggleRow(docId: string) {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  }

  async function handleGenerateAutoTags(docId: string) {
    setLoadingAutoTags(docId);
    try {
      const response = await fetch(`/api/documents/${docId}/auto-tag`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate tag suggestions");
      }

      const data = await response.json();
      setSuggestedTags((prev) => ({
        ...prev,
        [docId]: data.suggested_tags || [],
      }));
      toast.success(`Generated ${data.suggested_tags.length} tag suggestions`);
    } catch (error: any) {
      console.error("Auto-tag generation error:", error);
      toast.error(error.message || "Failed to generate tag suggestions");
    } finally {
      setLoadingAutoTags(null);
    }
  }

  async function handleApplySuggestedTag(docId: string, tagName: string) {
    try {
      const createResponse = await fetch("/api/documents/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName.trim(), color: "blue" }),
      });

      let tagId: string;

      if (createResponse.ok) {
        const { tag } = await createResponse.json();
        tagId = tag.id;
      } else {
        const tagsResponse = await fetch("/api/documents/tags");
        if (tagsResponse.ok) {
          const { tags } = await tagsResponse.json();
          const existingTag = tags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            throw new Error("Failed to create or find tag");
          }
        } else {
          throw new Error("Failed to create tag");
        }
      }

      const addResponse = await fetch(`/api/documents/${docId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      });

      if (addResponse.ok) {
        toast.success(`Applied tag: ${tagName}`);
        setSuggestedTags((prev) => ({
          ...prev,
          [docId]: (prev[docId] || []).filter((t) => t !== tagName),
        }));
        onTagsChange();
      } else {
        const error = await addResponse.json();
        if (error.error?.includes("already added")) {
          toast.info("Tag already added to this document");
          setSuggestedTags((prev) => ({
            ...prev,
            [docId]: (prev[docId] || []).filter((t) => t !== tagName),
          }));
        } else {
          throw new Error(error.error || "Failed to add tag");
        }
      }
    } catch (error: any) {
      console.error("Error applying suggested tag:", error);
      toast.error(error.message || "Failed to apply tag");
    }
  }

  const allSelected = documents.length > 0 && selectedDocuments.length === documents.length;
  const someSelected = selectedDocuments.length > 0 && selectedDocuments.length < documents.length;

  return (
    <div className="backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl shadow-slate-900/5 dark:shadow-black/30 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] gap-4 items-center px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/80 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {onSelectAll && (
          <div className="flex items-center">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </div>
        )}
        <div>Document</div>
        <div className="text-center">Type</div>
        <div className="text-center">Size</div>
        <div className="text-center">Date</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
        {documents.map((doc) => {
          const isExpanded = expandedRows.has(doc.id);
          const docSuggestedTags = suggestedTags[doc.id] || [];
          const isSelected = selectedDocuments.includes(doc.id);

          return (
            <div
              key={doc.id}
              draggable={!!onDragStart}
              onDragStart={() => onDragStart?.(doc.id)}
              onDragEnd={() => onDragEnd?.()}
              className={`transition-all duration-200 ${
                isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
              } ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Main Row */}
              <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] gap-4 items-center px-6 py-4">
                {onSelectDocument && (
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectDocument(doc.id)}
                    />
                  </div>
                )}

                {/* Document Info */}
                <div
                  className="flex items-center gap-4 min-w-0 cursor-pointer group"
                  onClick={() => toggleRow(doc.id)}
                >
                  <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 group-hover:scale-110 transition-transform">
                    {getFileTypeIcon(doc.file_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {doc.title}
                      </h3>
                      {doc.status === "processing" && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-md font-medium">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Processing
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.folder && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                          <FolderIcon className="h-3 w-3" />
                          {doc.folder.name}
                        </span>
                      )}
                      {/* Display tags inline - show first 2, then +N more */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {doc.tags.slice(0, 2).map((tag: any) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className={getTagColor(tag.color) + " text-xs px-1.5 py-0 h-5 border"}
                            >
                              <TagIcon className="h-2.5 w-2.5 mr-0.5" />
                              {tag.name}
                            </Badge>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              +{doc.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      {doc.metadata?.wordCount && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.metadata.wordCount.toLocaleString()} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div className="text-center">
                  {doc.document_type ? (
                    <span className="inline-flex items-center text-xs px-2.5 py-1 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-lg font-medium">
                      {doc.document_type}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>

                {/* Size */}
                <div className="text-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {formatFileSize(doc.file_size)}
                  </span>
                </div>

                {/* Date */}
                <div className="text-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(doc.created_at)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenChat(doc)}
                    className="h-8 px-3 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Chat
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!doc.summary && (
                        <DropdownMenuItem
                          onClick={() => onGenerateSummary(doc.id)}
                          disabled={generatingSummary === doc.id}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {generatingSummary === doc.id ? "Generating..." : "AI Summary"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onOpenPreview(doc)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      {doc.metadata?.isRichText && (
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/documents/${doc.id}`)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {doc.file_url && (
                        <DropdownMenuItem onClick={() => window.open(doc.file_url, "_blank")}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {onMoveToFolder && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderIcon className="h-4 w-4 mr-2" />
                            Move to Folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => onMoveToFolder(doc.id, null)}
                            >
                              Root (No folder)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {folders.map((folder) => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => onMoveToFolder(doc.id, folder.id)}
                              >
                                <FolderIcon className="h-4 w-4 mr-2" />
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(doc.id)}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/40 dark:border-slate-800/40 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tags</span>
                      {doc.status === "completed" && !docSuggestedTags.length && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => handleGenerateAutoTags(doc.id)}
                          disabled={loadingAutoTags === doc.id}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {loadingAutoTags === doc.id ? "Generating..." : "Auto-Tag"}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TagSelector
                        documentId={doc.id}
                        selectedTags={doc.tags || []}
                        onTagsChange={onTagsChange}
                      />
                      {docSuggestedTags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {docSuggestedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 text-xs pl-2 pr-1 py-1 flex items-center gap-1"
                            >
                              <TagIcon className="h-3 w-3" />
                              <span>{tag}</span>
                              <div className="flex items-center gap-0.5 ml-1">
                                <button
                                  onClick={() => handleApplySuggestedTag(doc.id, tag)}
                                  className="hover:bg-green-500/20 rounded-full p-0.5 transition-colors"
                                  title="Apply tag"
                                >
                                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSuggestedTags((prev) => ({
                                      ...prev,
                                      [doc.id]: (prev[doc.id] || []).filter((t) => t !== tag),
                                    }));
                                  }}
                                  className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                                  title="Dismiss"
                                >
                                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">AI Summary</span>
                      {!doc.summary && doc.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 ml-auto"
                          onClick={() => onGenerateSummary(doc.id)}
                          disabled={generatingSummary === doc.id}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingSummary === doc.id ? "Generating..." : "Generate Summary"}
                        </Button>
                      )}
                    </div>
                    {doc.summary ? (
                      <>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {doc.summary}
                        </p>
                        {doc.key_points && doc.key_points.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Key Points:
                            </p>
                            <ul className="space-y-1">
                              {doc.key_points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        No summary generated yet. Click the button above to generate one.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
