"use client";

import { useState } from "react";

// One-tap micro-pledges. Small by design ($1/$3/$5) — the point is
// participation + momentum, not net-of-fee revenue. Hits the existing donate
// checkout with `rally: true` (server uses the lower $1 floor) and a
// `campaign: "rally"` tag so the rally meter and leaderboard can find it.
const TIERS = [
  { cents: 100, label: "$1" },
  { cents: 300, label: "$3" },
  { cents: 500, label: "$5" },
] as const;

export function RallyPledge({
  source = "rally",
  size = "md",
  className = "",
}: {
  source?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pledge(cents: number) {
    setLoading(cents);
    setError(null);
    try {
      const res = await fetch("/api/checkout/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: cents,
          rally: true,
          campaign: "rally",
          source,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <button
            key={t.cents}
            type="button"
            onClick={() => pledge(t.cents)}
            disabled={loading !== null}
            className={`rounded-full border border-[#e1bd5b]/60 bg-[#e1bd5b] font-black tracking-tight text-[#0a1326] transition hover:bg-[#f0d27a] disabled:opacity-60 ${pad}`}
          >
            {loading === t.cents ? "…" : `Pledge ${t.label}`}
          </button>
        ))}
        <a
          href="/support?ref=rally"
          className={`rounded-full border border-white/20 bg-white/5 font-bold tracking-tight text-[#fdf8ea] transition hover:border-[#e1bd5b]/60 hover:text-[#e1bd5b] ${pad}`}
        >
          Back me monthly →
        </a>
      </div>
      {error ? <p className="mt-2 text-xs text-[#ef9a8e]">{error}</p> : null}
    </div>
  );
}
