import Link from "next/link";
import { BOOK, BOOK_TIERS, formatUsd, tierSale } from "@/lib/book";

/**
 * Reusable book pre-order CTA, synced to lib/book.ts (price, sale, Founding cap).
 * Drop it anywhere to funnel traffic into /book/preorder. Dark band that fits
 * the site's cream/navy/gold identity.
 */
export function BookCtaBand({ className = "" }: { className?: string }) {
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const founding = BOOK_TIERS.find(
    (t) => t.slug === "founding_supporter_edition",
  );
  const sale = digital ? tierSale(digital) : { onSale: false, percentOff: 0 };
  const price = digital ? formatUsd(digital.priceUsd) : "$17.76";
  const list = digital?.listPriceUsd ? formatUsd(digital.listPriceUsd) : null;

  return (
    <section
      className={[
        "rounded-2xl border-2 border-[var(--color-accent)] bg-[#071126] p-5 text-[#fdf8ea] shadow-md sm:p-6",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e1bd5b]">
            {BOOK.title} · Pre-order
          </p>
          <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-[#fdf8ea] sm:text-3xl">
            Early access for{" "}
            <span className="text-[#e1bd5b]">{price}</span>
            {list ? (
              <span className="ml-2 align-middle text-base font-bold text-[#cfd9ea] line-through">
                {list}
              </span>
            ) : null}
            {sale.onSale ? (
              <span className="ml-2 inline-block rounded bg-[var(--color-accent)] px-1.5 py-0.5 align-middle text-xs font-black text-[var(--color-paper)]">
                {sale.percentOff}% off
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#cfd9ea]">
            Read it first and fund the fight directly — or become a Founding
            Supporter (limited to {founding?.limited ?? 250}).
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/book/preorder"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
          >
            Pre-order now
          </Link>
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-base font-black text-[#fdf8ea] transition hover:bg-white/10"
          >
            See the book
          </Link>
        </div>
      </div>
    </section>
  );
}
