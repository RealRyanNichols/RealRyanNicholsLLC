import { getBookStats } from "@/lib/book-stats";
import { BOOK_TIERS, formatUsd } from "@/lib/book";

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-[5rem]">
      <div
        className={[
          "font-display text-3xl font-black tabular-nums sm:text-4xl",
          accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]",
        ].join(" ")}
      >
        {value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-[11px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]">
        {label}
      </div>
    </div>
  );
}

/**
 * Live social proof for the book funnel: a headline "founding launch" count with
 * a live pulse, a 24h momentum line, a buyers/list/spots breakdown, and the
 * Founding scarcity bar. Built to make real (even small) numbers pull people in.
 */
export async function BookSocialProof({ className = "" }: { className?: string }) {
  const s = await getBookStats();
  const community = s.buyers + s.onList + s.waitlist;
  const recent = s.last24hBuyers + s.last24hSignups;
  const remaining = Math.max(0, s.foundingLimit - s.foundingClaimed);
  const pct =
    s.foundingLimit > 0
      ? Math.min(100, Math.round((s.foundingClaimed / s.foundingLimit) * 100))
      : 0;
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const launchPrice = digital ? formatUsd(digital.priceUsd) : "$17.76";

  return (
    <section
      className={[
        "rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5",
        className,
      ].join(" ")}
    >
      {/* Headline — founding launch count, live */}
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
          </span>
          <span className="font-display text-4xl font-black tabular-nums text-[var(--color-accent)] sm:text-5xl">
            {community.toLocaleString()}
          </span>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
          joined the founding launch
        </p>
        {recent > 0 ? (
          <p className="mt-1 text-xs font-bold text-[var(--color-accent)]">
            🔥 {recent} joined in the last 24 hours
          </p>
        ) : community === 0 ? (
          <p className="mt-1 text-xs font-bold text-[var(--color-ink-soft)]">
            Be the very first to lock in the {launchPrice} launch price.
          </p>
        ) : null}
      </div>

      {/* Breakdown */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-[var(--color-line)] pt-4 text-center">
        <Stat value={s.buyers} label="pre-ordered" accent />
        <span className="hidden h-8 w-px bg-[var(--color-line)] sm:block" />
        <Stat value={s.onList + s.waitlist} label="on the list" />
        <span className="hidden h-8 w-px bg-[var(--color-line)] sm:block" />
        <Stat value={remaining} label="Founding spots left" />
      </div>

      {/* Founding scarcity */}
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
