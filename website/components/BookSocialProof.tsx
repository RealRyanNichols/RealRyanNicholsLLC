import { getBookStats } from "@/lib/book-stats";
import { BOOK_TIERS, formatUsd } from "@/lib/book";

type Tone = "light" | "dark";

function palette(tone: Tone) {
  const dark = tone === "dark";
  return {
    section: dark
      ? "border-white/15 bg-white/[0.06]"
      : "border-[var(--color-line)] bg-[var(--color-surface)]",
    headline: dark ? "text-[#e1bd5b]" : "text-[var(--color-accent)]",
    dot: dark ? "bg-[#e1bd5b]" : "bg-[var(--color-accent)]",
    sub: dark ? "text-[#cfd9ea]" : "text-[var(--color-ink-soft)]",
    recency: dark ? "text-[#e1bd5b]" : "text-[var(--color-accent)]",
    statAccent: dark ? "text-[#e1bd5b]" : "text-[var(--color-accent)]",
    statNormal: dark ? "text-[#fdf8ea]" : "text-[var(--color-ink)]",
    statLabel: dark ? "text-[#cfd9ea]/70" : "text-[var(--color-muted)]",
    borderTop: dark ? "border-white/15" : "border-[var(--color-line)]",
    divider: dark ? "bg-white/15" : "bg-[var(--color-line)]",
    scarcity: dark ? "text-[#cfd9ea]/70" : "text-[var(--color-muted)]",
    barBg: dark ? "bg-white/15" : "bg-[var(--color-surface-2)]",
    barFill: dark ? "bg-[#e1bd5b]" : "bg-[var(--color-accent)]",
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
          "font-display text-3xl font-black tabular-nums sm:text-4xl",
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
      className={["rounded-xl border p-4 sm:p-5", p.section, className].join(" ")}
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
            className={[
              "font-display text-4xl font-black tabular-nums sm:text-5xl",
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
