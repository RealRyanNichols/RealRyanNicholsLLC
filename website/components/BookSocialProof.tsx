import { getBookStats } from "@/lib/book-stats";
import { BOOK_TIERS, formatUsd, tierPriceUsd } from "@/lib/book";

type Tone = "light" | "dark";

function palette(tone: Tone) {
  const dark = tone === "dark";
  return {
    section: dark
      ? "border-[var(--color-line-soft)] bg-[var(--color-surface-2)]"
      : "border-[var(--color-line)] bg-[var(--color-surface)]",
    headline: "text-[var(--color-gold)]",
    dot: "bg-[var(--color-gold)]",
    sub: "text-[var(--color-ink-soft)]",
    recency: "text-[var(--color-gold)]",
    statAccent: "text-[var(--color-gold)]",
    statNormal: "text-[var(--color-ink)]",
    statLabel: "text-[var(--color-muted)]",
    borderTop: dark ? "border-[var(--color-line-soft)]" : "border-[var(--color-line)]",
    divider: dark ? "bg-[var(--color-line-soft)]" : "bg-[var(--color-line)]",
    scarcity: "text-[var(--color-muted)]",
    barBg: "bg-[var(--color-line-soft)]",
    barFill: "bg-[var(--color-gold)]",
  };
}

function Stat({
  value,
  label,
  accent,
  p,
}: {
  value: number;
  label: string;
  accent?: boolean;
  p: ReturnType<typeof palette>;
}) {
  return (
    <div className="min-w-[5rem]">
      <div
        className={[
          "display text-3xl tabular-nums sm:text-4xl",
          accent ? p.statAccent : p.statNormal,
        ].join(" ")}
      >
        {value.toLocaleString()}
      </div>
      <div
        className={[
          "mt-0.5 text-[11px] font-black uppercase tracking-[0.1em]",
          p.statLabel,
        ].join(" ")}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Live social proof: headline "founding launch" count with a live pulse, a 24h
 * line that leads with purchases, a buyers/list/spots breakdown, and the
 * Founding scarcity bar. `tone="dark"` styles it to sit inside a dark hero.
 */
export async function BookSocialProof({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: Tone;
}) {
  const s = await getBookStats();
  const p = palette(tone);
  const community = s.buyers + s.onList + s.waitlist;

  // Below this floor, raw counts are anti-proof ("2 of 250 claimed" reads as
  // nobody wants it). Hide the whole social-proof block until the numbers
  // actually help the offer; the tiers and scarcity copy elsewhere still sell.
  if (community < 25) return null;
  const recent = s.last24hBuyers + s.last24hSignups;
  const remaining = Math.max(0, s.foundingLimit - s.foundingClaimed);
  const pct =
    s.foundingLimit > 0
      ? Math.min(100, Math.round((s.foundingClaimed / s.foundingLimit) * 100))
      : 0;
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const launchPrice = digital ? formatUsd(tierPriceUsd(digital)) : "$29.99";

  return (
    <section
      data-reveal
      className={[
        "rounded-xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-5",
        p.section,
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span
              className={[
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                p.dot,
              ].join(" ")}
            />
            <span
              className={[
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                p.dot,
              ].join(" ")}
            />
          </span>
          <span
            data-count={community}
            className={[
              "display text-4xl tabular-nums sm:text-5xl",
              p.headline,
            ].join(" ")}
          >
            {community.toLocaleString()}
          </span>
        </div>
        <p
          className={[
            "text-xs font-black uppercase tracking-[0.16em]",
            p.sub,
          ].join(" ")}
        >
          joined the founding launch
        </p>
        {s.last24hBuyers > 0 ? (
          <p className={["mt-1 text-xs font-bold", p.recency].join(" ")}>
            🔥 {s.last24hBuyers.toLocaleString()} pre-ordered in the last 24 hours
          </p>
        ) : recent > 0 ? (
          <p className={["mt-1 text-xs font-bold", p.recency].join(" ")}>
            🔥 {recent} joined in the last 24 hours
          </p>
        ) : community === 0 ? (
          <p className={["mt-1 text-xs font-bold", p.sub].join(" ")}>
            Be the very first to lock in the {launchPrice} launch price.
          </p>
        ) : null}
      </div>

      <div
        className={[
          "mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t pt-4 text-center",
          p.borderTop,
        ].join(" ")}
      >
        <Stat value={s.buyers} label="pre-ordered" accent p={p} />
        <span className={["hidden h-8 w-px sm:block", p.divider].join(" ")} />
        <Stat value={s.onList + s.waitlist} label="on the list" p={p} />
        <span className={["hidden h-8 w-px sm:block", p.divider].join(" ")} />
        <Stat value={remaining} label="Founding spots left" p={p} />
      </div>

      <div className="mt-4">
        <div
          className={[
            "flex items-center justify-between text-[11px] font-black uppercase tracking-wider",
            p.scarcity,
          ].join(" ")}
        >
          <span>Founding Supporter Edition</span>
          <span>
            {s.foundingClaimed} / {s.foundingLimit} claimed · {remaining} left
          </span>
        </div>
        <div
          className={[
            "mt-1.5 h-2 overflow-hidden rounded-full",
            p.barBg,
          ].join(" ")}
        >
          <div
            className={["h-full rounded-full transition-all", p.barFill].join(" ")}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
