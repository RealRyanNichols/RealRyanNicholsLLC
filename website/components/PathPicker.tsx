"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

type Variant = "band" | "overlay";

type Dir = { key: string; label: string; sub: string; href: string };

const DIRECTIONS: Dir[] = [
  { key: "story", label: "Ryan's story & life", sub: "Faith, family, healing, the feed", href: "/" },
  { key: "case", label: "The J6 case & the record", sub: "The evidence archive", href: "/case" },
  { key: "work", label: "Work with Ryan", sub: "Build, tech, the book", href: "/services" },
  { key: "j6_defendant", label: "I'm a J6 defendant or family", sub: "Claim your free profile", href: "/case" },
];

const SOURCES: { key: string; label: string }[] = [
  { key: "x", label: "X / Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "google", label: "Google search" },
  { key: "ai", label: "AI recommended you" },
  { key: "business", label: "Business / work" },
  { key: "word_of_mouth", label: "Word of mouth" },
  { key: "other", label: "Other" },
];

const SEEN_KEY = "rrn_intent_done";
const PROFILE_KEY = "rrn_visitor_profile";

export function PathPicker({ variant = "band" }: { variant?: Variant }) {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"intent" | "source">("intent");
  const [dir, setDir] = useState<Dir | null>(null);

  // Show to anyone we haven't recorded yet — for BOTH the band and the
  // overlay. Once a visitor answers (or dismisses), we never ask again:
  // their choice is stored and used to tailor what they see next.
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function saveProfile(patch: Record<string, string>) {
    try {
      const prev = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ ...prev, ...patch, ts: Date.now() }),
      );
    } catch {
      /* ignore */
    }
  }

  function pickIntent(d: Dir) {
    trackEvent("intent_select", { direction: d.key, placement: variant });
    saveProfile({ direction: d.key });
    setDir(d);
    setStep("source");
  }

  function pickSource(sourceKey: string) {
    trackEvent("acquisition_source", { source: sourceKey, direction: dir?.key ?? null, placement: variant });
    saveProfile({ source: sourceKey });
    markSeen();
    const href = dir?.href ?? "/";
    if (variant === "overlay") setShow(false);
    if (href && href !== "/") router.push(href);
    else setShow(false);
  }

  function dismiss() {
    trackEvent("intent_dismiss", { placement: variant, step });
    markSeen();
    setShow(false);
  }

  // The homepage renders the band inline — the floating overlay stands down
  // there so first-timers aren't asked the same question twice.
  if (variant === "overlay" && pathname === "/") return null;

  if (!show) return null;

  // The floating overlay rides on dark navy so it reads as an intentional
  // card, never camouflage against the cream page. The inline band keeps
  // the paper treatment.
  const dark = variant === "overlay";

  const inner = (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dark ? "text-[#e1bd5b]" : "text-[var(--color-navy)]"}`}>
            {step === "intent" ? "Welcome — glad you're here" : "One more thing"}
          </p>
          <h2 className={`mt-0.5 font-display text-lg font-bold tracking-tight sm:text-xl ${dark ? "text-[#fdf8ea]" : "text-[var(--color-ink)]"}`}>
            {step === "intent" ? "What brings you by today?" : "How'd you find me?"}
          </h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className={`shrink-0 rounded-full p-1 transition ${dark ? "text-[#8194b4] hover:bg-white/10 hover:text-[#fdf8ea]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
      </div>

      {step === "intent" ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => pickIntent(d)}
              className={
                dark
                  ? "group rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-[#e1bd5b] hover:bg-[#e1bd5b]/10"
                  : "group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-left transition hover:border-[var(--color-navy)] hover:bg-[var(--color-blue-soft)]"
              }
            >
              <span className={`block text-sm font-bold ${dark ? "text-[#fdf8ea] group-hover:text-[#e1bd5b]" : "text-[var(--color-ink)] group-hover:text-[var(--color-navy)]"}`}>
                {d.label}
              </span>
              <span className={`mt-0.5 block text-xs ${dark ? "text-[#cfd9ea]" : "text-[var(--color-ink-soft)]"}`}>{d.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => pickSource(s.key)}
              className={
                dark
                  ? "rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-[#fdf8ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
                  : "rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e1bd5b]/40 bg-[#0b1b34]/[0.97] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-sm sm:p-5">
      {inner}
    </section>
  );
}
