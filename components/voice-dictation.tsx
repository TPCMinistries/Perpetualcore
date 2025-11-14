"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Mic,
  Square,
  RefreshCcw,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

type DictationState = "idle" | "recording" | "transcribing" | "ready";

interface VoiceDictationProps {
  onInsert: (text: string) => void;
  onClose?: () => void;
}

export function VoiceDictation({ onInsert, onClose }: VoiceDictationProps) {
  const [state, setState] = useState<DictationState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [supportsRecording, setSupportsRecording] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setSupportsRecording(false);
    }
  }, []);

  useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state]);

  const cleanup = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    chunksRef.current = [];
    setDuration(0);
  }, []);

  const startRecording = async () => {
    if (!supportsRecording) return;
    try {
      setError(null);
      setTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(blob);
        cleanup();
      };

      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      console.error("Unable to start recording:", err);
      setError("Could not access your microphone. Please check permissions.");
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setState("transcribing");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "dictation.webm");

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      setTranscript(data.text || "");
      setState("ready");
    } catch (err) {
      console.error("Transcription error:", err);
      setError("We couldn't understand that. Please try again.");
      setState("idle");
    }
  };

  const handleInsert = () => {
    const text = transcript.trim();
    if (!text) {
      setError("Transcript is empty.");
      return;
    }
    onInsert(text);
    setTranscript("");
    setState("idle");
    if (onClose) onClose();
  };

  const reset = () => {
    cleanup();
    setTranscript("");
    setError(null);
    setState("idle");
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [cleanup]);

  if (!supportsRecording) {
    return (
      <Card className="p-4 bg-orange-50 border border-orange-200 text-sm text-orange-900">
        Your browser doesn't support in-app recording. Please try the mobile app or switch to Chrome/Edge.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Dictation status
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {state === "idle" && "Tap record and start speaking"}
            {state === "recording" && "Listening... tap stop when you're done"}
            {state === "transcribing" && "Transcribing your audio"}
            {state === "ready" && "Review transcript before inserting"}
          </p>
        </div>
        {state === "recording" && (
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {duration}s
          </span>
        )}
      </div>

      <div
        className={cn(
          "rounded-2xl border border-dashed p-6 text-center",
          state === "recording"
            ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30"
            : "border-slate-200 dark:border-slate-700"
        )}
      >
        {state === "recording" ? (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="h-12 px-6"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop recording
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            className="h-12 px-6"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start recording
          </Button>
        )}

        {state === "transcribing" && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Transcript
          </p>
          {state === "ready" && (
            <span className="inline-flex items-center text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5 mr-1" />
              Ready
            </span>
          )}
        </div>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your transcription will appear here"
          rows={5}
          className="resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-slate-600 dark:text-slate-300"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose?.()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={state !== "ready" || !transcript.trim()}
            >
              Insert into chat
            </Button>
          </div>
      </div>
    </div>
  );
}
