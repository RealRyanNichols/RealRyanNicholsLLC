"use client";

import { useCallback, useEffect, useState } from "react";

// The rescue record, in pictures. Self-hosted at /rescues/rescue-NNN.jpg on the
// domain (great for image search). Screened set — real hurricane/flood rescue
// work only. Descriptive, rotating alt text so Google Image search can read
// every frame: this is Ryan Nichols pulling people out of the water.

const ALTS = [
  "Ryan Nichols on a hurricane flood rescue, pulling people and pets to safety",
  "Ryan Nichols search and rescue — boat rescue in floodwater after a hurricane",
  "Rescue the Universe volunteers evacuating families from rising floodwater",
  "Ryan Nichols carrying flood victims to safety during a Texas hurricane rescue",
  "Disaster relief — Ryan Nichols delivering supplies to a flooded community",
  "Ryan Nichols wading through floodwater on a search-and-rescue operation",
  "Hurricane rescue boat operation led by Ryan Nichols and Rescue the Universe",
  "Ryan Nichols pulling a stranded family out of hurricane floodwaters",
];

export function RescueGallery({ count = 54 }: { count?: number }) {
  const [open, setOpen] = useState<number | null>(null);

  const src = (i: number) => `/rescues/rescue-${String(i + 1).padStart(3, "0")}.jpg`;
  const alt = (i: number) => ALTS[i % ALTS.length];

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((o) => (o === null ? o : (o + d + count) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]"
            aria-label={`Open rescue photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src(i)}
              alt={alt(i)}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open !== null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full border border-white/30 px-3 py-1 text-sm font-bold text-white hover:bg-white/10"
          >
            Close ✕
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            className="absolute left-3 rounded-full border border-white/30 px-3 py-2 text-xl font-bold text-white hover:bg-white/10 sm:left-6"
            aria-label="Previous"
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src(open)}
            alt={alt(open)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            className="absolute right-3 rounded-full border border-white/30 px-3 py-2 text-xl font-bold text-white hover:bg-white/10 sm:right-6"
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-xs font-semibold text-white">
            {open + 1} / {count} · realryannichols.com
          </div>
        </div>
      ) : null}
    </div>
  );
}
