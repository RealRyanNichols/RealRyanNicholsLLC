"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const inputClass =
  "w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]";

/**
 * Consent-based email capture for the book section. Posts to /api/book-signup
 * which stores the signup in `book_email_signups` (dedupes on email, requires
 * consent). Use `tone="dark"` on the navy sections.
 */
export function BookEmailSignup({
  source = "book",
  tone = "light",
}: {
  source?: string;
  tone?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!consent) {
      setError("Please check the box so I can email you updates.");
      return;
    }
    setBusy(true);
    setError(null);
    trackEvent("book_signup_attempt", { source });
    try {
      const res = await fetch("/api/book-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source_page: source, consent }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        trackEvent("book_signup_failed", { source, status: res.status });
        setError(json.error ?? "Could not save your signup. Try again.");
        return;
      }
      trackEvent("book_signup_success", { source });
      setDone(true);
    } catch {
      trackEvent("book_signup_failed", { source, reason: "network" });
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] p-5 text-center sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-success)]">
          You are on the list
        </p>
        <h3 className="mt-2 font-display text-2xl font-black text-[var(--color-ink)] sm:text-3xl">
          Thank you. You will hear it from me first.
        </h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
          Writing, editing, and printing milestones, the release date, and the
          opening chapter free — straight to your inbox.
        </p>
      </div>
    );
  }

  const labelClass =
    tone === "dark"
      ? "text-xs font-black uppercase tracking-[0.14em] text-[#d8c89e]"
      : "text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]";
  const consentTextClass =
    tone === "dark"
      ? "text-sm font-semibold leading-snug text-[#cfd9ea]"
      : "text-sm font-semibold leading-snug text-[var(--color-ink-soft)]";
  const microClass =
    tone === "dark"
      ? "text-center text-[11px] font-semibold text-[#cfd9ea]"
      : "text-center text-[11px] font-semibold text-[var(--color-muted)]";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={labelClass}>Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Name (optional)</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            maxLength={120}
            placeholder="Your name"
            className={inputClass}
          />
        </label>
      </div>

      <label
        className={
          tone === "dark"
            ? "flex gap-3 rounded-md border border-white/15 bg-white/[0.05] p-3"
            : "flex gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
        }
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span className={consentTextClass}>
          Yes, email me book updates from Ryan Nichols. No spam, and you can
          unsubscribe anytime.
        </span>
      </label>

      {error ? (
        <p className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-sm font-bold text-[var(--color-accent)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {busy ? "Adding you..." : "Get book updates"}
      </button>
      <p className={microClass}>
        Updates, the release date, and the opening chapter free.
      </p>
    </form>
  );
}
