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
        className="relative w-full max-w-md rounded-2xl border border-[#e1bd5b]/50 bg-[#0b1b34] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 text-2xl leading-none text-[#8194b4] hover:text-[#fdf8ea]"
        >
          ×
        </button>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e1bd5b]">
          Before you go
        </p>
        <h2 className="mt-2 font-display text-2xl font-black leading-tight text-[#fdf8ea]">
          They tried to bury this story. I wrote it down.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#cfd9ea]">
          <span className="font-black text-[#fdf8ea]">Fighting Shadows</span> — my
          memoir of January 6 — is{" "}
          {listLabel ? (
            <span className="line-through opacity-60">{listLabel}</span>
          ) : null}{" "}
          <span className="font-black text-[#e1bd5b]">{priceLabel}</span> for early
          supporters. Lock it in before it goes.
        </p>
        <Link
          href="/book/preorder"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#e1bd5b] px-5 py-3 text-base font-black text-[#0b1b34] transition hover:brightness-105"
        >
          Pre-order for {priceLabel}
        </Link>
        <div className="my-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider text-[#8194b4]">
          <span className="h-px flex-1 bg-white/15" />
          or just get on the list
          <span className="h-px flex-1 bg-white/15" />
        </div>
        <BookEmailSignup source="book_exit_intent" />
      </div>
    </div>
  );
}
