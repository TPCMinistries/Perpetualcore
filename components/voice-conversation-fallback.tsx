"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Volume2, Loader2, Phone, PhoneOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceConversationProps {
  onClose?: () => void;
}

// Available OpenAI voices
const VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and engaging" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Energetic and bright" },
  { id: "shimmer", name: "Shimmer", description: "Soft and pleasant" },
];

type ConversationState = "idle" | "listening" | "processing" | "speaking";

export function VoiceConversation({ onClose }: VoiceConversationProps) {
  const [state, setState] = useState<ConversationState>("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start conversation
  const startConversation = async () => {
    try {
      setState("listening");
      setError(null);
      startListening();
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError(error instanceof Error ? error.message : "Failed to start");
      setState("idle");
    }
  };

  // Start listening for user speech
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        audioChunksRef.current = [];
      };

      // Auto-start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Stop recording after 10 seconds (you can adjust this)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopListening();
        }
      }, 10000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Could not access microphone");
      setState("idle");
    }
  };

  // Stop listening
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Process audio: transcribe -> get AI response -> speak
  const processAudio = async (audioBlob: Blob) => {
    setState("processing");

    try {
      // Step 1: Transcribe audio using Whisper
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const transcriptResponse = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcriptResponse.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const { text: userText } = await transcriptResponse.json();

      if (!userText || userText.trim() === "") {
        // No speech detected, go back to listening
        setState("listening");
        startListening();
        return;
      }

      setTranscript((prev) => [...prev, `You: ${userText}`]);

      // Step 2: Get AI response
      const chatResponse = await fetch("/api/voice/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          history: transcript,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const { response: aiText } = await chatResponse.json();
      setTranscript((prev) => [...prev, `AI: ${aiText}`]);

      // Step 3: Convert AI response to speech
      setState("speaking");
      const ttsResponse = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiText,
          voice: selectedVoice,
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await ttsResponse.blob();
      await playAudio(audioBlob);

      // After speaking, go back to listening
      setState("listening");
      startListening();
    } catch (error) {
      console.error("Error processing audio:", error);
      setError(error instanceof Error ? error.message : "Processing failed");
      setState("listening");
      startListening();
    }
  };

  // Play audio
  const playAudio = async (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        reject(error);
      };

      audio.play();
    });
  };

  // End conversation
  const endConversation = () => {
    stopListening();

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setState("idle");

    if (onClose) {
      onClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Visual state indicators
  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "speaking":
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening":
        return isRecording ? "Listening... (Speak now)" : "Listening...";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking...";
      default:
        return "Not connected";
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Voice Conversation</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {state === "idle"
                ? "Start a natural voice conversation with AI"
                : "Speak when listening, AI will respond"}
            </p>
          </div>
        </div>

        {state === "idle" && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Voice:</label>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={state !== "idle"}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div>
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-xs text-muted-foreground">{voice.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-2">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Volume2 className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Your conversation will appear here
            </p>
          </div>
        ) : (
          transcript.map((line, index) => (
            <Card
              key={index}
              className={`px-4 py-3 ${
                line.startsWith("You:")
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ml-auto max-w-[80%]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mr-auto max-w-[80%]"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{line}</p>
            </Card>
          ))
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {state === "idle" ? (
          <Button
            size="lg"
            onClick={startConversation}
            className="w-full max-w-sm h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Phone className="mr-2 h-5 w-5" />
            Start Voice Conversation
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Visual Indicator */}
            <div className="relative flex flex-col items-center">
              <div className={`h-32 w-32 rounded-full ${getStateColor()} flex items-center justify-center relative overflow-hidden`}>
                {/* Pulsing animation */}
                <div className={`absolute inset-0 rounded-full ${getStateColor()} animate-ping opacity-75`} />

                {/* Icon */}
                {state === "speaking" ? (
                  <Volume2 className="h-12 w-12 text-white relative z-10" />
                ) : state === "processing" ? (
                  <Loader2 className="h-12 w-12 text-white relative z-10 animate-spin" />
                ) : (
                  <Mic className="h-12 w-12 text-white relative z-10" />
                )}
              </div>

              {/* State text */}
              <div className="mt-4">
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100 text-center">
                  {getStateText()}
                </p>
                {state === "listening" && isRecording && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopListening}
                    className="mt-2"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Stop & Send
                  </Button>
                )}
              </div>
            </div>

            {/* End button */}
            <Button
              variant="outline"
              onClick={endConversation}
              className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              End Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
