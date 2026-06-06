import { getBookStats } from "@/lib/book-stats";
import { BOOK_TIERS, formatUsd } from "@/lib/book";

function Stat({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-[5.5rem]">
      <div
        className={[
          "font-display text-3xl font-black tabular-nums",
          highlight ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]",
        ].join(" ")}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </div>
    </div>
  );
}

/**
 * Live social-proof counter: how many have bought, how many are on the list,
 * and how many Founding spots remain. Marketing-smart about a cold start —
 * before there's traction it leads with scarcity + a "be first" line instead of
 * weak zeros. (Ryan's exact numbers always live in /admin/book.)
 */
export async function BookSocialProof({ className = "" }: { className?: string }) {
  const s = await getBookStats();
  const remaining = Math.max(0, s.foundingLimit - s.foundingClaimed);
  const pct =
    s.foundingLimit > 0
      ? Math.min(100, Math.round((s.foundingClaimed / s.foundingLimit) * 100))
      : 0;
  const hasTraction = s.buyers + s.onList > 0;
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const launchPrice = digital ? formatUsd(digital.priceUsd) : "$17.76";

  return (
    <section
      className={[
        "rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5",
        className,
      ].join(" ")}
    >
      {hasTraction ? (
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-center">
          <Stat value={s.buyers} label="have pre-ordered" />
          <span className="hidden h-8 w-px bg-[var(--color-line)] sm:block" />
          <Stat value={s.onList} label="on the early list" />
          <span className="hidden h-8 w-px bg-[var(--color-line)] sm:block" />
          <Stat value={remaining} label="Founding spots left" highlight />
        </div>
      ) : (
        <p className="text-center text-sm font-bold text-[var(--color-ink-soft)]">
          🇺🇸 The Founding launch just opened —{" "}
          <span className="text-[var(--color-accent)]">
            be the first to lock in the {launchPrice} launch price.
          </span>
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
          <span>Founding Supporter Edition</span>
          <span>
            {s.foundingClaimed} / {s.foundingLimit} claimed · {remaining} left
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
