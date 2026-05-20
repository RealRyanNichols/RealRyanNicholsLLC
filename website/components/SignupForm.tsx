"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function SignupForm({ disabled = false }: { disabled?: boolean }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");

  if (disabled) {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
          Email signup
        </p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Subscriptions open shortly. Check back soon.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Something went wrong." });
        return;
      }
      setState({
        kind: "success",
        message:
          json.message ?? "Check your email to confirm your subscription.",
      });
      setEmail("");
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
        Get updates by email
      </p>
      <p className="text-sm text-[var(--color-ink-soft)] mb-3">
        No algorithm. No platform. Straight to your inbox when there&apos;s something new.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="btn-accent rounded-lg px-4 py-2 text-sm disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Adding..." : "Subscribe"}
        </button>
      </div>
      {state.kind === "success" && (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      )}
    </form>
  );
}
