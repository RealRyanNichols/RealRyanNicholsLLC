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
              ? "btn-accent"
              : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-gold)] hover:bg-[var(--color-surface-2)]"
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
        className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-[var(--color-gold)] bg-[var(--color-gold-soft)] px-4 text-base font-black text-[var(--color-gold)] transition hover:bg-[var(--color-support-soft)] hover:border-[var(--color-support-strong)]"
      >
        <span className="tabular-nums">{usdWhole(FUEL_MONTHLY.amountCents)}/mo</span>
        <span className="text-sm font-bold text-[var(--color-ink-soft)]">{FUEL_MONTHLY.title}</span>
      </button>
      <button
        type="button"
        data-fuel-quick="custom"
        onClick={() => pick({ slug: null, cadence: "once" })}
        className="inline-flex min-h-12 items-center rounded-lg border border-[var(--color-line)] px-4 text-base font-black text-[var(--color-ink-soft)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-ink)]"
      >
        Your own amount
      </button>
    </div>
  );
}
