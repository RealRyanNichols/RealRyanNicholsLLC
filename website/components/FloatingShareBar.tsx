"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildShareIntents,
  formatShareCount,
  recordShare,
  type CaseKind,
} from "@/lib/share";

// A share rail that follows the reader as they scroll. It fades in once they're
// past the opening fold (so it never competes with the in-header Share button),
// stays out of the way, and keeps the highest-intent channels — plus a live,
// ticking share count — one tap away at every scroll depth. Vertical on
// desktop, a slim docked bar on mobile.

const SHOW_AFTER_PX = 650;

export function FloatingShareBar({
  url,
  title,
  slug,
  caseKind,
  shares = 0,
}: {
  url: string;
  title: string;
  slug?: string;
  caseKind?: CaseKind;
  shares?: number;
}) {
  const [scrolledPast, setScrolledPast] = useState(false);
  // Stands down while the article's next step (components/article/
  // ArticleNextStep.tsx) is on screen: on a phone the rail sits over its
  // right edge, on top of the book cover and the email field.
  const [overNextStep, setOverNextStep] = useState(false);
  const visible = scrolledPast && !overNextStep;
  const [copied, setCopied] = useState(false);
  const [popped, setPopped] = useState(false);
  const [localShares, setLocalShares] = useState(0);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolledPast(window.scrollY > SHOW_AFTER_PX);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (popTimer.current) clearTimeout(popTimer.current);
    };
  }, []);

  useEffect(() => {
    const target = document.querySelector("[data-article-next-step]");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOverNextStep(entry.isIntersecting));
    io.observe(target);
    return () => io.disconnect();
  }, []);

  function pop() {
    setLocalShares((n) => n + 1);
    setPopped(true);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopped(false), 500);
  }

  function onShare(platform: string) {
    recordShare({ action: "share_platform", platform, title, slug, caseKind });
    pop();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      recordShare({ action: "share_copy", platform: "copy", title, slug, caseKind });
      pop();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const intents = buildShareIntents(url, title).filter((i) =>
    ["X", "Truth", "Facebook", "Text"].includes(i.name)
  );
  const count = (shares ?? 0) + localShares;

  function Channels({ cls = "h-10 w-10 text-lg" }: { cls?: string }) {
    return (
      <>
        {intents.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target={p.scheme ? undefined : "_blank"}
            rel={p.scheme ? undefined : "noopener noreferrer"}
            onClick={() => onShare(p.name)}
            aria-label={`Share on ${p.name}`}
            title={`Share on ${p.name}`}
            className={`inline-flex ${cls} items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] font-bold text-[var(--color-ink)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] hover:scale-110 transition`}
          >
            <span aria-hidden>{p.icon}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          title="Copy link"
          className={`inline-flex ${cls} items-center justify-center rounded-full border transition hover:scale-110 ${
            copied
              ? "border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-navy)]"
              : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          }`}
        >
          <span aria-hidden>{copied ? "✓" : "🔗"}</span>
        </button>
      </>
    );
  }

  const countPill = (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-[var(--color-cream)] ${
        popped ? "animate-share-pop" : ""
      }`}
    >
      🔥 {formatShareCount(count)}
    </span>
  );

  return (
    <>
      {/* Wide desktop: keep the rail off article content on laptop-width screens. */}
      <div
        className={`fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/95 p-2 shadow-xl backdrop-blur transition-all duration-300 xl:flex ${
          visible ? "opacity-100 translate-x-0" : "pointer-events-none -translate-x-4 opacity-0"
        }`}
        aria-label="Share this page"
      >
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Share
        </span>
        <Channels />
        {count > 0 ? countPill : null}
      </div>

      {/* Mobile: the same vertical "scroller" as desktop, but pinned to the
          right edge and kept thin/translucent so the words still read past it. */}
      <div
        className={`fixed right-1 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/90 p-1 shadow-xl backdrop-blur transition-all duration-300 md:hidden ${
          visible ? "opacity-100 translate-x-0" : "pointer-events-none translate-x-6 opacity-0"
        }`}
        aria-label="Share this page"
      >
        {/* Full 44px thumbs; the bar stays translucent so text reads past it. */}
        <Channels cls="h-11 w-11 text-base" />
        {count > 0 ? countPill : null}
      </div>
    </>
  );
}
