"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  Search,
  Loader2,
  Sparkles,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Square,
  Headphones,
} from "lucide-react";

interface VoiceMemo {
  id: string;
  title: string | null;
  audio_url: string | null;
  audio_signed_url?: string | null;
  transcript: string | null;
  ai_summary: string | null;
  ai_extracted_tasks: { description: string; priority: string }[] | null;
  ai_extracted_contacts: string[] | null;
  ai_suggested_meeting_type: string | null;
  project_tags: string[] | null;
  duration_seconds: number | null;
  processing_status: string | null;
  recorded_at: string | null;
  created_at: string | null;
}

export default function VoiceMemosPage() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
  const [expandedMemoId, setExpandedMemoId] = useState<string | null>(null);
  const [processingMemoId, setProcessingMemoId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMemos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/voice-memos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMemos(data.memos);
      }
    } catch (err) {
      console.error("Failed to fetch memos:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => fetchMemos(), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchMemos]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadMemo(blob, recordingDuration);
        setRecordingDuration(0);
      };

      mediaRecorder.start(1000); // collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const uploadMemo = async (blob: Blob, duration: number) => {
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("duration", String(duration));

    try {
      const res = await fetch("/api/voice-memos", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Refetch to get the new memo in the list
        setTimeout(fetchMemos, 1000); // small delay for transcription to start
        fetchMemos();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const deleteMemo = async (id: string) => {
    try {
      const res = await fetch(`/api/voice-memos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemos((prev) => prev.filter((m) => m.id !== id));
        if (playingMemoId === id) stopAudio();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const playMemo = async (memo: VoiceMemo) => {
    stopAudio();

    try {
      // Fetch signed URL
      const res = await fetch(`/api/voice-memos/${memo.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const signedUrl = data.memo.audio_signed_url;
      if (!signedUrl) return;

      const audio = new Audio(signedUrl);
      audioRef.current = audio;
      setPlayingMemoId(memo.id);

      audio.onended = () => {
        setPlayingMemoId(null);
        audioRef.current = null;
      };

      audio.play();
    } catch (err) {
      console.error("Playback failed:", err);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMemoId(null);
  };

  const processWithAI = async (memoId: string) => {
    setProcessingMemoId(memoId);
    try {
      const res = await fetch(`/api/voice-memos/${memoId}/process`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setMemos((prev) =>
          prev.map((m) => (m.id === memoId ? data.memo : m))
        );
        setExpandedMemoId(memoId);
      }
    } catch (err) {
      console.error("AI processing failed:", err);
    } finally {
      setProcessingMemoId(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Voice Memos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Record, transcribe, and let AI extract insights from your voice
            notes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {memos.length} memo{memos.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Record Button */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          {isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <Mic className="h-10 w-10 text-white" />
                </div>
              </div>
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                Recording... {formatDuration(recordingDuration)}
              </p>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Headphones className="h-10 w-10 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-sm text-slate-500">
                Click to record a new voice memo
              </p>
              <Button
                onClick={startRecording}
                size="lg"
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search memos by title, transcript, or summary..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Memo List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : memos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MicOff className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500">
              {search
                ? "No memos match your search"
                : "No voice memos yet. Record your first one above!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {memos.map((memo) => (
            <Card
              key={memo.id}
              className={`transition-all ${
                expandedMemoId === memo.id
                  ? "ring-2 ring-violet-500/30"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      setExpandedMemoId(
                        expandedMemoId === memo.id ? null : memo.id
                      )
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(memo.processing_status)}
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {memo.title || "Untitled Memo"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(memo.duration_seconds)}
                      </span>
                      <span>{formatDate(memo.recorded_at)}</span>
                      {memo.project_tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {memo.ai_summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {memo.ai_summary}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {memo.audio_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          playingMemoId === memo.id
                            ? stopAudio()
                            : playMemo(memo)
                        }
                      >
                        {playingMemoId === memo.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {memo.transcript && !memo.ai_summary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => processWithAI(memo.id)}
                        disabled={processingMemoId === memo.id}
                        title="Analyze with AI"
                      >
                        {processingMemoId === memo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-violet-500" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteMemo(memo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedMemoId === memo.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Transcript */}
                    {memo.transcript ? (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Transcript
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {memo.transcript}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        {memo.processing_status === "processing"
                          ? "Transcription in progress..."
                          : memo.processing_status === "failed"
                          ? "Transcription failed"
                          : "Waiting for transcription..."}
                      </p>
                    )}

                    {/* AI Insights */}
                    {memo.ai_summary && (
                      <div className="bg-violet-50 dark:bg-violet-950/20 rounded-lg p-3 space-y-3">
                        <h4 className="text-sm font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Insights
                        </h4>

                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {memo.ai_summary}
                        </p>

                        {memo.ai_extracted_tasks &&
                          memo.ai_extracted_tasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">
                                Extracted Tasks:
                              </p>
                              <ul className="space-y-1">
                                {memo.ai_extracted_tasks.map((task, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    <Badge
                                      variant={
                                        task.priority === "high"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                      className="text-xs py-0"
                                    >
                                      {task.priority}
                                    </Badge>
                                    {task.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {memo.ai_extracted_contacts &&
                          memo.ai_extracted_contacts.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">
                                People Mentioned:
                              </p>
                              <div className="flex gap-1 flex-wrap">
                                {memo.ai_extracted_contacts.map((name) => (
                                  <Badge
                                    key={name}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {memo.ai_suggested_meeting_type && (
                          <p className="text-xs text-slate-500">
                            Suggested type:{" "}
                            <span className="font-medium">
                              {memo.ai_suggested_meeting_type.replace(/_/g, " ")}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Process button if transcript exists but no AI analysis */}
                    {memo.transcript && !memo.ai_summary && (
                      <Button
                        onClick={() => processWithAI(memo.id)}
                        disabled={processingMemoId === memo.id}
                        variant="outline"
                        className="gap-2"
                      >
                        {processingMemoId === memo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Analyze with AI
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
