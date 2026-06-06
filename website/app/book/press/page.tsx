import type { Metadata } from "next";
import Link from "next/link";
import { BookWaitlist } from "@/components/BookWaitlist";
import { BOOK } from "@/lib/book";
import { SITE } from "@/lib/site";

const title = "Press & Media — Fighting Shadows | Ryan Nichols";
const description =
  "Press and media resources for Fighting Shadows, the memoir by Ryan Nichols. Book description, author bio, interview topics, and how to request an interview.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/press` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book/press`,
    images: [{ url: BOOK.ogImage, width: 1200, height: 800, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [BOOK.ogImage] },
};

const authorBio =
  "Ryan Nichols is a former United States Marine and search-and-rescue volunteer from East Texas. He was prosecuted in connection with January 6, held for nearly four years in the federal system — including the Washington, D.C. jail — and later pardoned. He now publishes his case file, evidence, and first-person account in the open at RealRyanNichols.com.";

const topics = [
  "January 6 and the public record — what I saw and what the footage shows",
  "Conditions inside the D.C. jail",
  "Forced vaccination and solitary confinement",
  "Coerced plea pressure and due process",
  "Nearly four years in the federal system, and life after a pardon",
  "Building an owned platform instead of relying on social media",
  "Faith and family through incarceration",
];

export default function BookPressPage() {
  return (
    <article className="rrn-page">
      {/* Hero */}
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title} · Press &amp; media
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            For press, podcasts, and media.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
            Everything you need to cover the book or book an interview. For
            anything else, reach out through the contact page.
          </p>
        </div>
      </section>

      {/* Description + bio */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              About the book
            </p>
            <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
              {BOOK.title}
            </h2>
            <p className="mt-1 font-display text-lg font-black uppercase tracking-[0.03em] text-[var(--color-accent)]">
              {BOOK.subtitle}
            </p>
            <p className="mt-4 text-base font-semibold leading-8 text-[var(--color-ink-soft)]">
              {BOOK.positioning}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
              About the author
            </p>
            <h3 className="mt-2 font-display text-2xl font-black tracking-normal text-[var(--color-ink)]">
              {BOOK.author}
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-[var(--color-ink-soft)]">
              {authorBio}
            </p>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Topics I can discuss
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            On the record, in detail.
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <li
                key={t}
                className="flex gap-3 rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] p-4 text-sm font-semibold leading-relaxed text-[var(--color-ink)] shadow-sm"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interview CTA + links */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6 sm:p-8">
          <h2 className="font-display text-3xl font-black leading-tight tracking-normal text-[var(--color-ink)] sm:text-4xl">
            Request an interview.
          </h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
            Podcasts, broadcast, print, independent media — send the details and
            I will follow up. Use the contact page and mention press.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Request an interview
            </Link>
            <Link
              href="/book"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
            >
              View the book
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/case"
            className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
          >
            <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
              The case archive
            </h3>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink-soft)]">
              Filings, timeline, documents, and people — the public record behind
              the book.
            </p>
          </Link>
          <Link
            href="/the-map-room"
            className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
          >
            <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
              The Map Room
            </h3>
            <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink-soft)]">
              The public record, mapped and tracked in real time.
            </p>
          </Link>
        </div>
      </section>

      {/* Email signup */}
      <section className="border-t border-[var(--color-line)] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-black leading-tight tracking-normal text-[#fdf8ea] sm:text-4xl">
              Stay on the press list.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-[#cfd9ea]">
              Get the release date, review copies when available, and book news
              first.
            </p>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:p-6">
            <BookWaitlist source="book_press" tone="dark" />
          </div>
          <p className="mt-6 text-center text-sm text-[#cfd9ea]">
            <Link href="/book" className="font-semibold underline hover:text-[#e1bd5b]">
              ← Back to the book
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}
