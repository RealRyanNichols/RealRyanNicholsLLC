"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LiveVisitorRadar } from "@/components/LiveVisitorRadar";
import { HotRightNow } from "@/components/HotRightNow";

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

// The live wing of the Map Room. Polls site_totals every 20s so the
// counters stay fresh; the radar component polls its own ping feed on a
// 10s cadence. Server renders the first paint via the parent page; this
// component takes over once mounted.
export function MapRoomLive({
  initialTotals,
}: {
  initialTotals: Totals;
}) {
  const [totals, setTotals] = useState<Totals>(initialTotals);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function pull() {
      const { data } = await supabase.rpc("site_totals");
      if (!mounted) return;
      if (data) setTotals(data as Totals);
    }
    const id = window.setInterval(pull, 20_000);
    void pull();
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Interactive live radar — every active visitor is an individual
          ping. Pan with drag, zoom with wheel / +- buttons, click a
          ping to see that visitor's full activity trail (which pages
          they've viewed and how long they stayed on each). Public, no
          PII (city-level geo only, session ids hashed). */}
      <LiveVisitorRadar initial={[]} />

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
