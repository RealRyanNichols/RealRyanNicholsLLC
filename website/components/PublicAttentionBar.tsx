"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Totals = {
  live_now?: number;
  countries_now?: number;
  total_views?: number;
  total_shares?: number;
  defendants?: number;
  documents?: number;
};

export function PublicAttentionBar() {
  const pathname = usePathname();
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function pull() {
      const { data } = await supabase.rpc("site_totals");
      if (mounted && data) setTotals(data as Totals);
    }

    void pull();
    const id = window.setInterval(pull, 45_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/account") ||
    pathname?.startsWith("/checkout")
  ) {
    return null;
  }

  const live = totals?.live_now ?? 0;
  const countries = totals?.countries_now ?? 0;
  const views = totals?.total_views ?? 0;
  const shares = totals?.total_shares ?? 0;

  return (
    <section
      aria-label="Public site traffic"
      className="border-b border-[var(--color-line)] bg-[#fdf8ea]"
    >
      <div className="mx-auto grid max-w-5xl gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Public record traffic
          </p>
          <p className="mt-1 text-sm font-bold leading-snug text-[var(--color-ink)] sm:text-base">
            Thank you for watching. Officials, agencies, attorneys, media, and
            citizens are seeing the same public record.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:min-w-[26rem]">
          <ProofStat label="live" value={live} hot />
          <ProofStat label="countries" value={countries} />
          <ProofStat label="views" value={views} />
          <ProofStat label="shares" value={shares} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Link
            href="/the-map-room"
            className="min-h-10 rounded-full border border-[var(--color-blue)] bg-[var(--color-blue-soft)] px-4 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-blue)]"
          >
            Open live radar
          </Link>
          <Link
            href="/tell-your-story"
            className="min-h-10 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-accent)]"
          >
            Add your story
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProofStat({
  label,
  value,
  hot = false,
}: {
  label: string;
  value: number;
  hot?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border px-2 py-2 text-center",
        hot
          ? "border-[#7fe3a9] bg-[#7fe3a9]/15"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="text-lg font-black leading-none tabular-nums text-[var(--color-ink)] sm:text-2xl">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-normal text-[var(--color-muted)]">
        {label}
      </div>
    </div>
  );
}
