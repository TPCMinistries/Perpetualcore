"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: Record<string, string[]>;
  folderId?: string | null;
  variant?: "dropzone" | "button"; // button variant for use in headers/toolbars
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "completed" | "error";
  progress: number;
  error?: string;
}

export function FileUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "text/markdown": [".md"],
    "text/csv": [".csv"],
  },
  folderId = null,
  variant = "dropzone",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      // Create file entries with uploading status
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload files
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileId = newFiles[i].id;

        try {
          const formData = new FormData();
          formData.append("file", file);
          if (folderId) {
            formData.append("folder_id", folderId);
          }

          // Simulate upload progress
          const uploadInterval = setInterval(() => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId && f.progress < 90
                  ? { ...f, progress: f.progress + 10 }
                  : f
              )
            );
          }, 200);

          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          clearInterval(uploadInterval);

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const data = await response.json();

          setFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === fileId
                ? { ...f, status: "completed", progress: 100, id: data.id }
                : f
            );

            // Call callback after ALL uploads are complete
            const allComplete = updated.every(f => f.status === "completed" || f.status === "error");
            if (allComplete) {
              setIsUploading(false);
              if (onUploadComplete) {
                const completedFiles = updated.filter(f => f.status === "completed");
                if (completedFiles.length > 0) {
                  onUploadComplete(completedFiles);
                }
              }
              // Clear files after short delay for button variant
              if (variant === "button") {
                setTimeout(() => setFiles([]), 1500);
              }
            }

            return updated;
          });
        } catch (error) {
          setFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "error" as const,
                    progress: 0,
                    error: "Upload failed. Please try again.",
                  }
                : f
            );

            // Check if all uploads complete (including errors)
            const allComplete = updated.every(f => f.status === "completed" || f.status === "error");
            if (allComplete) {
              setIsUploading(false);
            }

            return updated;
          });
        }
      }
    },
    [files, onUploadComplete, folderId, variant]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes,
    noClick: variant === "button", // Disable auto-click for button variant
    noKeyboard: variant === "button", // Disable auto-keyboard for button variant
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Button variant - compact button for headers/toolbars
  if (variant === "button") {
    return (
      <div className="relative">
        <input {...getInputProps()} />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={isUploading}
          onClick={open}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    );
  }

  // Dropzone variant - full drag & drop area
  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload
            className={`h-10 w-10 ${
              isDragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <div>
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, TXT, MD, CSV (max {formatFileSize(maxSize)} per file)
            </p>
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.status === "uploading" && (
                    <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  {file.status === "error" && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {file.status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
