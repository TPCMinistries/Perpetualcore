"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Clock,
  User,
  RotateCcw,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Version {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string;
  content_snapshot: any;
  changed_by_user_id: string;
  change_summary: string;
  changes_diff: any;
  content_length: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
}

interface VersionHistoryProps {
  documentId: string;
  onRestore?: (version: Version) => void;
}

export function VersionHistory({ documentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  async function fetchVersions() {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(version: Version) {
    if (!confirm(`Restore to version ${version.version_number}? This will create a new version.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/documents/${documentId}/versions/${version.id}/restore`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success(`Restored to version ${version.version_number}`);
        fetchVersions();
        onRestore?.(version);
      } else {
        toast.error("Failed to restore version");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("An error occurred while restoring");
    }
  }

  function handlePreview(version: Version) {
    setSelectedVersion(version);
    setShowPreview(true);
  }

  function getChangesBadge(version: Version, index: number) {
    if (index === versions.length - 1) {
      return <Badge variant="outline">Initial version</Badge>;
    }

    if (version.change_summary) {
      return <Badge variant="secondary">{version.change_summary}</Badge>;
    }

    const currentLength = version.content_length || 0;
    const previousLength = versions[index + 1]?.content_length || 0;
    const diff = currentLength - previousLength;

    if (diff > 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          +{diff} chars
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge variant="destructive">
          {diff} chars
        </Badge>
      );
    }

    return <Badge variant="outline">No changes</Badge>;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <Badge variant="secondary">
              {versions.length} {versions.length === 1 ? "version" : "versions"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions will appear as you edit</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* Version indicator */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      v{version.version_number}
                    </div>
                  </div>

                  {/* Version details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {version.title || "Untitled"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{version.user?.full_name || "Unknown"}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(version.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="mt-2">
                          {getChangesBadge(version, index)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(version)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {index !== 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(version)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Version {selectedVersion?.version_number} Preview
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.user?.full_name} •{" "}
              {selectedVersion &&
                formatDistanceToNow(new Date(selectedVersion.created_at), {
                  addSuffix: true,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="mt-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedVersion.title}
                </h3>
                {selectedVersion.change_summary && (
                  <Badge variant="secondary" className="mb-2">
                    {selectedVersion.change_summary}
                  </Badge>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap break-words font-mono text-sm">
                  {selectedVersion.content}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                {versions[0]?.id !== selectedVersion.id && (
                  <Button
                    onClick={() => {
                      handleRestore(selectedVersion);
                      setShowPreview(false);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore This Version
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
