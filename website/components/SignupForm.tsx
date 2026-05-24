"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function SignupForm({ emailEnabled = false }: { emailEnabled?: boolean }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email && !phone) {
      setState({
        kind: "error",
        message: emailEnabled
          ? "Enter an email or a phone number."
          : "Enter a phone number.",
      });
      return;
    }
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: json.error ?? "Something went wrong." });
        return;
      }
      setState({
        kind: "success",
        message: json.message ?? "You're on the list.",
      });
      setEmail("");
      setPhone("");
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
        Get updates
      </p>
      <p className="text-sm text-[var(--color-ink-soft)] mb-3">
        {emailEnabled
          ? "No algorithm. No platform. Straight to your inbox or phone when there's something new — fill in whichever you prefer."
          : "No algorithm. No platform. Drop your number and I'll text you the moment there's something new."}
      </p>
      <div className="space-y-2">
        {emailEnabled ? (
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address (optional)"
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        ) : null}
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-1234"
          aria-label={emailEnabled ? "Phone number (optional)" : "Phone number"}
          autoComplete="tel"
          inputMode="tel"
          className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="btn-accent w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Adding..." : "Subscribe"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-muted)] leading-relaxed">
        {emailEnabled
          ? "Email gets a confirmation link. Phone numbers are stored until SMS updates go live — unsubscribe anytime."
          : "Your number is stored until SMS updates go live — unsubscribe anytime."}
      </p>
      {state.kind === "success" && (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      )}
    </form>
  );
}
