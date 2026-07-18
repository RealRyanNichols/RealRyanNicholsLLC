"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// The wall. Shown in place of the deep record when a visitor hasn't given a
// name and a working email yet. It also records that the wall was hit, so the
// archive has a real funnel: how many people reached for the record, and how
// many actually signed their name to get it.

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
  const logged = useRef(false);

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
        });
      } catch {
        // Never let analytics break the page.
      }
    })();
  }, [path, resourceType, resourceSlug]);

  const next = encodeURIComponent(path);

  if (unconfirmed) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
          One click left
        </p>
        <h2 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          Check your email and confirm.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
          Your account exists, but the address hasn&rsquo;t been confirmed yet.
          Click the link I sent you and the full record opens — this one and
          every other file in the archive.
        </p>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          No email? Check spam, then{" "}
          <Link href="/contact" className="font-semibold text-[var(--color-navy)] underline">
            tell me and I&rsquo;ll fix it
          </Link>
          .
        </p>
      </div>
    );
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
          Put your name on it and the file opens.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
          This archive costs nothing and it always will. J6 profiles are free,
          forever. But I don&rsquo;t hand the deep record to ghosts. A real name
          and a working email — that&rsquo;s the whole price
          {title ? <> for <span className="font-semibold">{title}</span></> : null}
          , and it opens every file in the archive, not just this one.
        </p>

        <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
          <li>· Every document, exhibit, and filing — unlocked</li>
          <li>· No charge, no card, no subscription</li>
          <li>· No anonymous accounts. That&rsquo;s how the trolls stay out.</li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/login?mode=signup&next=${next}`}
            className="btn-accent rounded-full px-6 py-3 text-sm font-bold"
          >
            Open the record — free
          </Link>
          {!signedIn ? (
            <Link
              href={`/login?mode=signin&next=${next}`}
              className="rounded-full border-2 border-[var(--color-navy)]/40 px-6 py-3 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
            >
              I already have an account
            </Link>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
          Are you a J6 defendant or family? Your profile is free and always will
          be —{" "}
          <Link href="/j6" className="font-semibold text-[var(--color-navy)] underline">
            claim it here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
