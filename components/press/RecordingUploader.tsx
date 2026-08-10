"use client";

import { useRef, useState } from "react";
import type { Upload as TusUpload } from "tus-js-client";
import { AlertCircle, CheckCircle2, FileVideo2, Loader2, Pause, RotateCcw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PRESS_ACCEPTED_MIME_TYPE_SET, PRESS_MAX_FILE_BYTES } from "@/lib/press/media";
import {
  createPressResumableUpload,
  isTusTransportUnavailable,
  startPressDirectUpload,
  startPressResumableUpload,
  type PressDirectUploadHandle,
} from "@/lib/press/resumable-upload";
import {
  createPressProject, createUploadIntent, finalizeAsset, getErrorMessage, refreshUploadToken,
  type PressUploadIntent,
} from "./api-client";
import type { PressProject } from "./types";

type UploadPhase = "idle" | "creating" | "reserving" | "uploading" | "paused" | "finalizing" | "complete" | "error";

interface UploadSession {
  project: PressProject;
  intent: PressUploadIntent | null;
  uploaded: boolean;
}

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

export function RecordingUploader({ onComplete, processingMessage }: { onComplete: (project: PressProject) => void; processingMessage?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<TusUpload | null>(null);
  const directUploadRef = useRef<PressDirectUploadHandle | null>(null);
  const sessionRef = useRef<UploadSession | null>(null);
  const cancellingRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rightsAttested, setRightsAttested] = useState(false);

  function selectFile(nextFile: File) {
    if (sessionRef.current) return;
    setError(null);
    setRightsAttested(false);
    setProgress(0);
    setStatus("");
    setPhase("idle");
    if (!PRESS_ACCEPTED_MIME_TYPE_SET.has(nextFile.type)) {
      setFile(null);
      setError("Choose an MP4, MOV, WebM, MP3, M4A, or WAV recording.");
      return;
    }
    if (nextFile.size > PRESS_MAX_FILE_BYTES) {
      setFile(null);
      setError("This recording is larger than the 512 MB pilot upload limit.");
      return;
    }
    setFile(nextFile);
  }

  async function finalizeUpload(session: UploadSession) {
    if (!session.intent) return;
    session.uploaded = true;
    setPhase("finalizing");
    setProgress(98);
    setStatus("Securing the upload and starting transcription…");
    try {
      await finalizeAsset(session.intent.asset.id);
      setProgress(100);
      setStatus("Upload complete");
      setPhase("complete");
      onComplete({ ...session.project, status: "processing" });
      uploadRef.current = null;
      sessionRef.current = null;
      setFile(null);
      setRightsAttested(false);
    } catch (finalizeError) {
      setPhase("error");
      setStatus("The file is uploaded, but processing has not started yet.");
      setError(getErrorMessage(finalizeError));
    }
  }

  async function startTransport(session: UploadSession, token: string) {
    if (!file || !session.intent) return;
    cancellingRef.current = false;
    setPhase("uploading");
    setStatus("Uploading the source recording…");
    const transportInput = {
      assetId: session.intent.asset.id,
      bucket: session.intent.upload.bucket,
      path: session.intent.upload.path,
      token,
      file,
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const transferred = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 95) : 0;
        setProgress(Math.min(95, Math.max(1, transferred)));
        setStatus(`Uploading ${formatBytes(bytesUploaded)} of ${formatBytes(bytesTotal)}…`);
      },
      onSuccess: () => {
        void finalizeUpload(session);
      },
      onError: (uploadError: Error) => {
        if (cancellingRef.current) return;
        setPhase("error");
        setStatus("Upload paused before completion.");
        setError(getErrorMessage(uploadError));
      },
    };
    const upload = createPressResumableUpload({
      ...transportInput,
      onError: (uploadError) => {
        if (cancellingRef.current) return;
        uploadRef.current = null;
        // The resumable service can be down independently of storage itself;
        // fall back to the plain signed-URL transport before surfacing an
        // error. The failure happens before any bytes move, so nothing is
        // lost by switching.
        if (isTusTransportUnavailable(uploadError)) {
          setStatus("Switching to the standard upload path…");
          try {
            directUploadRef.current = startPressDirectUpload(transportInput);
            return;
          } catch (directError) {
            transportInput.onError(directError instanceof Error ? directError : new Error(String(directError)));
            return;
          }
        }
        transportInput.onError(uploadError instanceof Error ? uploadError : new Error(String(uploadError)));
      },
    });
    uploadRef.current = upload;
    await startPressResumableUpload(upload);
  }

  async function upload() {
    const busy = ["creating", "reserving", "uploading", "finalizing"].includes(phase);
    if (!file || busy) return;
    if (!rightsAttested && !sessionRef.current) {
      setError("Confirm that you have the rights and consent required to process this recording.");
      return;
    }
    setError(null);

    try {
      let session = sessionRef.current;
      if (!session) {
        setPhase("creating");
        setProgress(2);
        setStatus("Creating the production record…");
        const project = await createPressProject(titleFromFile(file.name), rightsAttested);
        session = { project, intent: null, uploaded: false };
        sessionRef.current = session;
        onComplete(project);
      }

      if (!session.intent) {
        setPhase("reserving");
        setProgress(4);
        setStatus("Preparing a secure resumable upload…");
        session.intent = await createUploadIntent(session.project.id, file);
        onComplete({ ...session.project, status: "uploading" });
        await startTransport(session, session.intent.upload.token);
        return;
      }

      if (session.uploaded) {
        await finalizeUpload(session);
        return;
      }

      setPhase("reserving");
      setStatus("Refreshing the secure upload…");
      const refreshed = await refreshUploadToken(session.intent.asset.id);
      session.intent.upload = refreshed.upload;
      await startTransport(session, refreshed.upload.token);
    } catch (uploadError) {
      setPhase("error");
      setStatus(sessionRef.current ? "Upload paused before completion." : "The upload could not be started.");
      setError(getErrorMessage(uploadError));
    }
  }

  async function pauseUpload() {
    if (phase !== "uploading") return;
    if (uploadRef.current) {
      cancellingRef.current = true;
      await uploadRef.current.abort(false);
    } else if (directUploadRef.current) {
      cancellingRef.current = true;
      directUploadRef.current.abort();
      directUploadRef.current = null;
    } else {
      return;
    }
    setPhase("paused");
    setStatus("Upload paused. Continue when you are ready.");
    setError(null);
  }

  const busy = ["creating", "reserving", "uploading", "finalizing"].includes(phase);
  const selectionLocked = busy || Boolean(sessionRef.current);
  const canRetry = (phase === "paused" || phase === "error") && Boolean(sessionRef.current);
  const actionLabel = canRetry
    ? (sessionRef.current?.uploaded ? "Start processing" : "Resume upload")
    : phase === "finalizing"
      ? "Starting processing"
      : busy
        ? "Uploading"
        : "Start upload";

  return (
    <section id="new-recording" aria-labelledby="press-upload-title" className="scroll-mt-28 border border-black/10 bg-white p-5 sm:p-7 lg:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d91943]">Start a content pack</p>
          <h2 id="press-upload-title" className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#121214] sm:text-3xl">
            Bring one good recording.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60 sm:text-base">
            Add a video or audio file. You can leave after the upload—your source and production history will stay in this workspace.
          </p>
        </div>
        <span className="hidden h-12 w-12 place-items-center rounded-full bg-[#c7f34b] sm:grid" aria-hidden>
          <FileVideo2 className="h-5 w-5 text-black" />
        </span>
      </div>

      <div
        className={cn(
          "mt-6 rounded-md border border-dashed p-6 text-center transition-colors sm:p-8",
          dragging ? "border-[#1648d8] bg-[#edf2ff]" : "border-black/20 bg-[#f6f1e8]",
          !selectionLocked && "cursor-pointer hover:border-[#1648d8] hover:bg-[#f1f5ff]"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!selectionLocked) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped && !selectionLocked) selectFile(dropped);
        }}
        onClick={() => !selectionLocked && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !selectionLocked) inputRef.current?.click();
        }}
        role="button"
        tabIndex={selectionLocked ? -1 : 0}
        aria-disabled={selectionLocked}
        aria-label="Choose a source recording to upload"
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,.mp4,.mov,.webm,.mp3,.m4a,.wav"
          disabled={selectionLocked}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) selectFile(selected);
            event.target.value = "";
          }}
        />
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ff3b5c]">
          <Upload className="h-6 w-6 text-black" aria-hidden />
        </span>
        <p className="mt-4 text-base font-black text-[#121214]">Drop it here or choose a file</p>
        <p className="mt-1 text-xs text-black/60">Video or audio · MP4, MOV, WebM, MP3, M4A, WAV · up to 512 MB during the pilot</p>
      </div>

      {processingMessage && (
        <div className="mt-4 flex items-start gap-2 border border-[#f2c340] bg-[#fff8d7] p-4 text-sm leading-6 text-[#5d4900]" role="status">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <span><strong>You can still add your recording.</strong> {processingMessage}</span>
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
            {!selectionLocked && (
              <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => { setFile(null); setRightsAttested(false); }} aria-label="Remove selected recording">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            )}
            {phase === "uploading" && (
              <Button type="button" variant="outline" className="h-11 bg-white" onClick={() => void pauseUpload()}>
                <Pause className="mr-2 h-4 w-4" aria-hidden /> Pause
              </Button>
            )}
            <Button type="button" className="h-11 rounded-full bg-[#1648d8] px-5 text-white hover:bg-[#1039ad]" onClick={() => void upload()} disabled={busy || (!rightsAttested && !sessionRef.current)}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : canRetry ? <RotateCcw className="mr-2 h-4 w-4" aria-hidden /> : <Upload className="mr-2 h-4 w-4" aria-hidden />}
              {actionLabel}
            </Button>
          </div>
        </div>
      )}

      {file && phase === "idle" && (
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

      {file && phase !== "idle" && phase !== "complete" && (
        <div className="mt-4" role="status" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs text-zinc-600">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {phase === "complete" && progress === 100 && (
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
