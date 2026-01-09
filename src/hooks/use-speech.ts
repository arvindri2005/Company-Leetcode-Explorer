"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
const speechSynthesis =
  typeof window !== "undefined" ? window.speechSynthesis : null;

/**
 * @function useSpeech
 * @description A custom hook that wraps the Web Speech API to provide Speech-to-Text (STT)
 * and Text-to-Speech (TTS) capabilities.
 *
 * @param {Function} onTranscriptUpdate - Callback function that receives the live transcript string.
 *
 * @returns {Object} An object containing recording state, permission status, and functions to control recording and speech.
 */
export function useSpeech(onTranscriptUpdate: (transcript: string) => void) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isBrowserUnsupported, setIsBrowserUnsupported] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return !window.SpeechRecognition && !window.webkitSpeechRecognition;
  });
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthesis || !isTTSEnabled) return;
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }

      const plainText = text
        .replace(/```[\s\S]*?```/g, "Code block.")
        .replace(/`[^`]+`/g, "Inline code.")
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/#+\s/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "Link.");
      utteranceRef.current = new SpeechSynthesisUtterance(plainText);
      speechSynthesis.speak(utteranceRef.current);
    },
    [isTTSEnabled],
  );

  const handleToggleRecording = useCallback(async () => {
    if (isBrowserUnsupported || !SpeechRecognition) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        if (micPermission !== "granted") {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
          setMicPermission("granted");
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          onTranscriptUpdate("");
          toast({ title: "Recording started...", description: "Speak now." });
        };

        let finalTranscript = "";
        recognitionRef.current.onresult = (
          event: SpeechRecognitionEvent,
        ) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          onTranscriptUpdate(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onerror = (
          event: SpeechRecognitionErrorEvent,
        ) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          let errorMsg = "Speech recognition error.";
          if (event.error === "no-speech")
            errorMsg = "No speech was detected. Please try again.";
          if (event.error === "audio-capture")
            errorMsg = "Microphone not found or not working.";
          if (event.error === "not-allowed") {
            errorMsg =
              "Microphone access was not allowed. Please enable it in your browser settings.";
            setMicPermission("denied");
          }
          toast({
            title: "Recording Error",
            description: errorMsg,
            variant: "destructive",
          });
        };

        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recording:", error);
        setMicPermission("denied");
        toast({
          title: "Could not start recording",
          description:
            "Please ensure microphone permissions are granted and your browser supports Web Speech API.",
          variant: "destructive",
        });
        setIsRecording(false);
      }
    }
  }, [
    isBrowserUnsupported,
    isRecording,
    micPermission,
    onTranscriptUpdate,
    toast,
  ]);

  const toggleTTS = useCallback(() => {
    setIsTTSEnabled((prev) => {
      const newState = !prev;
      if (!newState && speechSynthesis?.speaking) {
        speechSynthesis.cancel();
      }
      toast({ title: `AI Speech ${newState ? "Enabled" : "Disabled"}` });
      return newState;
    });
  }, [toast]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (speechSynthesis?.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isRecording,
    isBrowserUnsupported,
    isTTSEnabled,
    handleToggleRecording,
    toggleTTS,
    speakText,
  };
}
