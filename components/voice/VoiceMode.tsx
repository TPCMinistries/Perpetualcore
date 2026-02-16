"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  VOICE_OPTIONS,
  DEFAULT_VOICE,
  MAX_RECORDING_DURATION,
  AUDIO_MIME_TYPE,
} from "@/lib/voice/constants";
import type { VoiceId } from "@/lib/voice/constants";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface VoiceModeProps {
  onClose: () => void;
  initialVoice?: VoiceId;
  initialHistory?: string[];
}

export function VoiceMode({
  onClose,
  initialVoice = DEFAULT_VOICE,
  initialHistory = [],
}: VoiceModeProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(initialVoice);
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [conversationHistory, setConversationHistory] =
    useState<string[]>(initialHistory);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const autoListenRef = useRef(true);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptLines]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      autoListenRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
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
      setCurrentTranscript("Processing...");

      try {
        // Step 1: Transcribe
        const formData = new FormData();
        formData.append(
          "audio",
          new File([audioBlob], "recording.webm", { type: "audio/webm" })
        );

        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeRes.ok) throw new Error("Transcription failed");

        const { text: userText } = await transcribeRes.json();

        setTranscriptLines((prev) => [
          ...prev,
          { role: "user", text: userText, timestamp: new Date() },
        ]);
        setCurrentTranscript("");

        // Step 2: AI response
        const newHistory = [...conversationHistory, `You: ${userText}`];

        const chatRes = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: newHistory,
          }),
        });

        if (!chatRes.ok) throw new Error("Chat failed");

        const { response: aiResponse } = await chatRes.json();

        setTranscriptLines((prev) => [
          ...prev,
          { role: "assistant", text: aiResponse, timestamp: new Date() },
        ]);
        setConversationHistory([...newHistory, `AI: ${aiResponse}`]);

        // Step 3: Speak response (if not muted)
        if (!isMuted) {
          setState("speaking");

          const ttsRes = await fetch("/api/voice/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: aiResponse,
              voice: selectedVoice,
            }),
          });

          if (!ttsRes.ok) throw new Error("TTS failed");

          const audioBuffer = await ttsRes.arrayBuffer();
          const audioBlob2 = new Blob([audioBuffer], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob2);

          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            setState("idle");
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            // Auto-listen again after response finishes
            if (autoListenRef.current) {
              setTimeout(() => startRecording(), 500);
            }
          };

          audio.onerror = () => {
            setState("idle");
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
          };

          await audio.play();
        } else {
          setState("idle");
          // Auto-listen if not muted playback
          if (autoListenRef.current) {
            setTimeout(() => startRecording(), 500);
          }
        }
      } catch (error) {
        console.error("Voice processing error:", error);
        setTranscriptLines((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, something went wrong. Please try again.",
            timestamp: new Date(),
          },
        ]);
        setState("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationHistory, selectedVoice, isMuted]
  );

  const startRecording = useCallback(async () => {
    if (state === "processing" || state === "speaking") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

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

      mediaRecorder.start(100);
      setState("listening");
      setCurrentTranscript("Listening...");

      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION);
    } catch (error) {
      console.error("Microphone access error:", error);
      setState("idle");
    }
  }, [state, processAudio, stopRecording]);

  const handleMicToggle = useCallback(() => {
    if (state === "listening") {
      stopRecording();
    } else if (state === "idle") {
      startRecording();
    } else if (state === "speaking") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setState("idle");
    }
  }, [state, startRecording, stopRecording]);

  const handleClose = useCallback(() => {
    autoListenRef.current = false;
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onClose();
  }, [onClose, stopRecording]);

  // Start listening immediately on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startRecording();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Left: Voice selector + mute toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Select
            value={selectedVoice}
            onValueChange={(v) => setSelectedVoice(v as VoiceId)}
          >
            <SelectTrigger className="h-9 w-[130px] border-gray-700 bg-gray-800/50 text-gray-200 sm:w-[160px]">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-800">
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem
                  key={voice.id}
                  value={voice.id}
                  className="text-gray-200 focus:bg-gray-700 focus:text-white"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{voice.name}</span>
                    <span className="hidden text-xs text-gray-400 sm:inline">
                      {voice.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-9 w-9 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Right: Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-9 w-9 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label="Close voice mode"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Center: Waveform visualization */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Waveform container */}
        <div className="relative flex h-32 items-center justify-center gap-1 sm:h-40 sm:gap-1.5">
          {[...Array(7)].map((_, i) => {
            const isCenter = i === 3;
            const distFromCenter = Math.abs(i - 3);

            return (
              <motion.div
                key={i}
                className={cn(
                  "rounded-full",
                  state === "listening" && "bg-red-400",
                  state === "speaking" && "bg-green-400",
                  state === "processing" && "bg-yellow-400",
                  state === "idle" && "bg-gray-600"
                )}
                style={{
                  width: isCenter ? 6 : 4,
                }}
                animate={
                  state === "listening"
                    ? {
                        height: [
                          16 + distFromCenter * 4,
                          60 - distFromCenter * 8,
                          16 + distFromCenter * 4,
                        ],
                      }
                    : state === "speaking"
                    ? {
                        height: [
                          12 + distFromCenter * 2,
                          80 - distFromCenter * 10,
                          12 + distFromCenter * 2,
                        ],
                      }
                    : state === "processing"
                    ? {
                        height: [20, 40, 20],
                        opacity: [0.5, 1, 0.5],
                      }
                    : {
                        height: 20 - distFromCenter * 2,
                      }
                }
                transition={
                  state === "idle"
                    ? { duration: 0.5 }
                    : {
                        duration: 0.5 + i * 0.05,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                      }
                }
              />
            );
          })}
        </div>

        {/* Status text */}
        <motion.p
          className="mt-6 text-sm text-gray-400"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {state === "listening" && "Listening... tap mic to stop"}
          {state === "processing" && "Thinking..."}
          {state === "speaking" && "Speaking..."}
          {state === "idle" && "Tap the microphone to start"}
        </motion.p>

        {/* Mic button */}
        <div className="mt-8">
          <motion.button
            onClick={handleMicToggle}
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              state === "idle" && "bg-white/10 text-white hover:bg-white/20",
              state === "listening" && "bg-red-500 text-white",
              state === "processing" && "bg-yellow-500/80 text-white cursor-wait",
              state === "speaking" && "bg-green-500 text-white"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={state === "processing"}
            aria-label={state === "listening" ? "Stop recording" : "Start recording"}
          >
            {/* Pulse rings for listening */}
            {state === "listening" && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.4,
                  }}
                />
              </>
            )}

            {state === "listening" ? (
              <MicOff className="h-8 w-8" />
            ) : state === "processing" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent" />
              </motion.div>
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Bottom: Rolling transcript */}
      <div className="max-h-[200px] overflow-y-auto border-t border-gray-800 bg-gray-950/50 px-4 py-3 sm:max-h-[240px] sm:px-6 sm:py-4">
        {transcriptLines.length === 0 && !currentTranscript ? (
          <p className="text-center text-sm text-gray-600">
            Your conversation will appear here
          </p>
        ) : (
          <div className="space-y-2">
            {transcriptLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "text-sm",
                  line.role === "user" ? "text-gray-300" : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "font-medium",
                    line.role === "user" ? "text-blue-400" : "text-green-400"
                  )}
                >
                  {line.role === "user" ? "You" : "AI"}:
                </span>{" "}
                {line.text}
              </motion.div>
            ))}

            {currentTranscript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm italic text-gray-500"
              >
                {currentTranscript}
              </motion.div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
