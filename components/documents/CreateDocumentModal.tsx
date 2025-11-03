"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CreateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDocumentModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setCreating(true);

    try {
      const supabase = createClient();

      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to create a document");
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("Organization not found");
        return;
      }

      // Create the document as a text/html file
      const htmlBlob = new Blob([content || "<p>Start writing...</p>"], {
        type: "text/html",
      });
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`;

      // Upload to Supabase Storage
      const filePath = `${profile.organization_id}/${user.id}/${Date.now()}_${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, htmlBlob, {
          contentType: "text/html",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload document");
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          title: title.trim(),
          file_name: fileName,
          file_type: "text/html",
          file_size: htmlBlob.size,
          file_url: publicUrl,
          storage_path: filePath,
          document_type: "Document",
          status: "completed",
          visibility: "organization",
        })
        .select()
        .single();

      if (docError) {
        console.error("Document creation error:", docError);
        toast.error("Failed to create document record");
        return;
      }

      toast.success("Document created successfully!");

      // Reset form
      setTitle("");
      setContent("");
      onOpenChange(false);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating document:", error);
      toast.error(error.message || "Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Document
          </DialogTitle>
          <DialogDescription>
            Create a new document with rich text formatting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your document..."
              minHeight="300px"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Create Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
