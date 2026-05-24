"use client";

import { useEffect, useRef, useState } from "react";

// The Web Speech API ships in Chrome/Edge/Safari but isn't in the default
// TypeScript DOM lib, so we declare the minimal shape we use.
type SpeechAlternative = { transcript: string };
type SpeechResult = ArrayLike<SpeechAlternative> & { isFinal: boolean };
type SpeechResultList = ArrayLike<SpeechResult>;
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechResultList;
};
type SpeechRecognitionErrorLike = { error?: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceStoryRecorder({
  onAppendText,
}: {
  onAppendText: (text: string) => void;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText.trim()) onAppendText(finalText.trim());
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone access was blocked. Allow the mic in your browser, then try again."
          : "Didn't catch that — tap to talk and try again.",
      );
      setRecording(false);
      setInterim("");
    };
    rec.onend = () => {
      setRecording(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      /* a start() while already running throws — ignore */
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setRecording(false);
  }

  if (supported === false) {
    return (
      <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs text-[var(--color-muted)]">
        Talk-to-text isn&apos;t supported in this browser. Open this page in
        Chrome, Edge, or Safari to dictate — or just type your story below.
      </p>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-paper)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : start}
          aria-pressed={recording}
          className={[
            "inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold text-base transition",
            recording
              ? "bg-[var(--color-accent)] text-[var(--color-paper)] animate-pulse"
              : "border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
          ].join(" ")}
        >
          {recording ? "■ Stop & keep text" : "🎤 Tap to talk"}
        </button>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {recording
            ? "Listening… just talk. Tap stop when you're done."
            : "Tap, tell your story out loud, then tap again to stop. The words drop into the box below — edit anything before you save."}
        </p>
      </div>

      {interim ? (
        <p className="mt-3 text-sm italic text-[var(--color-muted)]">
          {interim}…
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm font-semibold text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
