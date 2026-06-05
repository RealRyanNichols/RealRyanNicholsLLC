"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const inputClass =
  "w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]";

export function BookWaitlist({
  source = "book_page",
  tone = "light",
  onSuccess,
}: {
  source?: string;
  tone?: "light" | "dark";
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ position: number | null } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent("book_waitlist_attempt", { source });
    try {
      const res = await fetch("/api/book-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        position?: number | null;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        trackEvent("book_waitlist_failed", { source, status: res.status });
        setError(json.error ?? "Could not save your spot. Try again.");
        return;
      }
      trackEvent("book_waitlist_success", { source });
      setDone({ position: json.position ?? null });
      onSuccess?.();
    } catch {
      trackEvent("book_waitlist_failed", { source, reason: "network" });
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
          {done.position ? `You're #${done.position} in line.` : "You're on the list."}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
          Watch your email and phone — the list learns the release date first
          and gets first chance to own Fighting Shadows. Thank you for being
          early.
        </p>
      </div>
    );
  }

  const labelClass =
    tone === "dark"
      ? "text-xs font-black uppercase tracking-[0.14em] text-[#d8c89e]"
      : "text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className={labelClass}>Name</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          maxLength={120}
          placeholder="Your name"
          className={inputClass}
        />
      </label>
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
          <span className={labelClass}>Phone</span>
          <input
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="(555) 555-5555"
            className={inputClass}
          />
        </label>
      </div>
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
        {busy ? "Saving your spot..." : "Reserve my spot on the list"}
      </button>
      <p
        className={
          tone === "dark"
            ? "text-center text-[11px] font-semibold text-[#cfd9ea]"
            : "text-center text-[11px] font-semibold text-[var(--color-muted)]"
        }
      >
        No spam. The list gets the release date and first chance to buy.
      </p>
    </form>
  );
}
