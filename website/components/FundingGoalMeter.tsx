import type { FundingData } from "@/lib/funding";
import { usd } from "@/lib/funding";

export function FundingGoalMeter({ data }: { data: FundingData }) {
  const { settings, monthlyItems, oneTimeItems, goalCents, raisedCents, remainingCents, pct } = data;
  const show = settings.show_amounts;

  return (
    <section className="rounded-2xl border-2 border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] p-6 sm:p-8 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl bg-[var(--color-accent)]/20"
        aria-hidden
      />
      <p className="relative text-xs uppercase tracking-[0.14em] text-[var(--color-accent)] font-bold">
        {settings.campaign_title}
      </p>
      <h2 className="relative font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)] leading-tight">
        Here&apos;s exactly what I&apos;m raising — and why.
      </h2>
      {settings.campaign_blurb ? (
        <p className="relative mt-3 text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
          {settings.campaign_blurb}
        </p>
      ) : null}

      {/* Progress */}
      <div className="relative mt-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tabular-nums text-[var(--color-ink)] leading-none">
              {show ? usd(raisedCents) : `${pct}%`}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              {show ? <>raised of {usd(goalCents)} this month</> : <>of this month&apos;s goal</>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--color-accent)] leading-none">
              {show ? usd(remainingCents) : `${Math.max(0, 100 - pct)}%`}
            </div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">to go this month</div>
          </div>
        </div>

        <div
          className="mt-4 h-4 w-full rounded-full bg-[var(--color-line)] overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly funding progress"
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-700"
            style={{ width: `${Math.max(pct, raisedCents > 0 ? 3 : 0)}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-[var(--color-ink-soft)]">
          {pct >= 100
            ? "This month is fully funded — thank you. Anything more rolls to next month or someone in the community."
            : `${pct}% funded for ${new Date().toLocaleString("en-US", { month: "long" })}.`}
        </p>
      </div>

      {/* Transparent breakdown */}
      <div className="relative mt-7">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
          What your donation funds
        </p>
        <ul className="mt-3 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] overflow-hidden">
          {monthlyItems.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">{item.label}</p>
                {item.blurb ? (
                  <p className="mt-0.5 text-xs text-[var(--color-muted)] leading-relaxed">
                    {item.blurb}
                  </p>
                ) : null}
              </div>
              {show ? (
                <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {usd(item.amount_cents)}
                  <span className="text-[var(--color-muted)] font-normal">/mo</span>
                </span>
              ) : null}
            </li>
          ))}
          {show ? (
            <li className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-surface)]">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Monthly goal
              </span>
              <span className="text-base font-bold tabular-nums text-[var(--color-accent)]">
                {usd(goalCents)}
              </span>
            </li>
          ) : null}
        </ul>

        {oneTimeItems.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
              One-time needs (separate from the monthly goal)
            </p>
            <ul className="mt-2 divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] overflow-hidden">
              {oneTimeItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{item.label}</p>
                    {item.blurb ? (
                      <p className="mt-0.5 text-xs text-[var(--color-muted)] leading-relaxed">
                        {item.blurb}
                      </p>
                    ) : null}
                  </div>
                  {show ? (
                    <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--color-ink)]">
                      {usd(item.amount_cents)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {settings.manual_note ? (
          <p className="mt-3 text-xs text-[var(--color-muted)] leading-relaxed">
            {settings.manual_note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
