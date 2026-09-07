"use client";

import { usdWhole, type ResolvedFuelTier } from "@/lib/fuel";

// Hero amount buttons. One tap selects the tier in the form below and
// scrolls to it; no page reload. The form listens for the same event.
export const FUEL_PICK_EVENT = "fuel:pick";

export function FuelQuickPick({ tiers }: { tiers: ResolvedFuelTier[] }) {
  function pick(slug: string | null) {
    window.dispatchEvent(new CustomEvent(FUEL_PICK_EVENT, { detail: slug }));
    document.getElementById("fuel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Pick an amount">
      {tiers.map((t) => (
        <button
          key={t.slug}
          type="button"
          data-fuel-quick={t.slug}
          onClick={() => pick(t.slug)}
          className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-4 text-base font-black transition ${
            t.featured
              ? "bg-[var(--color-gold-bright)] text-[#071126] hover:brightness-105"
              : "border border-[var(--color-gold-bright)]/50 bg-white/[0.06] text-[#fdf8ea] hover:border-[var(--color-gold-bright)] hover:bg-white/10"
          }`}
        >
          <span className="tabular-nums">{usdWhole(t.amountCents)}</span>
          <span className="text-sm font-bold opacity-80">{t.title}</span>
        </button>
      ))}
      <button
        type="button"
        data-fuel-quick="custom"
        onClick={() => pick(null)}
        className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-4 text-base font-black text-[#cfd9ea] transition hover:border-[var(--color-gold-bright)] hover:text-[#fdf8ea]"
      >
        Your own amount
      </button>
    </div>
  );
}
