"use client";

import { useEffect, useState } from "react";
import { getVisitorId } from "@/lib/client-ids";
import { trackEvent } from "@/lib/analytics";

const DONE_KEY = "rrn_gtky_done";

type Step = {
  key: string;
  prompt: string;
  options?: string[];
  input?: "text" | "email";
  skippable?: boolean;
};

// Ryan's everyday questions — friendly, low-pressure, and each one builds the
// lead profile. Prompts live here as plain JS strings (not JSX text).
const STEPS: Step[] = [
  {
    key: "good_day",
    prompt: "First off — are you having a good day?",
    options: ["Yeah, pretty good", "Rough one, honestly", "Somewhere in between"],
  },
  {
    key: "name",
    prompt: "Good to meet you. What's your first name?",
    input: "text",
    skippable: true,
  },
  {
    key: "reason",
    prompt: "What made you reach out today?",
    options: [
      "Just checking you out",
      "The January 6 case",
      "I need help or advice",
      "Business — work with you",
      "Something personal",
    ],
  },
  {
    key: "source",
    prompt: "Where'd you find me?",
    options: [
      "X / Twitter",
      "Facebook",
      "Instagram",
      "TikTok",
      "YouTube",
      "Google",
      "An AI sent me",
      "A friend",
      "Somewhere else",
    ],
  },
  {
    key: "political_affiliation",
    prompt: "Last quick one — where do you land politically?",
    options: [
      "America First / MAGA",
      "Conservative",
      "Independent",
      "Moderate",
      "Rather not say",
    ],
  },
  {
    key: "email",
    prompt: "Want me to keep you posted? Drop your email and I'll reach out.",
    input: "email",
    skippable: true,
  },
];

export function GetToKnowYou({
  // Default keeps the historical look everywhere; the homepage passes a
  // quieter shell so the sidebar's money surfaces stand out instead.
  className = "rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-paper)] p-5 shadow-sm",
}: {
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DONE_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function save(key: string, value: string) {
    const clean = value.trim();
    if (!clean) return;
    const body: Record<string, string> = {
      visitorId: getVisitorId(),
      path: typeof window !== "undefined" ? window.location.pathname : "",
      [key]: clean,
    };
    try {
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  }

  function advance(key: string, value: string) {
    if (value.trim()) {
      save(key, value);
      trackEvent("gtky_answer", { step: key });
    }
    setText("");
    if (i >= STEPS.length - 1) finish();
    else setI(i + 1);
  }
  function finish() {
    setDone(true);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!show) return null;

  const step = STEPS[i];

  return (
    <section className={className}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          {done ? "Thanks for that" : "Let me get to know you"}
        </p>
        {!done ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="-mt-1 rounded-full p-1 text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        ) : null}
      </div>

      {done ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
          Good to meet you. I read every one of these — talk soon.
        </p>
      ) : (
        <>
          <p className="mt-2 font-display text-lg font-bold leading-snug tracking-tight text-[var(--color-ink)]">
            {step.prompt}
          </p>

          {step.options ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => advance(step.key, o)}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                advance(step.key, text);
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type={step.input === "email" ? "email" : "text"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={step.input === "email" ? "you@email.com" : "First name"}
                className="min-h-10 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-sm font-bold text-[var(--color-ink)] transition hover:brightness-105"
              >
                →
              </button>
            </form>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {i + 1} of {STEPS.length}
            </span>
            {step.skippable ? (
              <button
                type="button"
                onClick={() => advance(step.key, "")}
                className="text-[11px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                Skip
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
