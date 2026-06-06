import type { Metadata } from "next";
import Link from "next/link";
import { BookEmailSignup } from "@/components/BookEmailSignup";
import { BOOK, BOOK_UPDATES, type BookUpdateStatus } from "@/lib/book";
import { SITE } from "@/lib/site";

const title = "Book Updates — Fighting Shadows | Ryan Nichols";
const description =
  "Writing, editing, and printing milestones for Fighting Shadows by Ryan Nichols. Follow the record as the book comes together.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/updates` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book/updates`,
    images: [{ url: BOOK.ogImage, width: 1200, height: 800, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [BOOK.ogImage] },
};

function statusClass(status: BookUpdateStatus): string {
  switch (status) {
    case "Announcement":
      return "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]";
    case "Writing":
      return "border-[var(--color-gold)] bg-[var(--color-gold-soft)] text-[var(--color-support-strong)]";
    case "Editing":
      return "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)]";
    case "Production":
    default:
      return "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]";
  }
}

export default function BookUpdatesPage() {
  return (
    <article className="rrn-page">
      {/* Hero */}
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title} · Updates
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            Follow the record as it comes together.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
            Every milestone — writing, editing, printing, and release — gets
            posted here. No hype, just where the book actually stands.
          </p>
        </div>
      </section>

      {/* Update log */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <ol className="relative border-l-2 border-[var(--color-line)]">
          {BOOK_UPDATES.map((u) => (
            <li key={`${u.date}-${u.title}`} className="mb-8 ml-6 last:mb-0">
              <span
                className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-[var(--color-paper)] bg-[var(--color-accent)]"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(
                    u.status,
                  )}`}
                >
                  {u.status}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--color-muted)]">
                  {u.date}
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-black tracking-normal text-[var(--color-ink)]">
                {u.title}
              </h2>
              <p className="mt-1.5 text-base font-semibold leading-7 text-[var(--color-ink-soft)]">
                {u.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Email signup */}
      <section className="border-t border-[var(--color-line)] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-black leading-tight tracking-normal text-[#fdf8ea] sm:text-4xl">
              Get every update by email.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-[#cfd9ea]">
              Milestones, the release date, and the opening chapter free.
            </p>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:p-6">
            <BookEmailSignup source="book_updates" tone="dark" />
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
