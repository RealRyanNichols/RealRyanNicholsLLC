"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookEmailSignup } from "./BookEmailSignup";

/**
 * One-time (per session) exit-intent offer. Triggers when the cursor leaves the
 * top of the viewport (desktop) or after a dwell timeout (mobile fallback).
 */
export function BookExitIntent({
  priceLabel,
  listLabel,
}: {
  priceLabel: string;
  listLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rrn_book_exit") === "1") return;
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      sessionStorage.setItem("rrn_book_exit", "1");
      setOpen(true);
    };
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) fire();
    };
    document.addEventListener("mouseout", onMouseOut);
    const timer = window.setTimeout(fire, 40000); // mobile / no-mouse fallback
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 text-2xl leading-none text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ×
        </button>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Before you go
        </p>
        <h2 className="mt-2 font-display text-2xl font-black leading-tight text-[var(--color-ink)]">
          Lock in the {priceLabel} launch price
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
          The digital edition of <span className="font-black">Fighting Shadows</span>{" "}
          is{" "}
          {listLabel ? (
            <span className="line-through opacity-60">{listLabel}</span>
          ) : null}{" "}
          <span className="font-black text-[var(--color-accent)]">
            {priceLabel}
          </span>{" "}
          for early supporters. Don&rsquo;t miss it.
        </p>
        <Link
          href="/book/preorder"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Pre-order for {priceLabel}
        </Link>
        <div className="my-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
          <span className="h-px flex-1 bg-[var(--color-line)]" />
          or just get on the list
          <span className="h-px flex-1 bg-[var(--color-line)]" />
        </div>
        <BookEmailSignup source="book_exit_intent" />
      </div>
    </div>
  );
}
