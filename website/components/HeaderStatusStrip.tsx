"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Totals = {
  defendants?: number;
  documents?: number;
  live_now?: number;
  countries_now?: number;
  days_since_pardon?: number;
};

// Terminal-style status strip that sits above the main header. Polls
// site_totals every 30s. Reads as a war-room console: live count,
// country count, archive depth, days-since-pardon ticker. Pure
// monospace. Two lines on mobile, one on desktop.
export function HeaderStatusStrip() {
  const [t, setT] = useState<Totals | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();
    async function pull() {
      const { data } = await supabase.rpc("site_totals");
      if (mounted && data) setT(data as Totals);
    }
    void pull();
    const id = window.setInterval(pull, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="border-b border-[var(--color-line)] bg-[#0e1a36] text-[#cfd9ea]">
      <div className="mx-auto max-w-5xl px-4 py-1.5 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider">
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto flex-nowrap">
          <Cell color="#7fe3a9" pulse label="LIVE" value={t?.live_now ?? 0} suffix="reading" />
          <Cell label="countries" value={t?.countries_now ?? 0} />
          <Cell label="defendants" value={t?.defendants ?? 0} />
          <Cell label="docs" value={t?.documents ?? 0} className="hidden sm:flex" />
          <Cell
            label="days since pardon"
            value={t?.days_since_pardon ?? 0}
            className="hidden md:flex"
          />
        </div>
        <Link
          href="/the-map-room"
          className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[var(--color-paper)] hover:text-[#7fe3a9] transition"
        >
          map room <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function Cell({
  color,
  pulse,
  label,
  value,
  suffix,
  className = "",
}: {
  color?: string;
  pulse?: boolean;
  label: string;
  value: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={`flex items-baseline gap-1 flex-nowrap ${className}`}>
      {pulse ? (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse"
          style={{ background: color ?? "#7fe3a9" }}
          aria-hidden
        />
      ) : null}
      <span
        className="font-bold tabular-nums text-[var(--color-paper)]"
        style={color ? { color } : undefined}
      >
        {value.toLocaleString()}
      </span>
      <span className="opacity-70">{label}</span>
      {suffix ? <span className="opacity-50 hidden sm:inline">{suffix}</span> : null}
    </span>
  );
}
