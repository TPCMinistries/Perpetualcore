"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  FileText,
  Calendar,
  User,
  Download,
  Trash2,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/documents/RichTextEditor";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { sanitizeHtmlWithSafeLinks } from "@/lib/sanitize";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  content_html?: string;
  content_text?: string;
  metadata: {
    wordCount: number;
    charCount: number;
    isRichText?: boolean;
  };
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export default function DocumentViewPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;

    const response = await fetch(`/api/documents/text/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      throw new Error("Failed to save");
    }

    const data = await response.json();
    setDocument(data.document);
  }, [documentId, title, content]);

  const { isDirty, isSaving, lastSavedAt, setDirty, triggerSave } = useAutoSave({
    onSave: handleAutoSave,
    delay: 3000, // 3 seconds
    enabled: editing,
  });

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/text/${documentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const data = await response.json();
      setDocument(data.document);
      setTitle(data.document.title);
      setContent(data.document.content_html || "");
    } catch (error) {
      console.error("Error fetching document:", error);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!content.trim()) {
      toast.error("Document content cannot be empty");
      return;
    }

    try {
      await triggerSave();
      setEditing(false);
      toast.success("Document updated successfully");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setDirty(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setDirty(true);
  };

  const handleCancelEdit = () => {
    if (document) {
      setTitle(document.title);
      setContent(document.content_html || "");
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted");
      router.push("/dashboard/documents");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading document...</div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Document not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/documents")}
            >
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTextDocument = document.metadata.isRichText;

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/documents")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {editing ? "Edit Document" : "View Document"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                {/* Auto-save status indicator */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isDirty ? (
                    <>
                      <CloudOff className="h-4 w-4" />
                      Unsaved changes
                    </>
                  ) : lastSavedAt ? (
                    <>
                      <Cloud className="h-4 w-4 text-green-500" />
                      Saved
                    </>
                  ) : null}
                </div>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save & Close"}
                </Button>
              </>
            ) : (
              <>
                {isTextDocument && (
                  <Button onClick={() => setEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(document.created_at)}
          </span>
          {document.updated_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Updated {formatDate(document.updated_at)}
            </span>
          )}
          <span>{document.metadata.wordCount} words</span>
          <span>{document.metadata.charCount} characters</span>
          <span>{formatFileSize(document.file_size)}</span>
        </div>

        {/* Title */}
        {editing ? (
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-medium h-12"
            />
          </div>
        ) : (
          <h2 className="text-3xl font-bold">{document.title}</h2>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="mb-6">
          <Label className="mb-2 block">Content</Label>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            minHeight="500px"
          />
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            {isTextDocument ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlWithSafeLinks(document.content_html || "") }}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  This is an uploaded file. Preview not available.
                </p>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
