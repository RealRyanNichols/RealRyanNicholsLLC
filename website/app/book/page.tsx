import { withMainPageOg } from "@/lib/page-metadata";
import type { Metadata } from "next";
import Link from "next/link";
import { BookEmailSignup } from "@/components/BookEmailSignup";
import { BookOffers } from "@/components/BookOffers";
import { BookSocialProof } from "@/components/BookSocialProof";
import { BookDisclaimer } from "@/components/BookDisclaimer";
import { BookCountdown } from "@/components/BookCountdown";
import { BookStickyBuyBar } from "@/components/BookStickyBuyBar";
import { BookExitIntent } from "@/components/BookExitIntent";
import { BookShare } from "@/components/BookShare";
import {
  BOOK,
  BOOK_COVERS,
  BOOK_FAQ,
  BOOK_TIERS,
  SALE_ENDS_AT,
  formatUsd,
  tierPriceUsd,
} from "@/lib/book";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { personRef } from "@/lib/jsonld";

const title = "Fighting Shadows — A Memoir by Ryan Nichols";
const description =
  "Fighting Shadows: a first-person account of January 6, the D.C. jail, forced vaccination, solitary confinement, coerced plea pressure, due process violations, and the fight to put the full record in public view. Pre-order direct from Ryan Nichols.";

