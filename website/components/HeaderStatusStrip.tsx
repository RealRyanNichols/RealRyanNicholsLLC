"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { BOOK_TIERS, formatUsd, tierPriceUsd, tierSale } from "@/lib/book";

// The full board only loads when someone opens it (it pulls in the world map).
const SituationRoom = dynamic(
  () => import("./SituationRoom").then((m) => ({ default: m.SituationRoom })),
  { ssr: false },
);

// Bump the version to re-show the pitch to people who dismissed an older one.
// v3: the launch sale reopened through Labor Day 2026. Dismissing hides ONLY
// the book pitch — the live-stats bar itself stays.
const BOOK_DISMISS_KEY = "rrn-book-banner-v3";

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

// ONE thin bar above the header — live stats on the left (tap to open the
// Situation Room), the book pitch + Map Room pill on the right. Replaces the
// old stacked pair (red AnnouncementBanner + navy status strip) so the feed
// starts one bar-height higher. Polls the Map Room RPC every 30s.
export function HeaderStatusStrip() {
  const [t, setT] = useState<Totals | null>(null);
  const [open, setOpen] = useState(false);
  const [bookDismissed, setBookDismissed] = useState(false);
  const pathname = usePathname();

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

  useEffect(() => {
    try {
      if (localStorage.getItem(BOOK_DISMISS_KEY)) setBookDismissed(true);
    } catch {
      // ignore storage failures — the pitch just stays visible
    }
  }, []);

  function dismissBook() {
    setBookDismissed(true);
    try {
      localStorage.setItem(BOOK_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  const live = t?.live_now ?? 0;
  const countries = t?.countries_now ?? 0;
  const views = t?.total_views ?? 0;

  // Book pitch hides on the book pages themselves and on admin (the whole
  // bar is already admin-hidden in HeaderClient — belt and braces).
  const showBook =
    !bookDismissed &&
    !pathname.startsWith("/book") &&
    !pathname.startsWith("/admin");

  const digital = BOOK_TIERS.find((x) => x.slug === "early_release_digital");
  const priceLabel = digital ? formatUsd(tierPriceUsd(digital)) : "$29.99";
  const onSale = digital ? tierSale(digital).onSale : false;

  return (
    <>
      <div className="border-b border-white/5 bg-[linear-gradient(90deg,#0a1326_0%,#0d1830_50%,#0a1326_100%)] text-[#cfd9ea]">
        <div className="mx-auto flex h-8 max-w-5xl items-center justify-between gap-3 px-3 text-[11px] sm:px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group -mx-1 flex shrink-0 items-center gap-3 rounded-md px-1 transition hover:bg-white/5"
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

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            {showBook ? (
              <span className="flex min-w-0 items-center gap-0.5">
                <Link
                  href="/book/preorder"
                  className="min-w-0 truncate rounded-md px-1 py-0.5 font-black text-[#e1bd5b] transition hover:bg-white/5 hover:text-[#f0d48a]"
                >
                  <span className="sm:hidden">
                    Fighting Shadows {priceLabel} →
                  </span>
                  <span className="hidden sm:inline">
                    Fighting Shadows — {priceLabel}
                    {onSale ? " launch" : ""}. Get it →
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={dismissBook}
                  aria-label="Hide the book offer"
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-sm leading-none text-[#5f7197] transition hover:bg-white/10 hover:text-[#fdf8ea]"
                >
                  ×
                </button>
              </span>
            ) : null}

            <Link
              href="/the-map-room"
              className={[
                "group shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#fdf8ea] transition hover:border-[#e1bd5b]/60 hover:text-[#e1bd5b]",
                // On phones the money link wins the space contest; the pill
                // returns the moment the pitch is dismissed (or on sm+).
                showBook ? "hidden sm:inline-flex" : "inline-flex",
              ].join(" ")}
            >
              Map Room
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      {open ? <SituationRoom seed={t} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
