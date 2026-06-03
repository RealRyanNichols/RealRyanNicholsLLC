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

// Live operator strip above the main header. Polls site_totals every 30s.
// The old version was raw counters; this reads as a compact command bar:
// who's here now, where they're coming from, and the permanent archive depth.
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
    <div className="border-b border-[#243452] bg-[#0b1428] text-[#cfd9ea]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        <Link
          href="/the-map-room"
          className="hidden min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#2f4368] bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#fdf8ea] transition hover:border-[#7fe3a9] hover:text-[#7fe3a9] sm:inline-flex"
        >
          <span className="h-2 w-2 rounded-full bg-[#7fe3a9] shadow-[0_0_18px_rgba(127,227,169,0.9)]" />
          Live Ops
        </Link>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-3 items-center gap-1 text-[9px] font-mono uppercase tracking-wider sm:flex sm:text-[10px]">
            <Cell
              color="#7fe3a9"
              pulse
              label="live"
              value={t?.live_now ?? 0}
              featured
            />
            <Cell label="countries" value={t?.countries_now ?? 0} />
            <Cell label="defendants" value={t?.defendants ?? 0} />
            <Cell label="docs" value={t?.documents ?? 0} className="max-sm:!hidden" />
            <Cell
              label="days since pardon"
              value={t?.days_since_pardon ?? 0}
              className="max-md:!hidden"
            />
          </div>
        </div>

        <Link
          href="/the-map-room"
          className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-[#2f4368] bg-[#142447] px-2.5 text-[10px] font-black uppercase tracking-wider text-[#fdf8ea] transition hover:border-[#7fe3a9] hover:text-[#7fe3a9] sm:px-3"
        >
          Map <span className="hidden sm:inline">Room</span> <span aria-hidden>→</span>
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
  featured = false,
}: {
  color?: string;
  pulse?: boolean;
  label: string;
  value: number;
  suffix?: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-8 min-w-0 items-center justify-center gap-1 rounded-full border px-1.5 sm:px-2.5",
        featured
          ? "border-[#7fe3a9]/50 bg-[#7fe3a9]/10"
          : "border-[#2f4368] bg-white/5",
        className,
      ].join(" ")}
    >
      {pulse ? (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: color ?? "#7fe3a9" }}
          aria-hidden
        />
      ) : null}
      <span
        className="font-black tabular-nums text-[var(--color-paper)]"
        style={color ? { color } : undefined}
      >
        {value.toLocaleString()}
      </span>
      <span className="opacity-75">{label}</span>
      {suffix ? <span className="opacity-50 hidden sm:inline">{suffix}</span> : null}
    </span>
  );
}
