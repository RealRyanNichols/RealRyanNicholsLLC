"use client";

import { FUEL_MONTHLY, usdWhole, type FuelCadence, type ResolvedFuelTier } from "@/lib/fuel";

// Hero amount buttons. One tap selects the tier in the form below and
// scrolls to it; no page reload. The form listens for the same event.
export const FUEL_PICK_EVENT = "fuel:pick";
export type FuelPick = { slug: string | null; cadence: FuelCadence };

export function FuelQuickPick({ tiers }: { tiers: ResolvedFuelTier[] }) {
  function pick(detail: FuelPick) {
    window.dispatchEvent(new CustomEvent<FuelPick>(FUEL_PICK_EVENT, { detail }));
    document.getElementById("fuel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Pick an amount">
      {tiers.map((t) => (
        <button
          key={t.slug}
          type="button"
          data-fuel-quick={t.slug}
          onClick={() => pick({ slug: t.slug, cadence: "once" })}
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
        data-fuel-quick="keeper"
        onClick={() => pick({ slug: FUEL_MONTHLY.slug, cadence: "monthly" })}
        className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-[var(--color-gold-bright)] bg-[var(--color-navy)] px-4 text-base font-black text-[#fdf8ea] transition hover:brightness-110"
      >
        <span className="tabular-nums">{usdWhole(FUEL_MONTHLY.amountCents)}/mo</span>
        <span className="text-sm font-bold text-[var(--color-gold-bright)]">{FUEL_MONTHLY.title}</span>
      </button>
      <button
        type="button"
        data-fuel-quick="custom"
        onClick={() => pick({ slug: null, cadence: "once" })}
        className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-4 text-base font-black text-[#cfd9ea] transition hover:border-[var(--color-gold-bright)] hover:text-[#fdf8ea]"
      >
        Your own amount
      </button>
    </div>
  );
}
