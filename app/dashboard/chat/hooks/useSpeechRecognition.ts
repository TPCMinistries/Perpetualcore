"use client";

import { useState, useEffect, useCallback } from "react";

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript]);

  const toggleVoiceRecording = useCallback(() => {
    if (!recognition) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  }, [recognition, isRecording]);

  return {
    isRecording,
    toggleVoiceRecording,
    isSupported: !!recognition,
  };
}
