"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSessionId, getVisitorId } from "@/lib/client-ids";
import { trackEvent } from "@/lib/analytics";

// The wall.
//
// It used to demand an account and a confirmed email before anyone saw a
// document. It logged 1,022 blocked opens and captured zero addresses off
// them, because the confirmation click was a door nobody could walk
// through. Now it is one field. Type an email, the file opens on the spot,
// and the whole archive opens with it.
//
// The trade has not changed: the record is free, and it is not anonymous.

export function RecordWall({
  path,
  resourceType,
  resourceSlug,
  title,
  signedIn = false,
  unconfirmed = false,
}: {
  path: string;
  resourceType: string;
  resourceSlug: string;
  title?: string;
  signedIn?: boolean;
  unconfirmed?: boolean;
}) {
  const router = useRouter();
  const logged = useRef(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        await supabase.from("gate_events").insert({
          path,
          resource_type: resourceType,
          resource_slug: resourceSlug,
          outcome: "blocked",
          session_key: getSessionId(),
        });
      } catch {
        // Never let analytics break the page.
      }
    })();
  }, [path, resourceType, resourceSlug]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent("record_unlock_attempt", { slug: resourceSlug });
    try {
      const res = await fetch("/api/record-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || null,
          path,
          resourceType,
          resourceSlug,
          sessionId: getSessionId(),
          visitorId: getVisitorId(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "That did not go through. Try again.");
        trackEvent("record_unlock_failed", { slug: resourceSlug });
        setBusy(false);
        return;
      }
      trackEvent("record_unlock_success", { slug: resourceSlug });
      router.refresh();
    } catch {
      setError("That did not go through. Try again.");
      trackEvent("record_unlock_failed", { slug: resourceSlug });
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40">
      {/* The teased record — blurred edge so it's obvious something real is here */}
      <div className="relative h-28 bg-gradient-to-b from-[var(--color-navy)]/15 to-transparent">
        <div className="absolute inset-0 flex items-end justify-center pb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-navy)]/70">
            The record continues
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Free — but not anonymous
        </p>
        <h2 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          One email and the file opens.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
          This archive costs nothing and it always will. J6 profiles are free,
          forever. But I don&rsquo;t hand the deep record to ghosts. A working
          email — that&rsquo;s the whole price
          {title ? <> for <span className="font-semibold">{title}</span></> : null}
          , and it opens every file in the archive, not just this one.
        </p>

        {unconfirmed ? (
          <p className="mt-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
            You already started an account here. You don&rsquo;t need to finish
            it. Put your email in the box and the record opens right now.
          </p>
        ) : null}

        <form onSubmit={unlock} className="mt-6 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              aria-label="Your email"
              className="w-full flex-1 rounded-full border-2 border-[var(--color-navy)]/25 bg-[var(--color-paper)] px-5 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-accent rounded-full px-6 py-3 text-sm font-bold disabled:opacity-60"
            >
              {busy ? "Opening…" : "Open the record"}
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            autoComplete="name"
            aria-label="Your name, optional"
            className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] sm:max-w-xs"
          />
          {error ? (
            <p className="text-sm font-semibold text-[var(--color-accent)]">{error}</p>
          ) : null}
        </form>

        <ul className="mt-5 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
          <li>· Every document, exhibit, and filing — unlocked, right now</li>
          <li>· No account, no password, no confirmation email to hunt for</li>
          <li>· No charge, no card, no subscription</li>
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
          Are you a J6 defendant or family? Your profile is free and always will
          be —{" "}
          <Link href="/j6" className="font-semibold text-[var(--color-navy)] underline">
            claim it here
          </Link>
          .
          {!signedIn ? (
            <>
              {" "}
              Already have an account?{" "}
              <Link
                href={`/login?mode=signin&next=${encodeURIComponent(path)}`}
                className="font-semibold text-[var(--color-navy)] underline"
              >
                Sign in
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
