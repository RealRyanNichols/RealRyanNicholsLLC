import type { Metadata } from "next";
import Link from "next/link";
import { BookWaitlist } from "@/components/BookWaitlist";
import { SITE } from "@/lib/site";

const title = "The Book — Coming Soon | Ryan Nichols";
const description =
  "Ryan Nichols is writing the full story — Marine, January 6, the D.C. jail, the pardon, and the lawfare that followed. Join the waitlist to see the cover, the title, and the release date first.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/book` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/book`,
  },
  twitter: { card: "summary_large_image", title, description },
};

const heroSub =
  "From the Marine Corps and search-and-rescue work, to January 6th and nearly four years tangled in the federal system, to the pardon and the lawfare that came home with me — this is the full account, told straight. Get on the list and you are the first to see the cover, the title, and the release date.";

const whatItIs =
  "This is not a hot take or a press clipping. It is the long version — the parts that got left out, the documents, the names, the nights in the D.C. jail, and what it actually costs to be told you no longer get to defend yourself. It is also a story about faith, family, and refusing to disappear.";

const perks: { title: string; body: string }[] = [
  {
    title: "First access",
    body: "The list gets the launch announcement before the public — and the first chance to buy.",
  },
  {
    title: "Cover & title reveal",
    body: "You see the cover, the title, and the release date before anyone else.",
  },
  {
    title: "Founding-reader price",
    body: "A launch price reserved for the people who showed up early.",
  },
  {
    title: "Signed copies",
    body: "A limited run of signed copies — list members get first shot.",
  },
];

const themes: { label: string; body: string }[] = [
  {
    label: "The tunnel",
    body: "January 6th from the inside — and the bodycam footage that tells the truth about that day.",
  },
  {
    label: "The cell",
    body: "Nearly four years in the system, including the D.C. jail, and the men I met there.",
  },
  {
    label: "Coming home",
    body: "A pardon — and a homecoming into divorce, fraud, and criminal charges waiting at the door.",
  },
  {
    label: "The fight",
    body: "Why I publish everything, why access to my own voice is survival, and how I fight back in the open.",
  },
];

const forWhom =
  "For anyone who has been lied about, locked out, or told to be quiet — and for the people who still believe the truth is worth the receipts.";

const fromRyan =
  "I am putting my name, my family, and my record on the line to tell this straight. If you want it the way it actually happened — not the way they spun it — get on the list. You will hear it from me first.";

export default function BookPage() {
  return (
    <article className="rrn-page">
      {/* Hero */}
      <section className="border-b border-[#203a64] bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7fe3a9]">
              Coming soon · The book
            </p>
            <h1 className="mt-3 font-display text-4xl font-black leading-[1.03] tracking-normal text-[#fdf8ea] sm:text-6xl">
              My story. All of it. In my own words.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#cfd9ea] sm:text-lg">
              {heroSub}
            </p>
            <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:p-5">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#7fe3a9]">
                Join the waitlist
              </p>
              <BookWaitlist source="book_hero" tone="dark" />
            </div>
          </div>

          {/* Cover placeholder */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[20rem]">
              <div className="aspect-[2/3] overflow-hidden rounded-r-lg rounded-l-sm border border-white/15 bg-gradient-to-br from-[#142a52] to-[#0a1730] shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7fe3a9]">
                    Cover reveal
                  </span>
                  <span className="mt-3 font-display text-2xl font-black leading-tight text-[#fdf8ea]">
                    Coming soon
                  </span>
                  <span className="mt-3 h-px w-12 bg-white/20" aria-hidden />
                  <span className="mt-3 text-xs font-semibold leading-relaxed text-[#cfd9ea]">
                    The list sees the cover and title first.
                  </span>
                  <span className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#d8c89e]">
                    Ryan Nichols
                  </span>
                </div>
              </div>
              <div
                className="absolute -bottom-3 left-3 right-3 h-3 rounded-b-lg bg-black/40 blur-md"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          What this book is
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
          The long version — receipts and all.
        </h2>
        <p className="mt-4 text-lg font-semibold leading-8 text-[var(--color-ink-soft)]">
          {whatItIs}
        </p>
      </section>

      {/* Themes */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Inside
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            Four chapters of a fight that is still going.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {themes.map((t, i) => (
              <div
                key={t.label}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
              >
                <p className="font-mono text-xs font-black text-[var(--color-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-2xl font-black tracking-normal text-[var(--color-ink)]">
                  {t.label}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Why join the list
        </p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal sm:text-4xl">
          The early readers get treated like it.
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
            >
              <h3 className="font-display text-xl font-black tracking-normal text-[var(--color-ink)]">
                {p.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* From Ryan */}
      <section className="border-y border-[var(--color-line)] bg-[var(--color-accent-soft)]">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 lg:py-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent)]">
            From Ryan
          </p>
          <p className="mt-3 font-display text-2xl font-black leading-snug tracking-normal text-[var(--color-ink)] sm:text-3xl">
            {fromRyan}
          </p>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--color-ink-soft)]">
            {forWhom}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#071126] text-[#fdf8ea]">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="text-center">
            <h2 className="font-display text-3xl font-black leading-tight tracking-normal text-[#fdf8ea] sm:text-4xl">
              Be on the list before the cover drops.
            </h2>
            <p className="mt-3 text-base font-semibold leading-7 text-[#cfd9ea]">
              Name, email, and phone. That is it. You will be first to know when
              it is real.
            </p>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:p-6">
            <BookWaitlist source="book_footer" tone="dark" />
          </div>
          <p className="mt-6 text-center text-sm text-[#cfd9ea]">
            <Link href="/" className="font-semibold underline hover:text-[#7fe3a9]">
              ← Back to RealRyanNichols.com
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}
