import type { ReactNode } from "react";

// The server-renderable shell around the live radar. It carries the one
// number that must be in the HTML with JavaScript off — `live_now` from
// site_totals() — plus the country count from the same payload. The heavy
// map (d3-geo + two atlases) mounts inside it on the client only, so the
// page never ships hundreds of kilobytes of path data.
export function RadarFrame({
  liveNow,
  countriesNow,
  children,
}: {
  liveNow: number;
  countriesNow: number;
  children?: ReactNode;
}) {
  return (
    <div
      data-radar-frame
      className="relative min-h-[240px] overflow-hidden rounded-2xl border-2 border-[var(--color-blue)] bg-[#0e1a36] aspect-[4/3] sm:min-h-0 sm:aspect-[16/9] lg:aspect-[2/1]"
    >
      {children}

      {/* Headline overlay. pointer-events-none so a drag that starts on the
          number still pans the map underneath. */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 select-none">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-live)]">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-live)] animate-pulse" />
          U.S. live radar
        </div>
        <div
          data-live-now
          className="mt-1 text-3xl sm:text-5xl font-bold tabular-nums tracking-tight font-display text-[var(--color-paper)] leading-none drop-shadow"
        >
          {liveNow.toLocaleString()}
        </div>
        <div className="text-[11px] text-[#a9b7d0] leading-snug">
          {liveNow === 1 ? "visitor" : "visitors"} right now · {countriesNow.toLocaleString()}{" "}
          {countriesNow === 1 ? "country" : "countries"}
        </div>
      </div>

      <noscript>
        <p className="absolute bottom-3 left-3 right-3 z-10 text-[11px] text-[#a9b7d0]">
          The count above is live. Turn on JavaScript to see where each visitor
          is reading from.
        </p>
      </noscript>
    </div>
  );
}
