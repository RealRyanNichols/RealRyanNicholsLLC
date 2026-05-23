"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Pulse = {
  reading_now: number;
  today: number;
  week: number;
  site_reading_now: number;
};

// Shared poller. Hits post_live_pulse(path) every 12s. Starts from the
// server-rendered seed so the first paint already has real numbers.
function useLivePulse(path: string, seed?: Partial<Pulse>): Pulse {
  const [pulse, setPulse] = useState<Pulse>({
    reading_now: seed?.reading_now ?? 0,
    today: seed?.today ?? 0,
    week: seed?.week ?? 0,
    site_reading_now: seed?.site_reading_now ?? 0,
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.rpc("post_live_pulse", { p_path: path });
      if (data) setPulse(data as Pulse);
    } catch {
      // Never let a failed poll break the page.
    }
  }, [path]);

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, 12_000);
    const onVis = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  return pulse;
}

// ─── Compact header strip ─────────────────────────────────────────────
// Sits under the byline. Leads with "N reading right now" when it's
// genuinely live (>=2), otherwise falls back to a strong cumulative
// number so it's never lonely.
export function PostLivePulse({
  path,
  totalViews,
  seed,
}: {
  path: string;
  totalViews: number;
  seed?: Partial<Pulse>;
}) {
  const pulse = useLivePulse(path, seed);
  const live = pulse.reading_now >= 2;
  const today = pulse.today;
  const steady = Math.max(totalViews, pulse.week);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-mono"
      aria-live="polite"
    >
      {live ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {pulse.reading_now.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">reading right now</span>
        </>
      ) : today >= 5 ? (
        <>
          <span className="text-[var(--color-muted)]">👁</span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {today.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">read this today</span>
        </>
      ) : (
        <>
          <span className="text-[var(--color-muted)]">👁</span>
          <span className="text-[var(--color-ink)] font-bold tabular-nums">
            {steady.toLocaleString()}
          </span>
          <span className="text-[var(--color-muted)]">
            {steady === 1 ? "read" : "reads"}
          </span>
        </>
      )}
    </span>
  );
}

// ─── Peak capture block ───────────────────────────────────────────────
// Goes right after the article body — the emotional peak, when the
// reader just finished. Wraps the email capture in live social proof so
// the ask lands at the moment of maximum attention.
type CaptureState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function PostFollowCapture({
  path,
  seed,
}: {
  path: string;
  seed?: Partial<Pulse>;
}) {
  const pulse = useLivePulse(path, seed);
  const [state, setState] = useState<CaptureState>({ kind: "idle" });
  const [email, setEmail] = useState("");

  // The social-proof line above the form. Prefer live, fall back to a
  // strong cumulative count — never show a lonely "1".
  const proof =
    pulse.reading_now >= 2
      ? `${pulse.reading_now.toLocaleString()} people are reading this right now.`
      : pulse.today >= 5
        ? `${pulse.today.toLocaleString()} people read this today.`
        : pulse.week >= 5
          ? `${pulse.week.toLocaleString()} people read this in the last week.`
          : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      setState({ kind: "error", message: "Enter your email." });
      return;
    }
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
        message: json.message ?? "You're on the list. Check your inbox to confirm.",
      });
      setEmail("");
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <section className="my-8 rounded-2xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-5 sm:p-7 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: "var(--color-accent-glow)" }}
        aria-hidden
      />
      {proof ? (
        <p
          className="relative inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--color-accent)] mb-2"
          aria-live="polite"
        >
          {pulse.reading_now >= 2 ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          ) : null}
          {proof}
        </p>
      ) : null}

      {state.kind === "success" ? (
        <div className="relative">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-ink)]">
            You&apos;re in.
          </h3>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{state.message}</p>
        </div>
      ) : (
        <div className="relative">
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)]">
            Don&apos;t lose this story to an algorithm.
          </h3>
          <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
            The next chapter gets posted here first — on my own domain,
            where no platform can throttle it and no one can ban it. Drop
            your email and it lands in your inbox the moment it&apos;s
            live.
          </p>
          <form
            onSubmit={onSubmit}
            className="mt-4 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              autoComplete="email"
              className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={state.kind === "submitting"}
              className="btn-accent rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-60 whitespace-nowrap"
            >
              {state.kind === "submitting" ? "Adding…" : "Follow this story →"}
            </button>
          </form>
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            One confirmation click. Unsubscribe anytime. No spam, no
            selling your data — ever.
          </p>
          {state.kind === "error" ? (
            <p className="mt-2 text-sm text-red-700">{state.message}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
