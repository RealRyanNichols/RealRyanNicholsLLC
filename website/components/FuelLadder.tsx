import {
  FUEL_MONTHLY,
  articlesLabel,
  fuelArticlesAtPace,
  fuelDuration,
  usdWhole,
  type ResolvedFuelTier,
} from "@/lib/fuel";

// "What your fuel does": one bar per amount, scaled to machine time, with
// the article count at the last 30 days' pace. Every number is derived from
// the real bill and the real post count; nothing here is typed by hand.
export function FuelLadder({
  tiers,
  billCents,
  posts30,
}: {
  tiers: ResolvedFuelTier[];
  billCents: number;
  posts30: number | null;
}) {
  if (!(billCents > 0)) return null;
  const rows = [
    ...tiers.map((t) => ({ ...t, monthly: false })),
    { ...FUEL_MONTHLY, monthly: true },
  ].sort((a, b) => a.amountCents - b.amountCents || (a.monthly ? 1 : -1));
  const maxHours = Math.max(...rows.map((r) => hours(r.amountCents, billCents)));
  const perArticle = posts30 && posts30 > 0 ? Math.round(billCents / posts30) : null;

  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-6" data-fuel-ladder>
      <ol className="space-y-3">
        {rows.map((r) => {
          const h = hours(r.amountCents, billCents);
          const w = Math.max(6, Math.round((h / maxHours) * 100));
          const time = fuelDuration(r.amountCents, billCents);
          const arts = articlesLabel(fuelArticlesAtPace(r.amountCents, billCents, posts30));
          return (
            <li key={`${r.slug}-${r.monthly ? "m" : "o"}`} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_1fr_16rem]">
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
                    {time?.replace(" of the machine", "")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-soft)] sm:hidden">
                  {r.monthly ? "Every month. " : ""}
                  {arts ? `${arts} at last month's pace.` : ""}
                </p>
              </div>
              <p className="hidden text-sm text-[var(--color-ink-soft)] sm:block">
                {r.monthly ? <strong className="text-[var(--color-ink)]">Every month. </strong> : null}
                {arts ? `${arts} at last month's pace.` : time}
              </p>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
        Machine time is the bill divided by thirty days.
        {perArticle && posts30 ? (
          <>
            {" "}
            Article pace is the last 30 days: {posts30.toLocaleString("en-US")} articles on a {usdWhole(billCents)} bill,
            about {usdWhole(perArticle)} each. Both numbers move when the real ones move.
          </>
        ) : null}
      </p>
    </div>
  );
}

function hours(amountCents: number, billCents: number): number {
  return (amountCents / (billCents / 30)) * 24;
}
