"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeSiteTotals, type SiteTotals } from "@/lib/site-totals";
import type { RadarPing } from "@/lib/radar-pings";
import { RadarFrame } from "@/components/RadarFrame";
import { HotRightNow } from "@/components/HotRightNow";

// The map layer is client-only: it carries d3-geo plus two atlases, and the
// old server-rendered version put a 900KB path string into every page load.
// The RadarFrame around it is server-rendered with the live headline, so a
// visitor with JavaScript off still sees the real number.
const LiveVisitorRadar = dynamic(
  () => import("@/components/LiveVisitorRadar").then((m) => ({ default: m.LiveVisitorRadar })),
  {
    ssr: false,
    loading: () => (
      <p
        data-radar-loading
        className="pointer-events-none absolute bottom-2 left-3 z-10 text-[9px] font-mono uppercase tracking-wider text-[#7c8aa6]"
      >
        Loading live map…
      </p>
    ),
  },
);

// The live wing of the Map Room. Polls site_totals every 20s so the
// headline and counters stay fresh; the radar polls its own ping feed on a
// 10s cadence. The parent page renders the first paint from the same RPC.
export function MapRoomLive({
  initialTotals,
  initialPings,
}: {
  initialTotals: SiteTotals;
  initialPings: RadarPing[];
}) {
  const [totals, setTotals] = useState<SiteTotals>(initialTotals);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function pull() {
      const { data } = await supabase.rpc("site_totals");
      if (!mounted) return;
      if (data) setTotals(normalizeSiteTotals(data));
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
          ping near their city (Vercel's geolocation, rounded to about 11 km
          before it is stored; inside their state without it). Drag or
          one-finger pan, pinch or wheel to zoom, tap a ping for its city and
          state. No trails, no session detail, no addresses, no PII. */}
      <RadarFrame liveNow={totals.live_now} countriesNow={totals.countries_now}>
        <LiveVisitorRadar initial={initialPings} />
      </RadarFrame>
      <p className="text-xs leading-relaxed text-[var(--color-muted)]" data-radar-disclosure>
        What the map shows: one dot per visitor active in the last five minutes, placed from the
        network&apos;s location lookup (Vercel&apos;s geolocation headers) and rounded to about 11 km
        before it is stored, so a dot lands near a town, never on a street. Without a location it sits
        inside the visitor&apos;s state or country. Tap a dot for city and state. No trails, no pages
        read, no addresses, nothing that names a person.
      </p>

      {/* The permanent four — counters that don't move much but anchor
          the page's weight. Big, confident, tabular. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
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

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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

      {/* Hot now ticker — useful, but secondary on mobile. The map should
          hand straight into the numbers before this live path strip. */}
      <HotRightNow initial={[]} />
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
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
      <div className="text-2xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-ink)] sm:text-4xl">
        {value.toLocaleString()}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--color-muted)] font-bold sm:mt-2 sm:text-[10px]">
        {label}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[10px] text-[var(--color-ink-soft)] sm:text-[11px]">
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
    <div className="rounded-lg border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3">
      <div className="text-2xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-blue)] sm:text-4xl">
        {value.toLocaleString()}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--color-blue)] font-bold sm:mt-2 sm:text-[10px]">
        {label}
      </div>
      <div className="mt-0.5 text-[10px] text-[var(--color-ink-soft)] sm:text-[11px]">
        {sub}
      </div>
    </div>
  );
}
