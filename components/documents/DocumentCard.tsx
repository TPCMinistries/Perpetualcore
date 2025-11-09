"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Tag,
  X,
  Check,
} from "lucide-react";
import { TagSelector } from "./TagSelector";
import { MultiAssignmentSelector } from "./MultiAssignmentSelector";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Folder {
  id: string;
  name: string;
  color?: string;
}

interface KnowledgeSpace {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

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
  summary_tokens_used?: number | null;
  summary_cost_usd?: string | null;
  created_at: string;
  user: {
    full_name: string;
  };
  tags?: any[];
  projects?: Project[];
  folders?: Folder[];
  knowledge_spaces?: KnowledgeSpace[];
}

interface DocumentCardProps {
  doc: Document;
  onDelete: (id: string) => void;
  onGenerateSummary: (id: string) => void;
  onOpenChat: (doc: Document) => void;
  onOpenPreview: (doc: Document) => void;
  onTagsChange: () => void;
  generatingSummary: string | null;
}

export function DocumentCard({
  doc,
  onDelete,
  onGenerateSummary,
  onOpenChat,
  onOpenPreview,
  onTagsChange,
  generatingSummary,
}: DocumentCardProps) {
  const router = useRouter();
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingAutoTags, setLoadingAutoTags] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function getFileTypeIcon(fileType: string) {
    const iconProps = "h-14 w-14";
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleGenerateAutoTags() {
    setLoadingAutoTags(true);
    try {
      const response = await fetch(`/api/documents/${doc.id}/auto-tag`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate tag suggestions");
      }

      const data = await response.json();
      setSuggestedTags(data.suggested_tags || []);
      setShowSuggestions(true);
      toast.success(`Generated ${data.suggested_tags.length} tag suggestions`);
    } catch (error: any) {
      console.error("Auto-tag generation error:", error);
      toast.error(error.message || "Failed to generate tag suggestions");
    } finally {
      setLoadingAutoTags(false);
    }
  }

  async function handleApplySuggestedTag(tagName: string) {
    try {
      // First, create the tag
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
        // Tag might already exist, try to find it
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

      // Then, add it to the document
      const addResponse = await fetch(`/api/documents/${doc.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      });

      if (addResponse.ok) {
        toast.success(`Applied tag: ${tagName}`);
        // Remove from suggestions
        setSuggestedTags((prev) => prev.filter((t) => t !== tagName));
        // Refresh the document list
        onTagsChange();
      } else {
        const error = await addResponse.json();
        if (error.error?.includes("already added")) {
          toast.info("Tag already added to this document");
          setSuggestedTags((prev) => prev.filter((t) => t !== tagName));
        } else {
          throw new Error(error.error || "Failed to add tag");
        }
      }
    } catch (error: any) {
      console.error("Error applying suggested tag:", error);
      toast.error(error.message || "Failed to apply tag");
    }
  }

  function handleDismissSuggestion(tagName: string) {
    setSuggestedTags((prev) => prev.filter((t) => t !== tagName));
    if (suggestedTags.length === 1) {
      setShowSuggestions(false);
    }
  }

  function handleDismissAllSuggestions() {
    setSuggestedTags([]);
    setShowSuggestions(false);
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Magnetic tile ambient glow - multiple layers */}
      <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:via-indigo-500/15 group-hover:to-purple-500/10 rounded-[2rem] blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100" />
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 rounded-3xl blur-xl transition-all duration-500" />

      {/* Main card with enhanced depth and spacious layout */}
      <Card className="relative backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200/50 dark:border-slate-800/50 hover:border-blue-300/60 dark:hover:border-blue-600/40 transition-all duration-500 shadow-2xl shadow-slate-900/5 dark:shadow-black/30 hover:shadow-3xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 p-10 flex flex-col h-full rounded-3xl group-hover:scale-[1.02] group-hover:-translate-y-1">
        {/* Header with icon and title - Generous spacing */}
        <div className="flex items-start gap-6 mb-8">
          {/* File icon with glow - Much larger */}
          <div className="relative flex-shrink-0 group/icon">
            <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover/icon:from-blue-500/20 group-hover/icon:to-indigo-500/20 rounded-3xl blur-xl transition-all duration-300" />
            <div className="relative p-5 rounded-3xl bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl group-hover/icon:shadow-2xl group-hover/icon:scale-110 transition-all duration-300">
              {getFileTypeIcon(doc.file_type)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-snug">
              {doc.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-base text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2 backdrop-blur-xl bg-slate-100/50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl">
                <Calendar className="h-4 w-4" />
                {formatDate(doc.created_at)}
              </span>
              <span className="backdrop-blur-xl bg-slate-100/50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl">
                {formatFileSize(doc.file_size)}
              </span>
              {doc.metadata?.wordCount && (
                <span className="backdrop-blur-xl bg-slate-100/50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl">
                  {doc.metadata.wordCount.toLocaleString()} words
                </span>
              )}
            </div>
          </div>

          {/* Status badge - Enhanced */}
          {doc.status === "processing" && (
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur animate-pulse" />
              <span className="relative text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl font-semibold flex items-center gap-1.5 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Processing
              </span>
            </div>
          )}
          {doc.status === "completed" && doc.document_type && (
            <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl font-semibold backdrop-blur-xl">
              {doc.document_type}
            </span>
          )}
        </div>

        {/* AI Summary Section */}
        {doc.summary && (
          <div className="mb-4 pb-4 border-b border-border">
            <button
              onClick={() => setExpandedSummary(!expandedSummary)}
              className="w-full flex items-center justify-between text-left mb-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-foreground">
                  AI Summary
                </span>
              </div>
              {expandedSummary ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {expandedSummary && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  {doc.summary}
                </p>
                {doc.key_points && doc.key_points.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-foreground mb-1">
                      Key Points:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {doc.key_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Assignments: Projects, Folders, Spaces */}
        <div className="mb-4 space-y-3">
          {/* Projects */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Projects</div>
            <MultiAssignmentSelector
              documentId={doc.id}
              type="projects"
              selectedItems={doc.projects || []}
              onItemsChange={onTagsChange}
            />
          </div>

          {/* Folders */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Folders</div>
            <MultiAssignmentSelector
              documentId={doc.id}
              type="folders"
              selectedItems={doc.folders || []}
              onItemsChange={onTagsChange}
            />
          </div>

          {/* Knowledge Spaces */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Knowledge Spaces</div>
            <MultiAssignmentSelector
              documentId={doc.id}
              type="spaces"
              selectedItems={doc.knowledge_spaces || []}
              onItemsChange={onTagsChange}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Tags</div>
            <div className="flex items-center gap-2 flex-wrap">
              <TagSelector
                documentId={doc.id}
                selectedTags={doc.tags || []}
                onTagsChange={onTagsChange}
              />
              {!showSuggestions && doc.status === "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs backdrop-blur-xl bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  onClick={handleGenerateAutoTags}
                  disabled={loadingAutoTags}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {loadingAutoTags ? "Generating..." : "Auto-Tag"}
                </Button>
              )}
            </div>
          </div>

          {/* Tag Suggestions */}
          {showSuggestions && suggestedTags.length > 0 && (
            <div className="mt-3 p-3 rounded-lg backdrop-blur-xl bg-blue-500/5 border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    AI Suggested Tags
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleDismissAllSuggestions}
                >
                  Dismiss All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 text-xs pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={() => handleApplySuggestedTag(tag)}
                        className="hover:bg-green-500/20 rounded-full p-0.5 transition-colors"
                        title="Apply tag"
                      >
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </button>
                      <button
                        onClick={() => handleDismissSuggestion(tag)}
                        className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action - Always visible with enhanced design */}
        <div className="mt-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1 group/btn">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-0 group-hover/btn:opacity-50 blur transition-all duration-300" />
              <Button
                variant="default"
                size="sm"
                className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 font-semibold h-11 rounded-2xl"
                onClick={() => onOpenChat(doc)}
              >
                <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2.5} />
                Chat with Document
              </Button>
            </div>
          </div>

          {/* Secondary Actions - Show on hover with smooth animation */}
          {isHovered && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {!doc.summary && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 text-purple-600 dark:text-purple-400 font-semibold h-11 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => onGenerateSummary(doc.id)}
                  disabled={generatingSummary === doc.id}
                >
                  <Sparkles className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  {generatingSummary === doc.id
                    ? "Generating..."
                    : "AI Summary"}
                </Button>
              )}
              {doc.metadata?.isRichText ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenPreview(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(doc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
