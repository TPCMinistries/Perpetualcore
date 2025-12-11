"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/documents/RichTextEditor";
import { toast } from "sonner";

const DRAFT_KEY = "document_draft";

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const draftTimeoutRef = useRef<NodeJS.Timeout>();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const { title: draftTitle, content: draftContent, savedAt } = JSON.parse(savedDraft);
        if (draftTitle || draftContent) {
          setTitle(draftTitle || "");
          setContent(draftContent || "");
          setLastSavedAt(new Date(savedAt));
          toast.info("Draft restored from previous session");
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  // Auto-save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!title && !content) return;

    setDraftSaving(true);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      title,
      content,
      savedAt: new Date().toISOString(),
    }));
    setLastSavedAt(new Date());
    setIsDirty(false);
    setDraftSaving(false);
  }, [title, content]);

  // Debounced draft save
  const handleChange = useCallback((newTitle?: string, newContent?: string) => {
    if (newTitle !== undefined) setTitle(newTitle);
    if (newContent !== undefined) setContent(newContent);
    setIsDirty(true);

    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }

    draftTimeoutRef.current = setTimeout(saveDraft, 2000);
  }, [saveDraft]);

  // Cleanup and warn on leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && (title || content)) {
        saveDraft();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [isDirty, title, content, saveDraft]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!content.trim()) {
      toast.error("Document content cannot be empty");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/documents/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const data = await response.json();

      // Clear the draft after successful save
      localStorage.removeItem(DRAFT_KEY);

      toast.success("Document created successfully");
      router.push(`/dashboard/documents/${data.document.id}`);
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document");
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setContent("");
    setLastSavedAt(null);
    setIsDirty(false);
    toast.success("Draft cleared");
  };

  const wordCount = content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.replace(/<[^>]*>/g, "").length;

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
                New Document
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new document with rich text formatting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Draft status indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {draftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving draft...
                </>
              ) : isDirty ? (
                <>
                  <CloudOff className="h-4 w-4" />
                  Unsaved
                </>
              ) : lastSavedAt ? (
                <>
                  <Cloud className="h-4 w-4 text-green-500" />
                  Draft saved
                </>
              ) : null}
            </div>
            {(title || content) && (
              <Button variant="ghost" size="sm" onClick={clearDraft}>
                Clear Draft
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Document"}
            </Button>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleChange(e.target.value, undefined)}
            placeholder="Enter document title..."
            className="text-lg font-medium h-12"
            autoFocus
          />
        </div>
      </div>

      {/* Editor */}
      <div className="mb-6">
        <Label className="mb-2 block">Content</Label>
        <RichTextEditor
          value={content}
          onChange={(newContent) => handleChange(undefined, newContent)}
          placeholder="Start writing your document..."
          minHeight="500px"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-6">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <span className="text-xs">
          Draft auto-saves every 2 seconds
        </span>
      </div>
    </div>
  );
}
