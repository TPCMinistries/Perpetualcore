"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceMode } from "./VoiceMode";
import {
  VOICE_OPTIONS,
  DEFAULT_VOICE,
  MAX_RECORDING_DURATION,
  AUDIO_MIME_TYPE,
} from "@/lib/voice/constants";
import type { VoiceId } from "@/lib/voice/constants";

type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

export function VoiceButton() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [lastResponse, setLastResponse] = useState<string>("");
  const [showFullMode, setShowFullMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(DEFAULT_VOICE);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [micPermission, setMicPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [showTranscript, setShowTranscript] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check mic permission on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((result) => {
          setMicPermission(result.state as "granted" | "denied" | "prompt");
          result.onchange = () => {
            setMicPermission(result.state as "granted" | "denied" | "prompt");
          };
        })
        .catch(() => {
          // permissions API not supported, will check on first use
          setMicPermission("unknown");
        });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      setState("processing");
      setShowTranscript(true);

      try {
        // Step 1: Transcribe audio
        const formData = new FormData();
        formData.append(
          "audio",
          new File([audioBlob], "recording.webm", { type: "audio/webm" })
        );

        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeRes.ok) {
          throw new Error("Transcription failed");
        }

        const { text: userText } = await transcribeRes.json();
        setTranscript(userText);

        // Step 2: Get AI response via voice chat
        const newHistory = [...conversationHistory, `You: ${userText}`];

        const chatRes = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: newHistory,
          }),
        });

        if (!chatRes.ok) {
          throw new Error("Chat failed");
        }

        const { response: aiResponse } = await chatRes.json();
        setLastResponse(aiResponse);
        setConversationHistory([...newHistory, `AI: ${aiResponse}`]);

        // Step 3: Synthesize speech
        setState("speaking");

        const ttsRes = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: aiResponse,
            voice: selectedVoice,
          }),
        });

        if (!ttsRes.ok) {
          throw new Error("TTS failed");
        }

        const audioBuffer = await ttsRes.arrayBuffer();
        const audioBlob2 = new Blob([audioBuffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob2);

        // Play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setState("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          // Auto-hide transcript after playback
          setTimeout(() => setShowTranscript(false), 3000);
        };

        audio.onerror = () => {
          setState("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (error) {
        console.error("Voice processing error:", error);
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    },
    [conversationHistory, selectedVoice]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      setMicPermission("granted");

      const mimeType = MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
        ? AUDIO_MIME_TYPE
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size > 0) {
          processAudio(audioBlob);
        } else {
          setState("idle");
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState("listening");

      // Auto-stop after max duration
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION);
    } catch (error) {
      console.error("Microphone access error:", error);
      setMicPermission("denied");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [processAudio, stopRecording]);

  const handleClick = useCallback(() => {
    if (state === "listening") {
      stopRecording();
    } else if (state === "speaking") {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setState("idle");
    } else if (state === "idle" || state === "error") {
      startRecording();
    }
    // Don't do anything during processing
  }, [state, startRecording, stopRecording]);

  const handlePointerDown = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowFullMode(true);
      longPressTimerRef.current = null;
    }, 600);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getIcon = () => {
    switch (state) {
      case "listening":
        return <Mic className="h-6 w-6" />;
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case "speaking":
        return <Volume2 className="h-6 w-6" />;
      case "error":
        return <MicOff className="h-6 w-6" />;
      default:
        return <Mic className="h-6 w-6" />;
    }
  };

  const getLabel = () => {
    switch (state) {
      case "listening":
        return "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      case "error":
        return micPermission === "denied"
          ? "Mic access denied"
          : "Error occurred";
      default:
        return "Voice mode";
    }
  };

  if (showFullMode) {
    return (
      <VoiceMode
        onClose={() => {
          setShowFullMode(false);
          stopRecording();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setState("idle");
        }}
        initialVoice={selectedVoice}
        initialHistory={conversationHistory}
      />
    );
  }

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Transcript bubble */}
        <AnimatePresence>
          {showTranscript && (transcript || lastResponse) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-[280px] rounded-lg border border-border bg-card p-3 shadow-lg"
            >
              {transcript && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">You:</span>{" "}
                  {transcript}
                </p>
              )}
              {lastResponse && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">AI:</span>{" "}
                  {lastResponse.length > 120
                    ? lastResponse.slice(0, 120) + "..."
                    : lastResponse}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            state === "idle" &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
            state === "listening" && "bg-red-500 text-white",
            state === "processing" &&
              "bg-yellow-500 text-white cursor-wait",
            state === "speaking" && "bg-green-500 text-white",
            state === "error" &&
              "bg-destructive text-destructive-foreground"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={getLabel()}
          title={getLabel()}
        >
          {/* Pulse ring when listening */}
          {state === "listening" && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-red-500"
                animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
              />
            </>
          )}

          {/* Waveform bars when speaking */}
          {state === "speaking" && (
            <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full bg-white"
                  animate={{
                    height: [4, 12, 4],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {getIcon()}
        </motion.button>

        {/* Helper text */}
        <AnimatePresence>
          {state === "idle" && micPermission === "denied" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-destructive"
            >
              Enable microphone in browser settings
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
