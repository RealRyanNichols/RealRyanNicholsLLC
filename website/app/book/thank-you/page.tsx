import type { Metadata } from "next";
import Link from "next/link";
import { BOOK } from "@/lib/book";
import { SITE } from "@/lib/site";

const title = "Thank You — Fighting Shadows | Ryan Nichols";
const description = "Thank you for your pre-order of Fighting Shadows.";

// Post-purchase page — keep it out of search.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book/thank-you` },
  robots: { index: false, follow: false },
};

const steps = [
  {
    t: "Watch your email",
    b: "A confirmation and your receipt go to the email you used at checkout. Every writing, editing, and printing update comes the same way.",
  },
  {
    t: "Digital editions",
    b: "When the digital edition is ready, it arrives as a secure download link tied to your order — no public file, just yours.",
  },
  {
    t: "Signed copies",
    b: "If you ordered a signed paperback or the Founding Supporter Edition, shipping details will be collected or confirmed before anything is printed and mailed.",
  },
];

export default function BookThankYouPage() {
  return (
    <article className="rrn-page">
      <section className="bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#e1bd5b]">
            {BOOK.title}
          </p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-6xl">
            Thank you. You are on the record.
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
            Your pre-order helps put the full story in public view — and gets it
            to you first. Here is what happens next.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-3">
          {steps.map((s, i) => (
            <div
              key={s.t}
              className="flex gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <span className="font-mono text-sm font-black text-[var(--color-muted)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                  {s.t}
                </h2>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {s.b}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 sm:p-5">
          <p className="text-sm font-bold leading-relaxed text-[var(--color-ink)]">
            A final release date will be posted once the manuscript, editing, and
            printing schedule is set. I will not promise a date until I can keep
            it.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/book/updates"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
          >
            See book updates
          </Link>
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[var(--color-accent)] px-6 py-3 text-base font-black text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
          >
            Back to the book
          </Link>
        </div>
      </section>
    </article>
  );
}
