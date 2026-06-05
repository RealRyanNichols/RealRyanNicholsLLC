"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Totals = {
  live_now?: number;
  countries_now?: number;
  total_views?: number;
};

// Compact proof strip above the main header. Keep this lean: permanent archive
// counters live on the Map Room, while this only answers "who's here right now?"
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
        <Link
          href="/the-map-room"
          className="inline-flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#2f4368] bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#fdf8ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
        >
          <span className="h-2 w-2 rounded-full bg-[#e1bd5b] shadow-[0_0_18px_rgba(127,227,169,0.9)]" />
          <span className="truncate">
            {(t?.live_now ?? 0).toLocaleString()} live now
          </span>
          <span className="hidden text-[#8ea0bd] sm:inline" aria-hidden>
            /
          </span>
          <span className="hidden text-[#cfd9ea] sm:inline">
            {(t?.countries_now ?? 0).toLocaleString()}{" "}
            {(t?.countries_now ?? 0) === 1 ? "country" : "countries"}
          </span>
          <span className="hidden text-[#8ea0bd] md:inline" aria-hidden>
            /
          </span>
          <span className="hidden text-[#cfd9ea] md:inline">
            {(t?.total_views ?? 0).toLocaleString()} views
          </span>
        </Link>

        <Link
          href="/the-map-room"
          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-[#2f4368] bg-[#142447] px-3 text-[10px] font-black uppercase tracking-wider text-[#fdf8ea] transition hover:border-[#e1bd5b] hover:text-[#e1bd5b]"
        >
          Map Room <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
