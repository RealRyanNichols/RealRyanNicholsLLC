"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { WorldMap } from "@/components/WorldMap";
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
    <div className="space-y-6">
      {/* Hero ticker */}
      <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-paper)] to-[var(--color-surface)] p-5 sm:p-7">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-success)] font-bold">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
          LIVE — last 5 min
        </div>
        <div className="mt-3 flex items-baseline gap-3 flex-wrap">
          <div className="text-5xl sm:text-7xl font-bold tabular-nums tracking-tight font-display text-[var(--color-accent)] leading-none">
            {totals.live_now.toLocaleString()}
          </div>
          <div className="text-base sm:text-lg font-bold text-[var(--color-ink)]">
            {totals.live_now === 1 ? "person reading" : "people reading"} the
            case
          </div>
        </div>
        <div className="mt-2 text-sm text-[var(--color-ink-soft)]">
          From{" "}
          <strong className="text-[var(--color-ink)] tabular-nums">
            {totals.countries_now}
          </strong>{" "}
          {totals.countries_now === 1 ? "country" : "countries"} right now.
        </div>
      </div>

      {/* World map */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 sm:p-5">
        {countries.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-center">
            <p className="text-sm text-[var(--color-ink-soft)] italic max-w-md">
              No one online in the last 5 minutes. When somebody opens the
              case, a dot appears here — country-level only, no names, no
              cities, no IPs stored.
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
        {knownCountries.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 justify-center text-[10px] uppercase tracking-wider font-bold">
            {knownCountries.slice(0, 12).map((c) => (
              <span
                key={c.country}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 flex items-center gap-1.5"
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
