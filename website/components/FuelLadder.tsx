import {
  FABLE_RATES,
  FUEL_MONTHLY,
  MEASURED_DAY_CENTS,
  MEASURED_MIX,
  WORKING_DAY_HOURS,
  costPerOutputTokenUsd,
  machineTimeLabel,
  roundWords,
  tokensFor,
  usdWhole,
  type ResolvedFuelTier,
} from "@/lib/fuel";

// "What your fuel does": one bar per amount. Words come from Anthropic's
// published Fable 5.1 rates times the token mix measured off Ryan's machine;
// time is that amount against his measured average day. Nothing here is
// typed by hand, and the footnote says out loud that it is an estimate.
export function FuelLadder({ tiers }: { tiers: ResolvedFuelTier[] }) {
  const rows = [
    ...tiers.map((t) => ({ ...t, monthly: false })),
    { ...FUEL_MONTHLY, monthly: true },
  ].sort((a, b) => a.amountCents - b.amountCents || (a.monthly ? 1 : -1));
  const max = Math.max(...rows.map((r) => r.amountCents));
  const perOutput = costPerOutputTokenUsd();

  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-6" data-fuel-ladder>
      <ol className="space-y-3">
        {rows.map((r) => {
          // Square-root scale so a $5 bar is visible next to the month bar.
          const w = Math.max(7, Math.round(Math.sqrt(r.amountCents / max) * 100));
          const buy = tokensFor(r.amountCents);
          const words = `${roundWords(buy.words)} words`;
          const time = machineTimeLabel(r.amountCents)?.replace(" of the machine", "");
          return (
            <li
              key={`${r.slug}-${r.monthly ? "m" : "o"}`}
              className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_1fr_14rem]"
            >
              <div>
                <p className="font-display text-xl font-black tabular-nums tracking-tight text-[var(--color-ink)] sm:text-2xl">
                  {usdWhole(r.amountCents)}
                  {r.monthly ? <span className="text-xs font-bold text-[var(--color-muted)]">/mo</span> : null}
                </p>
                <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">{r.title}</p>
              </div>
              <div className="min-w-0">
                <div className="relative h-8 w-full overflow-hidden rounded-md bg-[var(--color-surface-2)]">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-md ${
                      r.monthly
                        ? "bg-[var(--color-navy)]"
                        : r.featured
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-gold-bright)]"
                    }`}
                    style={{ width: `${w}%` }}
                  />
                  {/* The label rides inside a wide bar and just past a narrow one. */}
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-black uppercase tracking-wider ${
                      w >= 45
                        ? r.monthly || r.featured
                          ? "text-[var(--color-paper)]"
                          : "text-[#071126]"
                        : "text-[var(--color-ink)]"
                    }`}
                    style={w >= 45 ? { left: 8 } : { left: `calc(${w}% + 8px)` }}
                  >
                    {words}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)] sm:hidden">
                  {r.monthly ? "Every month. " : ""}
                  {time ? `${time[0].toUpperCase()}${time.slice(1)}.` : ""}
                </p>
              </div>
              <p className="hidden text-sm text-[var(--color-ink-soft)] sm:block">
                {r.monthly ? <strong className="text-[var(--color-ink)]">Every month. </strong> : null}
                {time ? `${time[0].toUpperCase()}${time.slice(1)}.` : null}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
        <strong className="text-[var(--color-ink-soft)]">Estimate, and here is the arithmetic.</strong> Anthropic
        prices {FABLE_RATES.model} at ${FABLE_RATES.input} per million tokens in, ${FABLE_RATES.cacheRead} per million
        cached, ${FABLE_RATES.output} per million out (checked {FABLE_RATES.checkedOn}). Measured off my own machine
        ({MEASURED_MIX.window}, {MEASURED_MIX.activeDays} active days), every output token travels with{" "}
        {MEASURED_MIX.inputPerOutput} input tokens and {Math.round(MEASURED_MIX.cacheReadPerOutput)} cache reads, so
        one output token costs about ${perOutput.toFixed(5)} all in. Words are output tokens times 0.75, reasoning
        included. Time is the gift against my measured average day, {usdWhole(MEASURED_DAY_CENTS.average)} of tokens
        over {WORKING_DAY_HOURS} hours. Nobody has metered one article yet; the first month that runs on credits, the
        real number replaces these.
      </p>
    </div>
  );
}
