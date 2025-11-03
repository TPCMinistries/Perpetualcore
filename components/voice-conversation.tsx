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

type ConversationState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export function VoiceConversation({ onClose }: VoiceConversationProps) {
  const [state, setState] = useState<ConversationState>("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [volumeLevel, setVolumeLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize voice conversation
  const startConversation = async () => {
    try {
      setState("connecting");
      setError(null);

      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/voice-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice: selectedVoice,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get voice session token");
      }

      const { client_secret, voice: apiVoice } = await tokenResponse.json();

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Connect to OpenAI Realtime API
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        ["realtime", `openai-insecure-api-key.${client_secret}`]
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to OpenAI Realtime API");

        // Wait for session.created event before configuring
        setState("connecting");
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        // Handle different event types
        switch (data.type) {
          case "session.created":
            console.log("Session created, configuring...");
            // Now configure the session
            wsRef.current?.send(
              JSON.stringify({
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: "You are a helpful, friendly AI assistant. Have natural, conversational exchanges with the user. Be concise but informative. Show personality and warmth in your responses.",
                  voice: apiVoice || selectedVoice,
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                    model: "whisper-1",
                  },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                  },
                  temperature: 0.8,
                },
              })
            );
            break;

          case "session.updated":
            console.log("Session configured and ready!");
            // Start listening immediately
            setState("listening");
            startAudioStreaming();
            break;

          case "input_audio_buffer.speech_started":
            setState("listening");
            console.log("User started speaking");
            // Stop any ongoing AI speech
            stopAudioPlayback();
            break;

          case "input_audio_buffer.speech_stopped":
            console.log("User stopped speaking");
            break;

          case "input_audio_buffer.committed":
            console.log("Audio buffer committed");
            setState("thinking");
            break;

          case "conversation.item.created":
          case "conversation.item.done":
          case "conversation.item.added":
            // Conversation management events
            break;

          case "conversation.item.input_audio_transcription.completed":
            setTranscript((prev) => [...prev, `You: ${data.transcript}`]);
            break;

          case "response.created":
            console.log("Response started");
            setState("thinking");
            break;

          case "response.output_item.added":
          case "response.output_item.done":
          case "response.content_part.added":
            // Response structure events
            break;

          case "response.audio_transcript.delta":
          case "response.output_audio_transcript.delta":
            // Update transcript as AI speaks
            setTranscript((prev) => {
              const newTranscript = [...prev];
              const delta = data.delta || "";
              if (newTranscript.length === 0 || !newTranscript[newTranscript.length - 1].startsWith("AI:")) {
                newTranscript.push(`AI: ${delta}`);
              } else {
                newTranscript[newTranscript.length - 1] += delta;
              }
              return newTranscript;
            });
            break;

          case "response.audio_transcript.done":
          case "response.output_audio_transcript.done":
            console.log("Transcript complete");
            break;

          case "response.audio.delta":
          case "response.output_audio.delta":
            // Queue audio chunk for playback
            const audioData = base64ToInt16Array(data.delta);
            queueAudioForPlayback(audioData);
            setState("speaking");
            break;

          case "response.audio.done":
          case "response.output_audio.done":
            console.log("Audio playback complete");
            setState("listening");
            break;

          case "response.done":
            console.log("Response complete");
            setState("listening");
            break;

          case "error":
            console.error("Realtime API error:", data.error);
            setError(data.error.message || "An error occurred");
            break;

          case "rate_limits.updated":
            // Ignore rate limit updates
            break;

          default:
            // Log unhandled events for debugging
            console.log("Unhandled event:", data.type);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error occurred");
        setState("idle");
      };

      ws.onclose = () => {
        console.log("Disconnected from OpenAI Realtime API");
        cleanup();
      };
    } catch (error) {
      console.error("Failed to initialize voice conversation:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize");
      setState("idle");
      cleanup();
    }
  };

  // Convert base64 audio to Int16Array
  const base64ToInt16Array = (base64: string): Int16Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  };

  // Queue audio for smooth playback
  const queueAudioForPlayback = async (audioData: Int16Array) => {
    if (!audioContextRef.current) return;

    const audioBuffer = audioContextRef.current.createBuffer(
      1,
      audioData.length,
      24000
    );
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i] / 32768; // Convert Int16 to Float32
    }

    audioQueueRef.current.push(audioBuffer);

    if (!isPlayingRef.current) {
      playAudioQueue();
    }
  };

  // Play audio queue continuously
  const playAudioQueue = async () => {
    if (!audioContextRef.current || isPlayingRef.current) return;

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioBuffer = audioQueueRef.current.shift();
      if (!audioBuffer || !audioContextRef.current) break;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      await new Promise<void>((resolve) => {
        source.onended = () => {
          currentSourceRef.current = null;
          resolve();
        };
        source.start();
      });
    }

    isPlayingRef.current = false;
  };

  // Stop audio playback (for interruptions)
  const stopAudioPlayback = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      } catch (e) {
        // Already stopped
      }
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  // Start streaming audio to OpenAI
  const startAudioStreaming = () => {
    if (!wsRef.current || !mediaStreamRef.current || !audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    sourceRef.current = source;
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);

    processor.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(inputData.length);

      // Calculate volume level for visualization
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        int16Data[i] = sample < 0 ? sample * 32768 : sample * 32767;
        sum += Math.abs(sample);
      }
      const average = sum / inputData.length;
      setVolumeLevel(Math.min(100, average * 200));

      // Send audio to OpenAI
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
      wsRef.current.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio,
        })
      );
    };
  };

  // End conversation
  const endConversation = () => {
    cleanup();
    if (onClose) {
      onClose();
    }
  };

  // Cleanup function
  const cleanup = () => {
    setState("idle");

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    stopAudioPlayback();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Visual state indicators
  const getStateColor = () => {
    switch (state) {
      case "listening":
        return "bg-blue-500";
      case "thinking":
        return "bg-yellow-500";
      case "speaking":
        return "bg-emerald-500";
      case "connecting":
        return "bg-purple-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening":
        return "Listening...";
      case "thinking":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      case "connecting":
        return "Connecting...";
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
                : "Speak naturally - I'm listening"}
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

                {/* Volume visualization for listening state */}
                {state === "listening" && (
                  <div
                    className="absolute inset-0 rounded-full bg-white opacity-30 transition-transform duration-100"
                    style={{
                      transform: `scale(${0.5 + (volumeLevel / 200)})`
                    }}
                  />
                )}

                {/* Icon */}
                <Mic className="h-12 w-12 text-white relative z-10" />
              </div>

              {/* State text */}
              <div className="mt-4">
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100 text-center">
                  {getStateText()}
                </p>
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
