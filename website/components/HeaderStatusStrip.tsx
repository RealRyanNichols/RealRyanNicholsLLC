"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

// The full board only loads when someone opens it (it pulls in the world map).
const SituationRoom = dynamic(
  () => import("./SituationRoom").then((m) => ({ default: m.SituationRoom })),
  { ssr: false },
);

type Totals = {
  live_now?: number;
  countries_now?: number;
  total_views?: number;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-black tabular-nums text-[#fdf8ea]">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8194b4]">
        {label}
      </span>
    </span>
  );
}

// Sleek live-status strip above the header. Answers "who's here right now?"
// and signals a real, live system. Polls the Map Room RPC every 30s. Tap the
// stats to open the full Situation Room board.
export function HeaderStatusStrip() {
  const [t, setT] = useState<Totals | null>(null);
  const [open, setOpen] = useState(false);

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

  // Let any component on the page open the board via openSituationRoom().
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("rally:open", onOpen);
    return () => window.removeEventListener("rally:open", onOpen);
  }, []);

  const live = t?.live_now ?? 0;
  const countries = t?.countries_now ?? 0;
  const views = t?.total_views ?? 0;

  return (
    <>
      <div className="border-b border-white/5 bg-[linear-gradient(90deg,#0a1326_0%,#0d1830_50%,#0a1326_100%)] text-[#cfd9ea]">
        <div className="mx-auto flex h-8 max-w-5xl items-center justify-between gap-3 px-3 text-[11px] sm:px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group -mx-1 flex min-w-0 items-center gap-3 rounded-md px-1 transition hover:bg-white/5"
            title="Open the Situation Room"
            aria-haspopup="dialog"
          >
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fe3a9] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fe3a9] shadow-[0_0_10px_rgba(127,227,169,0.8)]" />
              </span>
              <Stat value={live} label="live now" />
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden />
            <span className="hidden sm:inline-flex">
              <Stat value={countries} label={countries === 1 ? "country" : "countries"} />
            </span>
            <span className="hidden h-3 w-px bg-white/10 md:block" aria-hidden />
            <span className="hidden md:inline-flex">
              <Stat value={views} label="views" />
            </span>
            <span
              className="ml-0.5 text-[#5f7197] transition group-hover:text-[#e1bd5b]"
              aria-hidden
            >
              ⤢
            </span>
          </button>

          <Link
            href="/the-map-room"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#fdf8ea] transition hover:border-[#e1bd5b]/60 hover:text-[#e1bd5b]"
          >
            Map Room
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>

      {open ? <SituationRoom seed={t} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
