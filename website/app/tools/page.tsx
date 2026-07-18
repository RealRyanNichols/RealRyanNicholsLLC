import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolsHub } from "@/components/FreeToolsHub";
import { BookCtaBand } from "@/components/BookCtaBand";
import { SITE } from "@/lib/site";

const title = "Free Tools | Real Ryan Nichols";
const description =
  "Free tools to build your case file, learn your rights, and draft public-records requests, pro se motions, timeline cards, and a next-three-moves plan — while helping Real Ryan Nichols spot public patterns.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/tools` },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.url}/tools`,
    images: [`${SITE.url}/og/site`],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${SITE.url}/og/site`],
  },
};

export default function ToolsPage() {
  return (
    <article className="rrn-page">
      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-success)]">
              Free tools / public patterns
            </p>
            <h1 className="mt-2 font-display text-3xl font-black leading-tight tracking-normal text-[var(--color-ink)] sm:text-4xl">
              Get something useful. Help map what people need.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
              These tools give you a draft, a timeline card, or a plain-English
              next-step checklist right away. The site also saves a structured
              signal so Ryan can see what people are dealing with by community,
              agency, issue, missing record, and deadline.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/case/intake"
                className="rounded-md border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-2 text-sm font-black text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
              >
                See public signals
              </Link>
              <Link
                href="/store/strategy-call-30"
                className="rounded-md border-2 border-[var(--color-support)] bg-[var(--color-support)] px-4 py-2 text-sm font-black text-[var(--color-ink)] transition hover:bg-[var(--color-support-soft)]"
              >
                Build with Ryan
              </Link>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <MiniDeal label="Free now" text="Copy the output immediately." />
            <MiniDeal label="Data first" text="Track use, completion, and demand." />
          </div>
        </div>
      </section>

      {/* Flagship tool — the records generator, front and center */}
      <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
        <Link
          href="/tools/records-request"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)]/50 p-5 transition hover:border-[var(--color-accent)] sm:p-6"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
              New · Free · No signup
            </p>
            <p className="mt-1 font-display text-xl font-black tracking-tight text-[var(--color-ink)] sm:text-2xl">
              Records &amp; Bodycam Request Generator
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Bodycam. Dispatch. 911 audio. Jail medical. Grievances. Pick what
              you need and walk away with a statute-correct request letter —
              Texas Public Information Act or federal FOIA — ready to send.
            </p>
          </div>
          <span className="btn-accent shrink-0 rounded-full px-5 py-2.5 text-sm font-bold">
            Build my letter →
          </span>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
        <BookCtaBand />
      </section>

      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-6 lg:py-6">
        <FreeToolsHub />
      </section>
    </article>
  );
}

function MiniDeal({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--color-ink-soft)]">
        {text}
      </p>
    </div>
  );
}
