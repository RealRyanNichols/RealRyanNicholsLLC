"use client";

import { useEffect, useRef, useState } from "react";
import { CASE_CHAPTERS, CHAPTER_ORDINAL } from "./chapters";

// The spine made visible. One component, two shapes:
//   rail  — desktop (lg+), sticky beside the story, the current chapter
//           carried on a navy rule.
//   chips — phones, a horizontally scrollable row under the hero. In flow,
//           never fixed: the phone already has the mobile bar at the bottom,
//           and nothing else may sit on top of the column on first load.
// The current chapter is the last one whose top has crossed the reading line
// (140px from the top of the viewport); computed on scroll, never during
// render, so the server and the first client render agree.

const READING_LINE = 140;

function label(c: (typeof CASE_CHAPTERS)[number]): string {
  return c.n ? `${CHAPTER_ORDINAL[c.n]} · ${c.short}` : c.short;
}

export function CaseChapterNav({
  variant,
  chapters = CASE_CHAPTERS,
}: {
  variant: "rail" | "chips";
  // The page passes the stops it actually rendered, so the nav never links
  // to a section that is not on the page (Chapter Four is conditional).
  chapters?: readonly (typeof CASE_CHAPTERS)[number][];
}) {
  const [current, setCurrent] = useState<string | null>(null);
  const scroller = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let active: string | null = null;
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= READING_LINE) active = c.id;
      }
      setCurrent(active);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [chapters]);

  // Keep the active chip in view — scroll the row only, never the page.
  useEffect(() => {
    if (variant !== "chips" || !current || !scroller.current) return;
    const chip = scroller.current.querySelector<HTMLElement>(`[data-chip="${current}"]`);
    if (!chip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.current.scrollTo({
      left: Math.max(0, chip.offsetLeft - 16),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [current, variant]);

  if (variant === "rail") {
    return (
      <nav aria-label="Chapters" className="text-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
          The chapters
        </p>
        <ol className="mt-3 border-l-2 border-[var(--color-line)]">
          {chapters.map((c) => {
            const active = current === c.id;
            return (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={active ? "location" : undefined}
                  className={[
                    "-ml-0.5 block border-l-2 py-1.5 pl-3 font-semibold leading-snug transition",
                    active
                      ? "border-[var(--color-navy)] text-[var(--color-navy)]"
                      : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-navy)]",
                  ].join(" ")}
                >
                  {label(c)}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      ref={scroller}
      aria-label="Chapters"
      className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex w-max gap-2 py-1">
        {chapters.map((c) => {
          const active = current === c.id;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                data-chip={c.id}
                aria-current={active ? "location" : undefined}
                className={[
                  "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-3.5 text-xs font-bold transition",
                  active
                    ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]",
                ].join(" ")}
              >
                {label(c)}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
