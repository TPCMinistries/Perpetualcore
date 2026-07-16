"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileVideo2, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createPressProject, createUploadIntent, finalizeAsset, getErrorMessage, updatePressProject } from "./api-client";
import type { PressProject } from "./types";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
]);

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}

function titleFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled recording";
}

export function RecordingUploader({ onComplete, disabledMessage }: { onComplete: (project: PressProject) => void; disabledMessage?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rightsAttested, setRightsAttested] = useState(false);

  function selectFile(nextFile: File) {
    setError(null);
    setRightsAttested(false);
    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setFile(null);
      setError("Choose an MP4, MOV, WebM, MP3, M4A, or WAV recording.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("This recording is larger than the 2 GB upload limit.");
      return;
    }
    setFile(nextFile);
  }

  async function upload() {
    if (!file || uploading) return;
    if (!rightsAttested) {
      setError("Confirm that you have the rights and consent required to process this recording.");
      return;
    }
    setUploading(true);
    setError(null);

    let createdProject: PressProject | null = null;
    try {
      setProgress(10);
      setStatus("Creating the production record…");
      const project = await createPressProject(titleFromFile(file.name), rightsAttested);
      createdProject = project;

      setProgress(25);
      setStatus("Preparing a secure upload…");
      const intent = await createUploadIntent(project.id, file);

      setProgress(45);
      setStatus("Uploading the source recording…");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(intent.upload.bucket)
        .uploadToSignedUrl(intent.upload.path, intent.upload.token, file, {
          contentType: file.type,
        });
      if (uploadError) throw uploadError;

      setProgress(85);
      setStatus("Starting transcription…");
      await finalizeAsset(intent.asset.id);

      setProgress(100);
      setStatus("Upload complete");
      onComplete({ ...project, status: "processing" });
      setFile(null);
      setRightsAttested(false);
    } catch (uploadError) {
      if (createdProject) {
        try {
          const failedProject = await updatePressProject(createdProject.id, { status: "failed" });
          onComplete(failedProject);
        } catch {
          // Preserve the original upload error; the incomplete project remains recoverable by an operator.
        }
      }
      setProgress(0);
      setStatus("");
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-labelledby="press-upload-title" className="border border-zinc-300 bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">New source</p>
          <h2 id="press-upload-title" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            Upload a recording
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Add one long-form video or audio file. Press will preserve the source and begin transcription after upload.
          </p>
        </div>
        <FileVideo2 className="hidden h-6 w-6 text-zinc-400 sm:block" aria-hidden />
      </div>

      <div
        className={cn(
          "mt-6 rounded-md border border-dashed p-6 text-center transition-colors sm:p-8",
          dragging ? "border-zinc-950 bg-zinc-100" : "border-zinc-300 bg-zinc-50",
          !uploading && !disabledMessage && "cursor-pointer hover:border-zinc-500",
          disabledMessage && "cursor-not-allowed opacity-60"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!uploading && !disabledMessage) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped && !uploading && !disabledMessage) selectFile(dropped);
        }}
        onClick={() => !uploading && !disabledMessage && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !uploading && !disabledMessage) inputRef.current?.click();
        }}
        role="button"
        tabIndex={uploading || disabledMessage ? -1 : 0}
        aria-disabled={Boolean(uploading || disabledMessage)}
        aria-label="Choose a source recording to upload"
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,.mp4,.mov,.webm,.mp3,.m4a,.wav"
          disabled={uploading || Boolean(disabledMessage)}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) selectFile(selected);
            event.target.value = "";
          }}
        />
        <Upload className="mx-auto h-8 w-8 text-zinc-500" aria-hidden />
        <p className="mt-3 text-sm font-medium text-zinc-900">Drop a recording here or choose a file</p>
        <p className="mt-1 text-xs text-zinc-500">MP4, MOV, WebM, MP3, M4A, or WAV · up to 2 GB</p>
      </div>

      {disabledMessage && (
        <div className="mt-4 flex items-start gap-2 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="status">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <span><strong>Uploads are paused.</strong> {disabledMessage}</span>
        </div>
      )}

      {file && (
        <div className="mt-4 flex flex-col gap-4 border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <FileVideo2 className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-950">{file.name}</p>
              <p className="text-xs text-zinc-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!uploading && (
              <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => { setFile(null); setRightsAttested(false); }} aria-label="Remove selected recording">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            )}
            <Button type="button" className="h-11 rounded-md bg-zinc-950 px-5 text-white hover:bg-zinc-800" onClick={upload} disabled={uploading || !rightsAttested}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Upload className="mr-2 h-4 w-4" aria-hidden />}
              {uploading ? "Uploading" : "Start upload"}
            </Button>
          </div>
        </div>
      )}

      {file && !uploading && (
        <div className="mt-4 flex items-start gap-3 border border-zinc-300 bg-white p-4">
          <Checkbox
            id="press-rights-attestation"
            checked={rightsAttested}
            onCheckedChange={(checked) => {
              setRightsAttested(checked === true);
              if (checked === true) setError(null);
            }}
            aria-describedby="press-rights-description"
          />
          <div className="space-y-1">
            <Label htmlFor="press-rights-attestation" className="cursor-pointer text-sm font-medium leading-5 text-zinc-950">
              I confirm that I own this recording or have permission to process it.
            </Label>
            <p id="press-rights-description" className="text-xs leading-5 text-zinc-500">
              This includes the consent and usage rights required for every person whose image or voice appears in the source.
            </p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4" role="status" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs text-zinc-600">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {!uploading && progress === 100 && (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Upload complete. Transcription has started.
        </p>
      )}
      {error && (
        <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
