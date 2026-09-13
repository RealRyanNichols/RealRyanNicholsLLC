import Link from "next/link";
import { BOOK, BOOK_TIERS, formatUsd, tierPriceUsd, tierSale } from "@/lib/book";

/**
 * Reusable book pre-order CTA, synced to lib/book.ts (price, sale, Founding cap).
 * Drop it anywhere to funnel traffic into /book/preorder. Dark band that fits
 * the site's cream/navy/gold identity.
 *
 * `tone` picks the accent: "accent" (default) keeps the flag-red rule and
 * button used on the home feed and elsewhere; "case" swaps them for gold, so
 * the /case page keeps its one-red-element rule (the hero's primary button).
 *
 * `headingLevel` lets a caller that already carries its own heading (the
 * /case capture band) nest the price line under it instead of beside it.
 */
export function BookCtaBand({
  className = "",
  tone = "accent",
  headingLevel = "h2",
}: {
  className?: string;
  tone?: "accent" | "case";
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const founding = BOOK_TIERS.find(
    (t) => t.slug === "founding_supporter_edition",
  );
  const sale = digital ? tierSale(digital) : { onSale: false, percentOff: 0 };
  const price = digital ? formatUsd(tierPriceUsd(digital)) : "$29.99";
  const list = digital?.listPriceUsd ? formatUsd(digital.listPriceUsd) : null;
  const gold = tone === "case";

  return (
    <section
      className={[
        "rounded-2xl border-2 bg-[var(--color-surface)] p-5 text-[var(--color-cream)] shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:p-6",
        gold ? "border-[var(--color-gold-bright)]" : "border-[var(--color-accent)]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{BOOK.title} · Pre-order</p>
          <Heading className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-[var(--color-cream)] sm:text-3xl">
            Early access for{" "}
            <span className="text-[var(--color-gold-bright)]">{price}</span>
            {list ? (
              <span className="ml-2 align-middle text-base font-bold text-[var(--color-ink-soft)] line-through">
                {list}
              </span>
            ) : null}
            {sale.onSale ? (
              <span
                className={[
                  "ml-2 inline-block rounded px-1.5 py-0.5 align-middle text-xs font-black",
                  gold
                    ? "bg-[var(--color-gold-bright)] text-[var(--color-navy)]"
                    : "bg-[var(--color-accent)] text-[var(--color-cream)]",
                ].join(" ")}
              >
                {sale.percentOff}% off
              </span>
            ) : null}
          </Heading>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
            Read it first and own a piece of the story — or become a Founding
            Supporter (limited to {founding?.limited ?? 250}).
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/book/preorder"
            className="btn-accent inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-base font-black"
          >
            Pre-order now
          </Link>
          <Link
            href="/book"
            className="btn-blue inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 text-base font-black"
          >
            See the book
          </Link>
        </div>
      </div>
    </section>
  );
}
