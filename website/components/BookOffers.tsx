import Link from "next/link";
import { BOOK_TIERS } from "@/lib/book";

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]"
      aria-hidden
    >
      <polyline points="4 10 9 15 16 6" />
    </svg>
  );
}

/**
 * The three pre-order offers. Pure UI (Phase 1): each card's call-to-action is
 * a placeholder link to `ctaHref` — Phase 3 swaps it for a Stripe Checkout
 * action keyed on the tier slug.
 */
export function BookOffers({
  ctaHref = "/book/preorder",
  ctaLabel = "Choose this edition",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      {BOOK_TIERS.map((tier) => {
        const featured = Boolean(tier.featured);
        return (
          <div
            key={tier.slug}
            className={[
              "relative flex h-full flex-col rounded-xl border-2 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6",
              featured
                ? "border-[var(--color-accent)] shadow-md"
                : "border-[var(--color-line)]",
            ].join(" ")}
          >
            {featured ? (
              <span className="absolute -top-3 left-5 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-paper)]">
                Most chosen
              </span>
            ) : null}
            {tier.limited ? (
              <span className="absolute -top-3 right-5 rounded-full border border-[var(--color-gold)] bg-[var(--color-gold-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-support-strong)]">
                {tier.limited} only
              </span>
            ) : null}

            <h3 className="font-display text-2xl font-black leading-tight tracking-normal text-[var(--color-ink)]">
              {tier.name}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
              {tier.tagline}
            </p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-black tabular-nums text-[var(--color-ink)]">
                ${tier.priceUsd}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                suggested
              </span>
            </div>

            <ul className="mt-4 grid flex-1 gap-2">
              {tier.includes.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)]"
                >
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className={[
                "mt-5 inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-black transition",
                featured
                  ? "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]"
                  : "border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]",
              ].join(" ")}
            >
              {ctaLabel} · ${tier.priceUsd}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
