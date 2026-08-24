import type { Metadata } from "next";
import Link from "next/link";
import { BookOffers } from "@/components/BookOffers";
import { BookSocialProof } from "@/components/BookSocialProof";
import { BookStickyBuyBar } from "@/components/BookStickyBuyBar";
import { BOOK, BOOK_TIERS, formatUsd, tierPriceUsd } from "@/lib/book";
import { SITE } from "@/lib/site";

const digital = BOOK_TIERS.find((tier) => tier.slug === "early_release_digital");
const startingPrice = digital ? formatUsd(tierPriceUsd(digital)) : "$29.99";
const title = "Fighting Shadows — Read the memoir first | Ryan Nichols";
const description =
  "A first-person memoir about pressure, confinement, faith, family and the work of rebuilding. Choose a digital, signed or Founding edition direct from Ryan Nichols.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/start` },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book/start`,
    images: [{ url: BOOK.ogImage, width: 1200, height: 800, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BOOK.ogImage],
  },
};

const readerPromises = [
  {
    title: "A firsthand story",
    body: "The choices, consequences and turning points are told by the man who lived them, with the difference between memory and documented records made clear.",
  },
  {
    title: "The part after the headlines",
    body: "This is also about what happens after public attention moves on: faith, family, responsibility and the daily work of rebuilding a life.",
  },
  {
    title: "Progress you can see",
    body: "Early readers receive honest production updates. A final delivery date will be announced only when the manuscript, editing and printing schedule can support it.",
  },
];

export default function BookStartPage() {
  return (
    <article className="rrn-page">
      <BookStickyBuyBar
        priceLabel={startingPrice}
        href="#editions"
        cta="Choose an edition"
      />

      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14 lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
              Independent memoir · Built in public
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
              Freedom can open the door. Walking forward is another fight.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
              <strong className="text-[#fdf8ea]">{BOOK.title}</strong> is my
              first-person memoir about pressure, confinement, separation,
              faith, family and what it takes to rebuild when the whole country
              has an opinion about your life.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#editions"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#e1bd5b] px-6 py-3 text-base font-black text-[#071126] transition hover:bg-[#a7efc4]"
              >
                Read it first · from {startingPrice}
              </Link>
              <Link
                href="/book/updates"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-white/[0.06] px-6 py-3 text-base font-black text-[#fdf8ea] transition hover:bg-white/10"
              >
                See production updates
              </Link>
            </div>
            <div className="mt-6">
              <BookSocialProof tone="dark" />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[270px] lg:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BOOK.cover}
              alt="Fighting Shadows, a memoir by Ryan Nichols"
              width={1000}
              height={1333}
              className="w-full rounded-lg border border-white/15 shadow-2xl shadow-black/50 ring-1 ring-black/20"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {readerPromises.map((item, index) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <p className="font-mono text-xs font-black text-[var(--color-accent)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-black tracking-normal text-[var(--color-ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="editions"
        className="border-y border-[var(--color-line)] bg-[var(--color-paper)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Choose how you want to read it
          </p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-[var(--color-ink)] sm:text-4xl">
            Three editions. One transparent preorder.
          </h2>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
            Every edition includes production updates. Digital is the lowest-cost
            way in. Signed and Founding editions support the physical print run
            and include the digital edition.
          </p>
          <div className="mt-8">
            <BookOffers checkout ctaLabel="Pre-order" />
          </div>
          <div className="mt-5 rounded-xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 text-sm font-bold leading-6 text-[var(--color-ink)]">
            This is a preorder. The final release date will be posted after the
            manuscript, editing and print schedule are locked. Full refunds are
            available before your edition ships by emailing
            ryan@realryannichols.com. Physical editions collect a U.S. shipping
            address in Stripe Checkout.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Why buy direct
        </p>
        <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-[var(--color-ink)] sm:text-4xl">
          Your order helps finish the work.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
          Direct orders fund writing, editing, proof copies and fulfillment while
          keeping the reader relationship independent. You get the book you
          chose, regular progress updates and a clear refund path if the schedule
          no longer works for you.
        </p>
        <Link
          href="#editions"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Choose your edition
        </Link>
      </section>
    </article>
  );
}
