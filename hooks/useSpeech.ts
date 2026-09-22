"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SPEECH_LOCALES } from "@/data/translations";
import type { Language } from "@/types";

// Thin wrapper around the browser Web Speech API. Degrades gracefully when
// unsupported (Safari/Firefox on some platforms, non-HTTPS contexts) — the
// caller always has a working TAP/TYPE fallback per the accessibility spec.

type RecognitionState = "idle" | "listening" | "processing" | "error" | "unsupported";

interface SpeechRecognitionResultLike {
  [index: number]: { [index: number]: { transcript: string } };
  length: number;
}
interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultLike;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useSpeechRecognition(language: Language) {
  const [isSupported] = useState(() => Boolean(getSpeechRecognitionCtor()));
  const [state, setState] = useState<RecognitionState>(isSupported ? "idle" : "unsupported");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionImpl = getSpeechRecognitionCtor();
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LOCALES[language];

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onstart = () => setState("listening");
    recognition.onerror = () => setState("error");
    recognition.onend = () => setState((s) => (s === "listening" ? "processing" : s));

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [language, isSupported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setState("unsupported");
      return;
    }
    setTranscript("");
    try {
      recognitionRef.current.start();
    } catch {
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setState(isSupported ? "idle" : "unsupported");
    setTranscript("");
  }, [isSupported]);

  return { state, transcript, start, stop, reset, supported: isSupported };
}

export function speakText(text: string, language: Language) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[language];
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
