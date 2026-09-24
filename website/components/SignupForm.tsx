"use client";

import { useId, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const STACKED_SHELL =
  "rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5";

export function SignupForm({
  emailEnabled = false,
  // Default keeps the historical look everywhere; the homepage passes the
  // gold money treatment so the capture form pops out of the sidebar. The
  // inline variant has no shell of its own: it sits inside its host's.
  className,
  // Copy rotates daily from lib/modules.ts. The stacked form falls back to
  // the original wording; the inline form shows a kicker and blurb only when
  // the caller passes them.
  kicker,
  blurb,
  // Where on the site this form sits ("footer", "case-top", …). Rides
  // along on every subscribe_* event so identical forms on one page can be
  // told apart; the event names themselves never change.
  placement,
  // "stacked" is the original card: email, phone, full-width button.
  // "inline" is one row, email and button side by side from 360px up, no
  // phone field (phone only when email capture is off). Same endpoint, same
  // subscribe_* events.
  variant = "stacked",
  // Inline only.
  buttonLabel = "Follow",
  fineprint,
}: {
  emailEnabled?: boolean;
  className?: string;
  kicker?: string;
  blurb?: string;
  placement?: string;
  variant?: "stacked" | "inline";
  buttonLabel?: string;
  fineprint?: string;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const fieldId = useId();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const channel =
      email && phone ? "email_phone" : email ? "email" : phone ? "phone" : "empty";
    const base: Record<string, string> = placement ? { channel, placement } : { channel };
    if (!email && !phone) {
      trackEvent("subscribe_failed", { ...base, reason: "empty" });
      setState({
        kind: "error",
        message:
          variant === "inline"
            ? emailEnabled
              ? "Enter your email first."
              : "Enter your phone number first."
            : emailEnabled
              ? "Enter an email or a phone number."
              : "Enter a phone number.",
      });
      return;
    }
    trackEvent("subscribe_attempt", base);
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        trackEvent("subscribe_failed", { ...base, reason: "api" });
        setState({ kind: "error", message: json.error ?? "Something went wrong." });
        return;
      }
      trackEvent("subscribe_success", {
        ...base,
        email_action: json.email_action ?? "none",
        phone_action: json.phone_action ?? "none",
      });
      setState({
        kind: "success",
        message: json.message ?? "You're on the list.",
      });
      setEmail("");
      setPhone("");
    } catch {
      trackEvent("subscribe_failed", { ...base, reason: "network" });
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (variant === "inline") {
    const byPhone = !emailEnabled;
    return (
      <form onSubmit={onSubmit} noValidate className={className}>
        {kicker ? <p className="eyebrow">{kicker}</p> : null}
        {blurb ? (
          <p className={`${kicker ? "mt-1.5 " : ""}text-sm font-semibold leading-snug text-[var(--color-ink-soft)]`}>
            {blurb}
          </p>
        ) : null}
        {state.kind === "success" ? (
          <p
            role="status"
            className="mt-3 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] px-3.5 py-3 text-sm font-semibold text-[var(--color-success)]"
          >
            {state.message}
          </p>
        ) : (
          <div className={`${kicker || blurb ? "mt-3 " : ""}flex flex-col gap-2 min-[360px]:flex-row`}>
            <label htmlFor={fieldId} className="sr-only">
              {byPhone ? "Phone number" : "Email address"}
            </label>
            {byPhone ? (
              <input
                id={fieldId}
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-1234"
                autoComplete="tel"
                inputMode="tel"
                className="min-h-12 w-full min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            ) : (
              <input
                id={fieldId}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="send"
                className="min-h-12 w-full min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            )}
            <button
              type="submit"
              disabled={state.kind === "submitting"}
              className="btn-accent inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-5 text-sm font-black disabled:opacity-60"
            >
              {state.kind === "submitting" ? "Adding..." : buttonLabel}
            </button>
          </div>
        )}
        {fineprint && state.kind !== "success" ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{fineprint}</p>
        ) : null}
        {state.kind === "error" ? (
          <p role="alert" className="mt-2 text-sm font-semibold text-[var(--color-danger)]">
            {state.message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className ?? STACKED_SHELL}>
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {kicker ?? "Get updates"}
      </p>
      <p className="text-sm text-[var(--color-ink-soft)] mb-3">
        {blurb ??
          (emailEnabled
            ? "No algorithm. No platform. Straight to your inbox or phone when there's something new — fill in whichever you prefer."
            : "No algorithm. No platform. Drop your number and I'll text you the moment there's something new.")}
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
            className="min-h-11 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
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
          className="min-h-11 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={state.kind === "submitting"}
          className="btn-accent min-h-11 w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {state.kind === "submitting" ? "Adding..." : "Subscribe"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-muted)] leading-relaxed">
        {emailEnabled
          ? "No spam, ever. Unsubscribe anytime."
          : "Your number is stored until SMS updates go live — unsubscribe anytime."}
      </p>
      {state.kind === "success" && (
        <p className="mt-3 text-sm text-[var(--color-success)]">{state.message}</p>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{state.message}</p>
      )}
    </form>
  );
}
