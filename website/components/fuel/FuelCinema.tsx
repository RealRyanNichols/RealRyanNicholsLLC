"use client";

import { useEffect, useRef, useState } from "react";

// The moving parts of /fuel, the same theater as /the-story. Everything on
// the page is server-rendered and readable with JavaScript off; this adds
// the gold reading rail across the top, the chapter rail on wide screens,
// the film grain, and the observers that reveal panels and count the live
// numbers up. Every effect respects prefers-reduced-motion.

export type Stop = { id: string; label: string };

export function FuelCinema({ stops }: { stops: Stop[] }) {
  const barRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const theater = document.querySelector<HTMLElement>(".ft-theater");
    if (!theater) return;
    theater.classList.add("is-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal once, the first time a panel or a chapter enters the viewport.
    const revealEls = Array.from(theater.querySelectorAll<HTMLElement>("[data-reveal], .ft-chapter"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    revealEls.forEach((el) => io.observe(el));

    // Live numbers count up from zero when they come into view.
    const counters = Array.from(theater.querySelectorAll<HTMLElement>("[data-count]"));
    const cio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          runCount(e.target as HTMLElement, reduce);
          cio.unobserve(e.target);
        }
      },
      { threshold: 0.4 },
    );
    counters.forEach((el) => cio.observe(el));

    // Which chapter owns the middle of the screen right now.
    const sections = Array.from(theater.querySelectorAll<HTMLElement>("[data-chapter]"));
    const aio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.chapter);
          if (Number.isFinite(n)) setActive(n - 1);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((s) => aio.observe(s));

    // Grain and rail only while the theater itself is on screen.
    const tio = new IntersectionObserver((entries) => setOn(entries.some((e) => e.isIntersecting)), {
      threshold: 0,
    });
    tio.observe(theater);

    // Reading progress across the top.
    let raf = 0;
    const tick = () => {
      raf = 0;
      const rect = theater.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      cio.disconnect();
      aio.disconnect();
      tio.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="ft-progress" aria-hidden>
        <i ref={barRef} />
      </div>
      <nav className={`ft-rail ${on ? "is-on" : ""}`} aria-label="Sections">
        {stops.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={i === active ? "is-active" : i < active ? "is-done" : ""}
            aria-current={i === active ? "true" : undefined}
          >
            {String(i + 1).padStart(2, "0")}
            <span>{s.label}</span>
          </a>
        ))}
      </nav>
      <div className={`ft-grain ${on ? "is-on" : ""}`} aria-hidden />
    </>
  );
}

function runCount(el: HTMLElement, reduce: boolean) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
  if (reduce) {
    el.textContent = fmt(target);
    return;
  }
  const dur = 1700;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(target * eased);
    if (k < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
