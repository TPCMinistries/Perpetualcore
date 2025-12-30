"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, FileText, Loader2, Sparkles, MessageSquare,
  CheckCircle, RefreshCw, FolderPlus, Link2, Calendar,
  FileIcon, Hash, Briefcase, Users, Brain
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size?: number;
  file_url?: string;
  status?: "processing" | "completed" | "failed";
  content?: string;
  summary?: string | null;
  key_points?: string[] | null;
  document_type?: string | null;
  summary_generated_at?: string | null;
  created_at?: string;
  metadata?: {
    wordCount?: number;
    charCount?: number;
  };
  projects?: Array<{ id: string; name: string; color?: string }>;
  folders?: Array<{ id: string; name: string }>;
  knowledge_spaces?: Array<{ id: string; name: string; emoji?: string }>;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onChat?: (doc: Document) => void;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  onChat,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [docData, setDocData] = useState<Document | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const supabase = createClient();

  // Fetch full document data when document changes
  useEffect(() => {
    async function fetchDocumentData() {
      if (!document?.id) {
        setDocData(null);
        setSignedUrl(null);
        return;
      }

      setLoading(true);

      try {
        // Fetch full document data from database
        const { data, error } = await supabase
          .from("documents")
          .select(`
            *,
            document_projects (
              projects (id, name, color)
            ),
            document_folders (
              folders (id, name)
            ),
            document_knowledge_spaces (
              knowledge_spaces (id, name, emoji)
            )
          `)
          .eq("id", document.id)
          .single();

        if (error) {
          console.error("Error fetching document:", error);
          setDocData(document);
        } else {
          // Transform junction table data
          const transformedData = {
            ...data,
            projects: (data.document_projects || []).map((link: any) => link.projects).filter(Boolean),
            folders: (data.document_folders || []).map((link: any) => link.folders).filter(Boolean),
            knowledge_spaces: (data.document_knowledge_spaces || []).map((link: any) => link.knowledge_spaces).filter(Boolean),
          };
          setDocData(transformedData);
        }

        // Generate signed URL for download
        if (document.file_url) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.file_url, 3600);

          if (!urlError && urlData) {
            setSignedUrl(urlData.signedUrl);
          }
        }
      } catch (err) {
        console.error("Error in fetchDocumentData:", err);
        setDocData(document);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchDocumentData();
    }
  }, [document?.id, open]);

  async function handleGenerateSummary() {
    if (!document?.id) return;

    setGeneratingSummary(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/summary`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const result = await response.json();

      // Update local state with new summary
      setDocData(prev => prev ? {
        ...prev,
        summary: result.summary,
        key_points: result.key_points,
        document_type: result.document_type,
        summary_generated_at: new Date().toISOString(),
      } : null);

      toast.success("AI Summary generated successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  }

  function handleDownload() {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  }

  function handleChat() {
    if (docData && onChat) {
      onChat(docData);
      onOpenChange(false);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (!document) return null;

  const doc = docData || document;
  const hasSummary = !!doc.summary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 backdrop-blur-2xl bg-card/95 border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-foreground block">{doc.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  {doc.document_type && (
                    <Badge variant="secondary" className="text-xs">
                      {doc.document_type}
                    </Badge>
                  )}
                  {doc.status === "processing" && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Processing
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleChat}
                disabled={!onChat || doc.status === "processing"}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!signedUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b border-border">
              <TabsList className="h-12 bg-transparent gap-4">
                <TabsTrigger value="overview" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30">
                  Content
                </TabsTrigger>
                <TabsTrigger value="connections" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30">
                  Connections
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Overview Tab */}
              <TabsContent value="overview" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* AI Summary Section */}
                    <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                          <h3 className="font-semibold text-lg">AI Summary</h3>
                        </div>
                        <Button
                          variant={hasSummary ? "outline" : "default"}
                          size="sm"
                          onClick={handleGenerateSummary}
                          disabled={generatingSummary || doc.status === "processing"}
                          className={cn(
                            !hasSummary && "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                          )}
                        >
                          {generatingSummary ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : hasSummary ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Summary
                            </>
                          )}
                        </Button>
                      </div>

                      {hasSummary ? (
                        <div className="space-y-4">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {doc.summary}
                          </p>

                          {doc.key_points && doc.key_points.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                Key Points
                              </h4>
                              <ul className="space-y-2">
                                {doc.key_points.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                      {point}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {doc.summary_generated_at && (
                            <p className="text-xs text-slate-500 mt-4">
                              Generated {formatDate(doc.summary_generated_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Brain className="h-12 w-12 text-violet-300 dark:text-violet-700 mx-auto mb-3" />
                          <p className="text-slate-500 dark:text-slate-400">
                            No AI summary yet. Click "Generate Summary" to create one.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Document Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <FileIcon className="h-4 w-4" />
                          File Size
                        </div>
                        <p className="font-medium">{formatFileSize(doc.file_size)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Hash className="h-4 w-4" />
                          Word Count
                        </div>
                        <p className="font-medium">
                          {doc.metadata?.wordCount?.toLocaleString() || "N/A"} words
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Uploaded
                        </div>
                        <p className="font-medium">{formatDate(doc.created_at)}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <FileText className="h-4 w-4" />
                          File Type
                        </div>
                        <p className="font-medium">{doc.file_type || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {doc.content ? (
                      <div className="bg-background rounded-lg p-8 max-w-4xl mx-auto shadow-sm border border-border">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                            {doc.content}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                          <p className="text-muted-foreground mb-2">No text content available</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.status === "processing"
                              ? "Document is still processing..."
                              : "Content couldn't be extracted from this document."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Projects */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">Linked Projects</h3>
                      </div>
                      {doc.projects && doc.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {doc.projects.map((project) => (
                            <Badge
                              key={project.id}
                              variant="secondary"
                              style={{ backgroundColor: project.color ? `${project.color}20` : undefined }}
                            >
                              {project.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not linked to any projects
                        </p>
                      )}
                    </div>

                    {/* Knowledge Spaces */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium">Knowledge Spaces</h3>
                      </div>
                      {doc.knowledge_spaces && doc.knowledge_spaces.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {doc.knowledge_spaces.map((space) => (
                            <Badge key={space.id} variant="secondary">
                              {space.emoji} {space.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not in any knowledge spaces
                        </p>
                      )}
                    </div>

                    {/* Folders */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderPlus className="h-5 w-5 text-amber-500" />
                        <h3 className="font-medium">Folders</h3>
                      </div>
                      {doc.folders && doc.folders.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {doc.folders.map((folder) => (
                            <Badge key={folder.id} variant="secondary">
                              {folder.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Not in any folders
                        </p>
                      )}
                    </div>

                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Link this document to projects, teams, and spaces from the document list
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
