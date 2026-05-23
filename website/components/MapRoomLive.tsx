"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { WorldMap } from "@/components/WorldMap";
import { HotRightNow } from "@/components/HotRightNow";
import { COUNTRY_COORDS, flagFor, nameFor } from "@/lib/country-coords";

type Country = { country: string; viewers: number };
type Totals = {
  defendants: number;
  defendants_verified: number;
  documents: number;
  grievances: number;
  events: number;
  days_since_pardon: number;
  days_since_dismissal: number;
  live_now: number;
  countries_now: number;
};

// The live wing of the Map Room. Polls site_totals + live_visitor_countries
// every 20s so the page feels alive without hammering Supabase. Server
// renders the first paint via the parent page; this component takes
// over once mounted.
export function MapRoomLive({
  initialTotals,
  initialCountries,
}: {
  initialTotals: Totals;
  initialCountries: Country[];
}) {
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [countries, setCountries] = useState<Country[]>(initialCountries);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function pull() {
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.rpc("site_totals"),
        supabase.rpc("live_visitor_countries"),
      ]);
      if (!mounted) return;
      if (t) setTotals(t as Totals);
      if (c) setCountries(c as Country[]);
    }
    const id = window.setInterval(pull, 20_000);
    // Pull once immediately so the first poll happens right after mount,
    // not 20s later — keeps the counters honest if the SSR'd numbers
    // are even one revalidation cycle stale.
    void pull();
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const knownCountries = countries.filter(
    (c) => COUNTRY_COORDS[c.country?.toUpperCase()],
  );

  return (
    <div className="space-y-5">
      {/* Radar hero — world map first, full-bleed inside a navy command
          surface so the page announces itself as a live ops screen
          before any words are read. Counter overlays on top-left, hot-
          right-now ticker sits on top-right. Visually contrasts the
          parchment archive feel of /case. */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] shadow-[0_10px_40px_-12px_var(--color-accent-glow)]">
        {/* Map fills the surface; we tint the inner SVG via CSS vars so
            the continents read on the navy ground. */}
        <div
          className="px-3 pt-3 pb-4 sm:px-5 sm:pt-5"
          style={
            {
              ["--color-paper" as string]: "#0e1a36",
              ["--color-line" as string]: "#3a557c",
              ["--color-surface" as string]: "#0e1a36",
            } as React.CSSProperties
          }
        >
          {countries.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-center">
              <p className="text-sm text-[#cfd9ea] italic max-w-md">
                Radar quiet — no sessions in the last 5 minutes. The map
                fills the moment somebody opens the case. Country-level
                only, no IPs.
              </p>
            </div>
          ) : (
            <WorldMap
              data={countries.map((c) => ({
                country: c.country,
                views: Number(c.viewers),
              }))}
            />
          )}
        </div>

        {/* Overlay strip: LIVE count + countries, anchored bottom-left
            and bottom-right so they don't collide with the map. */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-5 z-10">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#7fe3a9]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7fe3a9] animate-pulse" />
            Live · last 5 min
          </div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl sm:text-6xl font-bold tabular-nums tracking-tight font-display text-[var(--color-paper)] leading-none drop-shadow">
              {totals.live_now.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#cfd9ea]">
              {totals.live_now === 1 ? "reading" : "reading the case"}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#a9b7d0]">
            from{" "}
            <span className="text-[var(--color-paper)] font-bold tabular-nums">
              {totals.countries_now}
            </span>{" "}
            {totals.countries_now === 1 ? "country" : "countries"}
          </p>
        </div>

        {/* Country chips along the bottom — only renders when we have
            real visitors. Stays in the navy zone for the visual unit. */}
        {knownCountries.length > 0 ? (
          <div className="px-3 pb-3 sm:px-5 sm:pb-4 -mt-1 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider font-bold">
            {knownCountries.slice(0, 14).map((c) => (
              <span
                key={c.country}
                className="rounded-full border border-[#3a557c] bg-[#0a1429] text-[#cfd9ea] px-2.5 py-1 flex items-center gap-1.5"
                title={`${nameFor(c.country)}: ${c.viewers} viewing`}
              >
                <span className="text-sm leading-none" aria-hidden>
                  {flagFor(c.country)}
                </span>
                <span className="tabular-nums">{c.viewers}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Hot now ticker — what's on screens RIGHT NOW. Polls every
          15s, sits directly below the radar so the visitor sees the
          map → "here's what people are looking at" in one glance. */}
      <HotRightNow initial={[]} />

      {/* The permanent four — counters that don't move much but anchor
          the page's weight. Big, confident, tabular. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BigCounter
          value={totals.defendants}
          label="J6 defendants"
          sub={`${totals.defendants_verified.toLocaleString()} verified`}
        />
        <BigCounter
          value={totals.documents}
          label="Documents on file"
        />
        <BigCounter
          value={totals.grievances}
          label="Grievances filed"
        />
        <BigCounter
          value={totals.events}
          label="Events on the timeline"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DayCounter
          value={totals.days_since_pardon}
          label="Days since the pardon"
          sub="January 20, 2025"
        />
        <DayCounter
          value={totals.days_since_dismissal}
          label="Days since charges dismissed with prejudice"
          sub="USAO Edward R. Martin Jr."
        />
      </div>
    </div>
  );
}

function BigCounter({
  value,
  label,
  sub,
}: {
  value: number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3">
      <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-ink)]">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function DayCounter({
  value,
  label,
  sub,
}: {
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-4 py-3">
      <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-blue)]">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-blue)] font-bold">
        {label}
      </div>
      <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">
        {sub}
      </div>
    </div>
  );
}
