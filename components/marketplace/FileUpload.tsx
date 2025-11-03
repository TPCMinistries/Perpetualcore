'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  url: string;
  publicId: string;
  format: string;
  size: number;
  type: 'config' | 'image';
  name: string;
}

interface FileUploadProps {
  type: 'config' | 'image';
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (file: UploadedFile) => void;
  onRemove: (publicId: string) => void;
  currentFile?: UploadedFile;
  multiple?: boolean;
}

export default function FileUpload({
  type,
  label,
  description,
  accept,
  maxSize = 10,
  onUpload,
  onRemove,
  currentFile,
  multiple = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Take first file (can extend for multiple later)
    setError(null);

    // Validate size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    try {
      setUploading(true);
      setProgress(20);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      setProgress(40);

      const response = await fetch('/api/marketplace/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);

      onUpload({
        ...data.file,
        name: file.name,
      });

      // Reset progress after short delay
      setTimeout(() => {
        setProgress(0);
        setUploading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async (publicId: string) => {
    try {
      const response = await fetch('/api/marketplace/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      onRemove(publicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {currentFile ? (
        // Show uploaded file
        <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/50">
          <div className="flex items-center gap-3">
            {type === 'image' ? (
              <div className="relative w-16 h-16 rounded overflow-hidden">
                <img
                  src={currentFile.url}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <File className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentFile.size)} • {currentFile.format?.toUpperCase()}
              </p>
            </div>
            <Check className="w-5 h-5 text-green-500 ml-2" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(currentFile.publicId)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        // Show upload area
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />

          <div className="flex flex-col items-center gap-2">
            {type === 'image' ? (
              <Image className="w-10 h-10 text-muted-foreground" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxSize}MB • {accept || 'All files'}
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
