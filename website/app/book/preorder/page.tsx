import type { Metadata } from "next";
import Link from "next/link";
import { BookOffers } from "@/components/BookOffers";
import { BookSocialProof } from "@/components/BookSocialProof";
import { BookEmailSignup } from "@/components/BookEmailSignup";
import { BookDisclaimer } from "@/components/BookDisclaimer";
import { BookCountdown } from "@/components/BookCountdown";
import { BookStickyBuyBar } from "@/components/BookStickyBuyBar";
import { BookExitIntent } from "@/components/BookExitIntent";
import { BOOK, WHY_PRICE, BOOK_TIERS, SALE_ENDS_AT, formatUsd, tierPriceUsd } from "@/lib/book";
import { SITE } from "@/lib/site";

const title = "Pre-order Fighting Shadows | Ryan Nichols";
const description =
  "Pre-order Fighting Shadows direct from Ryan Nichols — digital edition, signed paperback, or the Founding Supporter Edition with the evidence appendix. Delivery dates announced as the schedule is finalized.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/preorder` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book/preorder`,
    images: [{ url: BOOK.ogImage, width: 1200, height: 800, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [BOOK.ogImage] },
};

export default function BookPreorderPage() {
  const digital = BOOK_TIERS.find((t) => t.slug === "early_release_digital");
  const priceLabel = digital ? formatUsd(tierPriceUsd(digital)) : "$29.99";
  const listLabel = digital?.listPriceUsd
    ? formatUsd(digital.listPriceUsd)
    : undefined;
  const saleActive = SALE_ENDS_AT
    ? new Date(SALE_ENDS_AT).getTime() > Date.now()
    : false;
  return (
    <article className="rrn-page">
      <BookExitIntent priceLabel={priceLabel} listLabel={listLabel} />
      <BookStickyBuyBar
        priceLabel={priceLabel}
        listLabel={listLabel}
        href="#book-offers"
        cta="See editions"
      />
      {/* Hero */}
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
                Pre-order · {BOOK.title}
              </p>
              <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
                Get it first. Own the record directly.
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
                Pre-order direct from me, here, before the book goes to Amazon.
                Pick the edition that fits — every one helps put the full record
                in public view.
              </p>

              {/* Above-the-fold buy. In the 24h to 2026-08-23, 166 of 387
                  pre-order page visitors (43%) left at 1% scroll or less.
                  They landed on a headline, a cover and a countdown with no
                  price and nothing to click. Of the ~93 who made it past
                  halfway, 31 bought. The page was selling fine, it just
                  never asked. */}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  href="#book-offers"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
                >
                  Pre-order now
                  <span className="ml-2">{priceLabel}</span>
                  {listLabel ? (
                    <span className="ml-2 text-sm font-bold line-through opacity-70">
                      {listLabel}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="#book-offers"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-base font-black text-[#fdf8ea] transition hover:bg-white/10"
                >
                  See all editions
                </Link>
              </div>
            </div>
            <div className="order-first mx-auto w-full max-w-[200px] sm:max-w-[240px] lg:order-none lg:max-w-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BOOK.cover}
                alt="Fighting Shadows — a memoir by Ryan Nichols (book cover)"
                width={1000}
                height={1333}
                className="w-full rounded-lg border border-white/15 shadow-2xl shadow-black/50 ring-1 ring-black/20"
              />
            </div>
          </div>

          {saleActive ? (
            <div className="mt-8 rounded-xl border border-[#e1bd5b]/40 bg-[#e1bd5b]/10 px-4 py-3 text-center text-[#e1bd5b]">
              <BookCountdown endsAt={SALE_ENDS_AT} className="justify-center" />
            </div>
          ) : null}
          <div className="mt-4">
            <BookSocialProof tone="dark" />
          </div>
        </div>
      </section>

      {/* Delivery-date note */}
      <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <div className="rounded-xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 sm:p-5">
          <p className="text-sm font-bold leading-relaxed text-[var(--color-ink)]">
            Delivery dates will be announced as the manuscript, editing, and
            printing schedule is finalized. Pre-order now to lock your edition and
            be first to hear every milestone.
          </p>
        </div>
      </section>

      {/* Offers */}
      <section
        id="book-offers"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12"
      >
        <BookOffers checkout ctaLabel="Pre-order" />
        <p className="mt-4 text-center text-sm font-semibold text-[var(--color-muted)]">
          Secure checkout by Stripe. Full refund anytime before your edition
          ships.
        </p>
      </section>

      {/* Why it costs what it does */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Why it costs what it does
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            You are not overpaying for paper.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {WHY_PRICE.map((w) => (
              <div
                key={w.title}
                className="rounded-xl border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-sm"
              >
                <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {w.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reserve / email capture */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div id="reserve" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Not ready to pre-order?
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            Get on the list instead.
          </h2>
          <p className="mt-3 text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
            No pressure. Add your email for the release date, book updates, and
            the opening chapter free — and pre-order whenever you are ready.
          </p>
          <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
            <BookEmailSignup source="book_preorder" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          How the pre-order works
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "You pre-order",
              b: "Pick an edition and check out securely with Stripe. You get an emailed confirmation and receipt right away.",
            },
            {
              n: "02",
              t: "You get updates",
              b: "Writing, editing, and printing milestones land in your inbox and on the Updates page.",
            },
            {
              n: "03",
              t: "You get the book",
              b: "Digital editions deliver by secure link. Signed copies confirm shipping details before they go out.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <p className="font-mono text-xs font-black text-[var(--color-muted)]">{s.n}</p>
              <h3 className="mt-1 font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                {s.t}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                {s.b}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <BookDisclaimer />
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          <Link
            href="/book"
            className="font-semibold underline underline-offset-4 hover:text-[var(--color-accent)]"
          >
            ← Back to the book
          </Link>
        </p>
      </section>
    </article>
  );
}
