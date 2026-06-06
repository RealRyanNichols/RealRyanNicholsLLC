import type { Metadata } from "next";
import Link from "next/link";
import { BookOffers } from "@/components/BookOffers";
import { BookEmailSignup } from "@/components/BookEmailSignup";
import { BookDisclaimer } from "@/components/BookDisclaimer";
import { BOOK } from "@/lib/book";
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
  return (
    <article className="rrn-page">
      {/* Hero */}
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            Pre-order · {BOOK.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            Get it first. Fund the record directly.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
            Pre-order direct from me, here, before the book goes to Amazon. Pick
            the edition that fits — every one helps put the full record in public
            view.
          </p>
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
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <BookOffers ctaHref="#reserve" ctaLabel="Reserve" />
        <p className="mt-4 text-center text-sm font-semibold text-[var(--color-muted)]">
          Secure Stripe checkout opens soon. Reserve your edition below and you
          will be first to complete your pre-order.
        </p>
      </section>

      {/* Reserve / email capture */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div id="reserve" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Reserve your edition
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            Lock your spot in line.
          </h2>
          <p className="mt-3 text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
            Add your name and you will be first to complete your pre-order the
            moment checkout opens — plus you get the release date and the opening
            chapter free.
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
              t: "You reserve",
              b: "Pick an edition and reserve it. When checkout opens, you complete your pre-order with secure Stripe checkout.",
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
