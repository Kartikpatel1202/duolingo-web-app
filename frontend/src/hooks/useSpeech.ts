"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** BCP-47 tags with a regional voice preference for the course languages. */
const VOICE_LOCALE: Record<string, string> = { es: "es-ES", en: "en-US" };
const SPEECH_RATE = 0.9;

function subscribeNever(): () => void {
  return () => undefined;
}

/**
 * Text-to-speech with the browser's built-in SpeechSynthesis — no audio files or services.
 * `supported` is false on the server and in browsers without the API, so callers can render a
 * disabled control instead of failing.
 */
export function useSpeech() {
  const supported = useSyncExternalStore(
    subscribeNever,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeakingText(null);
  }, [supported]);

  const speak = useCallback(
    (text: string, language: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = VOICE_LOCALE[language] ?? language;
      utterance.rate = SPEECH_RATE;
      utterance.onend = () => setSpeakingText(null);
      utterance.onerror = () => setSpeakingText(null);
      setSpeakingText(text);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  // Never keep talking after the component that started speech goes away.
  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { supported, speak, stop, speakingText };
}
