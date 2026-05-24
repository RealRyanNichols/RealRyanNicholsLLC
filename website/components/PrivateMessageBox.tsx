"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type State =
  | { kind: "idle" }
  | { kind: "open" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function PrivateMessageBox({
  title = "Need to say something privately?",
  source = "private-message",
}: {
  title?: string;
  source?: string;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(source);
  const [message, setMessage] = useState("");
  const open = state.kind !== "idle";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      trackEvent("private_message_failed", { reason: "empty" });
      setState({ kind: "error", message: "Write the message first." });
      return;
    }
    trackEvent("private_message_attempt", { source });
    setState({ kind: "submitting" });
    try {
      const response = await fetch("/api/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          subject: subject || undefined,
          message,
          source_path: window.location.pathname,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        trackEvent("private_message_failed", { source, reason: "api" });
        setState({
          kind: "error",
          message: json.error ?? "Could not send private message.",
        });
        return;
      }
      trackEvent("private_message_success", { source });
      setDisplayName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setState({ kind: "success", message: "Private message received." });
    } catch {
      trackEvent("private_message_failed", { source, reason: "network" });
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  return (
    <section
      id="private-message"
      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
            Private lane
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Public comments create attention. Use this only for sensitive
            details, contact info, tips, or evidence that should not be public.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            trackEvent(open ? "private_message_close" : "private_message_open", {
              source,
            });
            setState(open ? { kind: "idle" } : { kind: "open" });
          }}
          className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-black hover:border-[var(--color-accent)]"
        >
          {open ? "Close" : "Message"}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value.slice(0, 120))}
            placeholder="Name (optional)"
            aria-label="Name"
            autoComplete="name"
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email (optional)"
              aria-label="Email"
              autoComplete="email"
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value.slice(0, 40))}
              placeholder="Phone (optional)"
              aria-label="Phone"
              autoComplete="tel"
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value.slice(0, 160))}
            placeholder="Subject"
            aria-label="Subject"
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
          <textarea
            required
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 4000))}
            placeholder="Private message"
            aria-label="Private message"
            rows={5}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={state.kind === "submitting"}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-black text-[var(--color-paper)] disabled:opacity-60"
          >
            {state.kind === "submitting" ? "Sending..." : "Send private message"}
          </button>
        </form>
      ) : null}

      {state.kind === "success" ? (
        <p className="mt-3 text-sm text-emerald-700">{state.message}</p>
      ) : null}
      {state.kind === "error" ? (
        <p className="mt-3 text-sm text-red-700">{state.message}</p>
      ) : null}
    </section>
  );
}
