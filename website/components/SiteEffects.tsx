"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The theater's moving parts, mounted once in the root layout: the film
// grain sheet, and the observers that reveal anything carrying data-reveal
// and count up anything carrying data-count. Everything is server-rendered
// and readable with JavaScript off (the html.is-js class gates every
// hidden-until-revealed state in CSS); reduced motion turns it all still.
// Admin pages take the tokens and nothing else.

export function SiteEffects() {
  const pathname = usePathname();
  const admin = !!pathname && pathname.startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const seen = new WeakSet<Element>();
    const scan = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not(.is-in)")) {
        if (seen.has(el)) continue;
        seen.add(el);
        io.observe(el);
      }
      for (const el of document.querySelectorAll<HTMLElement>("[data-count]")) {
        if (seen.has(el)) continue;
        seen.add(el);
        cio.observe(el);
      }
    };
    scan();

    // Client-rendered lists (feeds, search results) arrive after mount;
    // rescan once per frame at most when the tree changes.
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (!raf) raf = window.requestAnimationFrame(() => { raf = 0; scan(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      cio.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return admin ? null : <div className="grain" aria-hidden />;
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
