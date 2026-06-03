"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSessionId, getVisitorId } from "@/lib/client-ids";

type State =
  | { kind: "idle" }
  | { kind: "open" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function PrivateMessageBox({
  title = "Need to say something privately?",
  description = "Public comments create attention. Use this only for sensitive details, contact info, tips, or evidence that should not be public.",
  source = "private-message",
  defaultOpen = false,
  showToggle = true,
  expandedIntake = false,
  submitLabel = "Send private message",
  defaultSubject = source,
}: {
  title?: string;
  description?: string;
  source?: string;
  defaultOpen?: boolean;
  showToggle?: boolean;
  expandedIntake?: boolean;
  submitLabel?: string;
  defaultSubject?: string;
}) {
  const [state, setState] = useState<State>(
    defaultOpen ? { kind: "open" } : { kind: "idle" },
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("Sensitive records or evidence");
  const [urgency, setUrgency] = useState("Can wait for review");
  const [privacyNeed, setPrivacyNeed] = useState("Do not publish my name or identifying details");
  const [replyPreference, setReplyPreference] = useState("Email is best if I leave one");
  const [acknowledged, setAcknowledged] = useState(!expandedIntake);
  const open = state.kind !== "idle";

  const fullMessage = expandedIntake
    ? [
        "Private contact intake",
        "",
        `Topic: ${topic}`,
        `Timing: ${urgency}`,
        `Privacy: ${privacyNeed}`,
        `Reply preference: ${replyPreference}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n")
    : message.trim();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      trackEvent("private_message_failed", { reason: "empty" });
      setState({ kind: "error", message: "Write the message first." });
      return;
    }
    if (!acknowledged) {
      trackEvent("private_message_failed", { reason: "acknowledgement" });
      setState({ kind: "error", message: "Check the acknowledgement before sending." });
      return;
    }
    if (fullMessage.length > 4000) {
      trackEvent("private_message_failed", { reason: "too_long" });
      setState({
        kind: "error",
        message: "This is a little too long. Shorten it and send the key facts first.",
      });
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
          message: fullMessage,
          source_path: window.location.pathname,
          session_id: getSessionId() || undefined,
          visitor_id: getVisitorId() || undefined,
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
      setAcknowledged(!expandedIntake);
      setState({ kind: "success", message: "Private message received." });
    } catch {
      trackEvent("private_message_failed", { source, reason: "network" });
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  return (
    <section
      id="private-message"
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-normal text-[var(--color-muted)] font-bold">
            Private lane
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-normal">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {description}
          </p>
        </div>
        {showToggle ? (
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
        ) : null}
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          {expandedIntake ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
                What is this about?
                <select
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
                >
                  <option>Sensitive records or evidence</option>
                  <option>Public corruption or misconduct tip</option>
                  <option>Case review follow-up</option>
                  <option>Private service question</option>
                  <option>Media, article, or story lead</option>
                  <option>Other private message</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
                Timing
                <select
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
                >
                  <option>Can wait for review</option>
                  <option>Time-sensitive this week</option>
                  <option>Urgent, but not an emergency</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
                Source protection
                <select
                  value={privacyNeed}
                  onChange={(event) => setPrivacyNeed(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
                >
                  <option>Do not publish my name or identifying details</option>
                  <option>You may use my role, not my name</option>
                  <option>You may contact me, but keep me out of public work</option>
                  <option>I am willing to be on the record</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
                Follow-up
                <select
                  value={replyPreference}
                  onChange={(event) => setReplyPreference(event.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
                >
                  <option>Email is best if I leave one</option>
                  <option>Text or phone is best if I leave a number</option>
                  <option>Either email or phone is fine</option>
                  <option>No reply needed unless Ryan needs verification</option>
                </select>
              </label>
            </div>
          ) : null}

          <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
            Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 120))}
              placeholder="Optional"
              aria-label="Name"
              autoComplete="name"
              className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Optional"
                aria-label="Email"
                autoComplete="email"
                className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.slice(0, 40))}
                placeholder="Optional"
                aria-label="Phone"
                autoComplete="tel"
                className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
              />
            </label>
          </div>
          <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value.slice(0, 160))}
              placeholder="Short title"
              aria-label="Subject"
              className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-bold text-[var(--color-ink)]">
            Private message
            <textarea
              required
              value={message}
              onChange={(event) =>
                setMessage(event.target.value.slice(0, expandedIntake ? 3200 : 4000))
              }
              placeholder={
                expandedIntake
                  ? "Start with the key facts: what happened, who was involved, when, where, what proves it, and what you want Ryan to know privately."
                  : "Private message"
              }
              aria-label="Private message"
              rows={expandedIntake ? 8 : 5}
              className="w-full min-w-0 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-normal"
            />
          </label>
          {expandedIntake ? (
            <label className="flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                I understand this is not emergency services, not legal advice,
                and not legal representation. I will not send sealed records,
                minors&apos; private information, SSNs, bank data, or medical
                records unless Ryan specifically asks for them through a safer
                channel.
              </span>
            </label>
          ) : null}
          <button
            type="submit"
            disabled={state.kind === "submitting"}
            className="min-h-11 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-black text-[var(--color-paper)] disabled:opacity-60"
          >
            {state.kind === "submitting" ? "Sending..." : submitLabel}
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
