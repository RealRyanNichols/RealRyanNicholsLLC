"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Low-friction lead capture for visitors who are not ready to buy yet. Email
 * plus an optional question. Saves as a lead so Ryan can follow up.
 */
export function BlueprintLeadForm() {
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setError(null);
    trackEvent("blueprint_lead_submit", {});
    try {
      const res = await fetch("/api/blueprint-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, question, source: "blueprint_offer" }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not send. Try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success-soft)] p-5">
        <p className="font-display text-lg font-black text-[var(--color-success)]">
          Got it. I will be in touch.
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
          Check your inbox. If you included a question, I will answer it directly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com"
          aria-label="Your email"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-blue)] px-6 py-3 text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-blue-strong)] disabled:opacity-60"
        >
          {state === "busy" ? "Sending..." : "Send me the breakdown"}
        </button>
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        placeholder="Optional: what is the one thing you want this to solve?"
        aria-label="Your question (optional)"
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-sm text-[var(--color-ink)]"
      />
      {error ? (
        <p className="text-sm font-bold text-[var(--color-accent)]">{error}</p>
      ) : null}
      <p className="text-xs font-semibold text-[var(--color-muted)]">
        No spam. Just the breakdown and an answer to your question.
      </p>
    </form>
  );
}