export const metadata: Metadata = withMainPageOg("/book", {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book`,
    images: [
      { url: BOOK.ogImage, width: 1200, height: 800, alt: title },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BOOK.ogImage],
  },
});

const whyImWriting =
  "I am writing this because the official story is not the whole story, and because I lived a version of these events that the record can back up. I spent nearly four years inside the system. I kept notes, filed grievances, and held onto transcripts and documents. This book puts that account in one place, in my own words, so it cannot be buried, edited down, or spun. It is my recollection and my documented claims, laid out so you can weigh them yourself.";

const archiveLinks = [
  { href: "/case", label: "The case file", desc: "Timeline, people, and documents." },
  { href: "/the-map-room", label: "The Map Room", desc: "The public record, mapped." },
  {
    href: "/case/the-salvaged-doj-record",
    label: "The evidence",
    desc: "Footage and records, in the open.",
  },
];

export default function BookPage() {
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          "@id": `${SITE.url}/book#book`,
          name: "Fighting Shadows",
          author: personRef(),
          url: `${SITE.url}/book`,
          image: new URL(BOOK.ogImage, SITE.url).toString(),
          inLanguage: "en",
          abstract: description,
          offers: BOOK_TIERS.map((t) => ({
            "@type": "Offer",
            name: t.name,
            price: tierPriceUsd(t),
            priceCurrency: "USD",
            url: `${SITE.url}/book/preorder`,
            availability: "https://schema.org/PreOrder",
          })),
        }}
      />
      <BookExitIntent priceLabel={priceLabel} listLabel={listLabel} />
      <BookStickyBuyBar priceLabel={priceLabel} listLabel={listLabel} />
      {/* Hero */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <div className="max-w-3xl">
              <p className="eyebrow">
                Pre-order · A memoir by {BOOK.author}
              </p>
              <h1 className="display mt-3 text-5xl text-[var(--color-cream)] sm:text-7xl">
                {BOOK.title}
              </h1>
              <p className="mt-4 max-w-2xl font-display text-lg font-black uppercase leading-snug tracking-[0.04em] text-[var(--color-gold-bright)] sm:text-xl">
                {BOOK.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[var(--color-ink-soft)] sm:text-lg">
                {BOOK.positioning}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/book/preorder"
                  className="btn-accent inline-flex min-h-12 items-center justify-center px-6 py-3 text-base"
                >
                  Pre-order the book
                </Link>
                <Link
                  href="/book/updates"
                  className="btn-blue inline-flex min-h-12 items-center justify-center px-6 py-3 text-base"
                >
                  Read the updates
                </Link>
              </div>
            </div>
            {/* The cover is the page's one photo, so it sits in a framed panel. */}
            <div className="order-first mx-auto w-full max-w-[240px] sm:max-w-[280px] lg:order-none lg:max-w-none">
              <div className="panel p-2.5" data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BOOK.cover}
                  alt="Fighting Shadows — a memoir by Ryan Nichols (book cover)"
                  width={1000}
                  height={1333}
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>

          {saleActive ? (
            <div className="mt-8 rounded-xl border border-[var(--color-gold-bright)]/40 bg-[var(--color-gold-bright)]/10 px-4 py-3 text-center text-[var(--color-gold-bright)]">
              <BookCountdown endsAt={SALE_ENDS_AT} className="justify-center" />
            </div>
          ) : null}
          <div className="mt-4">
            <BookSocialProof tone="dark" />
          </div>

          {/* Email signup — above the fold */}
          <div
            id="book-list"
            className="mt-10 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5 sm:p-6"
            data-reveal
          >
            <p className="eyebrow">
              Get on the list
            </p>
            <p className="mb-3 mt-1 font-display text-lg font-black leading-tight text-[var(--color-cream)]">
              Book updates, the release date, and the opening chapter free.
            </p>
            <BookEmailSignup source="book_sales_hero" tone="dark" />
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14" data-reveal>
        <p className="eyebrow">
          What this book is
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
          My story. My records. My experience. Told straight.
        </h2>
        <p className="mt-4 text-lg font-semibold leading-8 text-[var(--color-ink-soft)]">
          {BOOK.positioning} It is written in the first person and grounded in
          the documented record where the record exists.
        </p>
      </section>

      {/* What it covers */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="eyebrow">
            What the book covers
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            The whole arc, in order.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {BOOK_COVERS.map((c, i) => (
              <div
                key={c.title}
                className="panel p-5"
                data-reveal
                style={{ "--d": i % 2 } as React.CSSProperties}
              >
                <p className="font-mono text-xs font-black text-[var(--color-gold)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why I am writing this */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-accent-soft)]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14" data-reveal>
          <p className="eyebrow">
            Why I am writing this
          </p>
          <p className="mt-3 font-display text-2xl font-black leading-snug tracking-normal text-[var(--color-ink)] sm:text-3xl">
            {whyImWriting}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-gold)]">
            — {BOOK.author}
          </p>
        </div>
      </section>

      {/* Pre-order offers */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="eyebrow" data-reveal>
          Pre-order
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
          Three ways to get it first.
        </h2>
        <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
          Pre-order direct, here, before the book goes to Amazon. Delivery dates
          are announced as the manuscript, editing, and printing schedule is
          finalized.
        </p>
        <div className="mt-6">
          <BookOffers ctaHref="/book/preorder" ctaLabel="Choose" />
          <BookShare
            url={`${SITE.url}/book`}
            text="Fighting Shadows — Ryan Nichols's first-person account of January 6 and the fight to put the record in public view. Pre-order direct:"
            className="mt-6 justify-center"
          />
        </div>
        <p className="mt-4 text-sm font-semibold text-[var(--color-muted)]">
          See full details on the{" "}
          <Link
            href="/book/preorder"
            className="font-black text-[var(--color-gold)] underline underline-offset-4"
          >
            pre-order page
          </Link>
          .
        </p>
      </section>

      {/* Evidence / archive connection */}
      <section className="bg-[var(--color-surface)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="eyebrow" data-reveal>
            The book and the record
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal text-[var(--color-cream)] sm:text-4xl">
            It does not stand alone.
          </h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
            The book sits on top of a public archive — filings, transcripts,
            bodycam, and grievances — that you can read for yourself.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {archiveLinks.map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5 transition hover:border-[var(--color-gold)]"
                data-reveal
                style={{ "--d": i } as React.CSSProperties}
              >
                <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-cream)]">
                  {a.label}
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink-soft)]">
                  {a.desc}
                </p>
                <p className="mt-3 text-sm font-black text-[var(--color-gold-bright)] group-hover:underline">
                  Open →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="eyebrow" data-reveal>
          Questions
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
          Straight answers.
        </h2>
        <div className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          {BOOK_FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-black tracking-normal text-[var(--color-ink)] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  className="text-xl font-black text-[var(--color-gold)] transition group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-surface)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-black leading-tight tracking-normal text-[var(--color-cream)] sm:text-4xl">
              Put your name on the record.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
              Pre-order the book, or get on the list for the release date and the
              opening chapter free.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/book/preorder"
              className="btn-accent inline-flex min-h-12 items-center justify-center px-6 py-3 text-base"
            >
              Pre-order the book
            </Link>
            <Link
              href="#book-list"
              className="btn-blue inline-flex min-h-12 items-center justify-center px-6 py-3 text-base"
            >
              Get on the list
            </Link>
          </div>
          <div className="mt-8">
            <BookDisclaimer className="border-[var(--color-line-soft)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]" />
          </div>
          <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]">
            <Link href="/" className="font-semibold underline hover:text-[var(--color-gold-bright)]">
              ← Back to RealRyanNichols.com
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}
